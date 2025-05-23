import { Request, Response } from 'express';
import User, { IUser } from '../models/user.model';
import Invite from '../models/invite.model';
import UserData from '../models/userdata.model';
import { generateToken, generateTempToken } from '../utils/jwt';
import { sendInviteEmail } from '../utils/email';
import bcrypt from 'bcryptjs';
import { addDays } from 'date-fns';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { defaultEmotions, getDefaultUserData, getDefaultSettings } from '../utils/defaults';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Login with email and password
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    // Find user by email
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
      return;
    }
    
    // Check if user is active
    if (user.status !== 'active') {
      res.status(403).json({ 
        success: false, 
        message: 'Your account is not active' 
      });
      return;
    }
    
    // Check if user was created with OAuth and doesn't have a password
    if (!user.password) {
      res.status(400).json({ 
        success: false, 
        message: 'Please sign in with Google' 
      });
      return;
    }
    // Verify password
    const isValid = await user.comparePassword(password);
    if (!isValid) {
      res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
      return;
    }
    
    // Generate JWT token
    const token = generateToken(user);
    
    // Return user info and token
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login' 
    });
  }
};

// Register a new user with email and password
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, inviteToken } = req.body;

    // Validate password
    if (!password || password.length < 8) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters'
      });
      return;
    }

    // If inviteToken is present, use old flow
    if (inviteToken) {
      // Find user with invite token
      const invitedUser = await User.findOne({ 
        inviteToken,
        status: 'invited'
      });
      
      if (!invitedUser) {
        res.status(404).json({
          success: false,
          message: 'Invalid invite token or already used'
        });
        return;
      }
      
      // Check if token is expired
      if (invitedUser.inviteExpires && invitedUser.inviteExpires < new Date()) {
        res.status(400).json({
          success: false,
          message: 'Invite token has expired'
        });
        return;
      }
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Update user status and set password
      invitedUser.password = hashedPassword;
      invitedUser.status = 'active';
      invitedUser.inviteToken = undefined;
      invitedUser.inviteExpires = undefined;
      
      await invitedUser.save();
      
      // Initialize user data with default values
      if (invitedUser._id) {
        await initializeUserData(invitedUser._id.toString());
      }
      
      // Generate JWT token
      const token = generateToken(invitedUser);
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token,
        user: {
          id: invitedUser._id,
          email: invitedUser.email,
          name: invitedUser.name,
          role: invitedUser.role
        }
      });
      return;
    }

    // Open registration: check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.status === 'active') {
      res.status(400).json({
        success: false,
        message: 'User already exists and is active'
      });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({
      email,
      password: hashedPassword,
      status: 'active',
      role: 'user'
    });
    await newUser.save();

    // Initialize user data with default values
    if (newUser._id) {
      await initializeUserData(newUser._id.toString());
    }

    // Generate JWT token
    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register user'
    });
  }
};

// Create a new invitation
export const createInvite = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    const userId = req.user?._id;
    
    if (!userId) {
      res.status(401).json({ 
        success: false, 
        message: 'Unauthorized' 
      });
      return;
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
      return;
    }
    
    // Check if invitation already exists and is pending
    const existingInvite = await Invite.findOne({ 
      email, 
      status: 'pending' 
    });
    
    if (existingInvite) {
      // Update the expiration date and regenerate token
      existingInvite.token = crypto.randomBytes(32).toString('hex');
      existingInvite.expires = addDays(new Date(), 7);
      await existingInvite.save();
      
      // Generate invite URL
      const inviteUrl = `${process.env.CLIENT_URL}/accept-invite?token=${existingInvite.token}&email=${encodeURIComponent(email)}`;
      
      // Send invitation email
      await sendInviteEmail(email, existingInvite.token, inviteUrl);
      
      res.status(200).json({ 
        success: true, 
        message: 'Invitation resent successfully' 
      });
      return;
    }
    
    // Create new invitation
    const token = crypto.randomBytes(32).toString('hex');
    const newInvite = new Invite({
      email,
      token,
      expires: addDays(new Date(), 7),
      createdBy: userId
    });
    
    await newInvite.save();
    
    // Generate invite URL
    const inviteUrl = `${process.env.CLIENT_URL}/accept-invite?token=${token}&email=${encodeURIComponent(email)}`;
    
    // Send invitation email
    await sendInviteEmail(email, token, inviteUrl);
    
    res.status(201).json({ 
      success: true, 
      message: 'Invitation sent successfully' 
    });
  } catch (error) {
    console.error('Create invitation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error creating invitation' 
    });
  }
};

// Verify invite token
export const verifyInvite = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;
    
    if (!token) {
      res.status(400).json({
        success: false,
        message: 'Invite token is required'
      });
      return;
    }
    
    // Find user with invite token
    const invitedUser = await User.findOne({
      inviteToken: token,
      status: 'invited'
    });
    
    if (!invitedUser) {
      res.status(404).json({
        success: false,
        message: 'Invalid invite token or already used'
      });
      return;
    }
    
    // Check if token is expired
    if (invitedUser.inviteExpires && invitedUser.inviteExpires < new Date()) {
      res.status(400).json({
        success: false,
        message: 'Invite token has expired'
      });
      return;
    }
    
    // Return success with user email
    res.status(200).json({
      success: true,
      message: 'Invite token is valid',
      data: {
        email: invitedUser.email
      }
    });
  } catch (error) {
    console.error('Error verifying invite token:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying invite token'
    });
  }
};

