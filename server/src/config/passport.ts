import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';
import User from '../models/user.model';

dotenv.config();

// JWT Strategy Configuration
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'fallback_jwt_secret'
};

passport.use(
  new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      // Find the user specified in the token
      const user = await User.findById(payload.id);
      
      // If user doesn't exist, handle it
      if (!user) {
        return done(null, false);
      }
      
      // Otherwise, return the user
      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  })
);

// Google OAuth Strategy
const googleOptions = {
  clientID: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:4000/api/auth/google/callback'
};

passport.use(
  new GoogleStrategy(googleOptions, async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists in our database
      let user = await User.findOne({ email: profile.emails?.[0]?.value });
      
      if (user) {
        // If user exists, check if they have a Google ID
        if (!user.googleId) {
          // Update user with Google ID
          user.googleId = profile.id;
          user.name = user.name || profile.displayName;
          user.picture = user.picture || profile.photos?.[0]?.value;
          await user.save();
        }
        return done(null, user);
      } else {
        // Check if the user has an invite
        const existingInvite = await User.findOne({ 
          email: profile.emails?.[0]?.value,
          status: 'invited'
        });
        
        if (!existingInvite) {
          return done(null, false, { message: 'You need an invitation to sign up' });
        }
        
        // Create new user
        const newUser = new User({
          email: profile.emails?.[0]?.value,
          googleId: profile.id,
          name: profile.displayName,
          picture: profile.photos?.[0]?.value,
          status: 'active'
        });
        
        await newUser.save();
        return done(null, newUser);
      }
    } catch (error) {
      return done(error, false);
    }
  })
); 