// Handle Google OAuth callback
export const googleCallback = (req: Request, res: Response): void => {
  // Passport should have already authenticated the user and added it to req.user
  if (!req.user) {
    res.redirect(`${process.env.CLIENT_URL}/login?error=authentication_failed`);
    return;
  }
  
  // Generate JWT token
  const token = generateToken(req.user as IUser);
  
  // Redirect to client with token
  res.redirect(`${process.env.CLIENT_URL}/auth/google/callback?token=${token}`);
};

// Get current user info
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    
    if (!userId) {
      res.status(401).json({ 
        success: false, 
        message: 'Unauthorized' 
      });
      return;
    }
    
    const user = await User.findById(userId).select('-password');
    if (!user) {
      res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error getting user info' 
    });
  }
};

// Initialize a new user's data with defaults
export const initializeUserData = async (userId: mongoose.Types.ObjectId | string): Promise<void> => {
  try {
    // Convert userId to ObjectId if it's a string
    const userIdObj = typeof userId === 'string' 
      ? new mongoose.Types.ObjectId(userId) 
      : userId;
      
    // Create default user data
    const defaultData = getDefaultUserData();
    const defaultSettings = getDefaultSettings();
    
    const userData = new UserData({
      userId: userIdObj,
      ...defaultData,
      settings: defaultSettings
    });
    
    await userData.save();
  } catch (error) {
    console.error('Error initializing user data:', error);
    throw error;
  }
};

// Generate invite link with admin secret key
export const generateInviteLink = async (req: Request, res: Response): Promise<void> => {
  try {
    // Verify admin secret key from environment variable or hardcoded for now
    const { email, adminSecret } = req.body;
    
    const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || 'your_admin_secret_key_change_me';
    
    if (!adminSecret || adminSecret !== ADMIN_SECRET_KEY) {
      res.status(403).json({
        success: false,
        message: 'Invalid admin secret key'
      });
      return;
    }
    
    if (!email || !email.includes('@')) {
      res.status(400).json({
        success: false,
        message: 'Invalid email address'
      });
      return;
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.status === 'active') {
      res.status(400).json({
        success: false,
        message: 'User already exists and is active'
      });
      return;
    }
    
    // Generate token
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    // Create or update invite
    let userId; 
    
    if (existingUser) {
      // Update existing user's invite token
      existingUser.inviteToken = inviteToken;
      existingUser.inviteExpires = expires;
      await existingUser.save();
      userId = existingUser._id;
    } else {
      // Create a new user with 'invited' status
      const newUser = new User({
        email,
        status: 'invited',
        role: 'user',
        inviteToken,
        inviteExpires: expires
      });
      await newUser.save();
      
      // Initialize user data (but without sending email)
      if (newUser._id) {
        await initializeUserData(newUser._id.toString());
      }
      userId = newUser._id;
    }
    
    // Generate invite URLs for both web and desktop clients
    const webInviteUrl = `${process.env.CLIENT_URL || 'redbutton:/'}/register?token=${inviteToken}`;
    
    // Create deeplink URL for the desktop app using the redbutton:// protocol
    const desktopInviteUrl = `redbutton://register?token=${inviteToken}`;
    
    // Return both invite URLs
    res.status(200).json({
      success: true,
      message: 'Invite link generated successfully',
      webInviteUrl,
      desktopInviteUrl,
      inviteToken,
      userId: userId?.toString(),
      instructions: "Send the web link for browser access or the desktop link for direct app opening"
    });
  } catch (error) {
    console.error('Error generating invite:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating invite'
    });
  }
};

// Facebook OAuth callback
export const facebookCallback = (req: Request, res: Response): void => {
  if (!req.user) {
    res.redirect(`${process.env.CLIENT_URL}/login?error=facebook_auth_failed`);
    return;
  }
  const token = generateToken(req.user as IUser);
  res.redirect(`${process.env.CLIENT_URL}/auth/facebook/callback?token=${token}`);
};

// Apple OAuth callback
export const appleCallback = (req: Request, res: Response): void => {
  if (!req.user) {
    res.redirect(`${process.env.CLIENT_URL}/login?error=apple_auth_failed`);
    return;
  }
  const token = generateToken(req.user as IUser);
  res.redirect(`${process.env.CLIENT_URL}/auth/apple/callback?token=${token}`);
};

// OAuth login/register handler
export const oauthLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { provider, token } = req.body;

    if (!provider || !token) {
      res.status(400).json({
        success: false,
        message: 'Provider and token are required'
      });
      return;
    }

    let userInfo;
    // Verify token with provider and get user info
    switch (provider) {
      case 'google':
        // Verify Google token and get user info
        const ticket = await client.verifyIdToken({
          idToken: token,
          audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        if (!payload) {
          throw new Error('Invalid Google token');
        }
        userInfo = {
          email: payload.email,
          name: payload.name,
          picture: payload.picture,
          provider: 'google'
        };
        break;
      // Add other providers here (Facebook, Apple, etc.)
      default:
        res.status(400).json({
          success: false,
          message: 'Unsupported provider'
        });
        return;
    }

    // Find or create user
    let user = await User.findOne({ email: userInfo.email });
    
    if (!user) {
      // Create new user
      user = new User({
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        status: 'active',
        role: 'user',
        oauthProvider: userInfo.provider
      });
      await user.save();

      // Initialize user data
      if (user._id) {
        await initializeUserData(user._id.toString());
      }
    } else if (user.status !== 'active') {
      res.status(403).json({
        success: false,
        message: 'Your account is not active'
      });
      return;
    }

    // Generate JWT token
    const jwtToken = generateToken(user);

    // Return user info and token
    res.status(200).json({
      success: true,
      token: jwtToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        role: user.role
      }
    });
  } catch (error) {
    console.error('OAuth login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during OAuth authentication'
    });
  }
}; 