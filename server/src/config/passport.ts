import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
// import { Strategy as FacebookStrategy } from 'passport-facebook';
// import AppleStrategy from 'passport-apple';
// import type { VerifyFunction as FacebookVerifyFunction } from 'passport-facebook';
// import type { VerifyCallback as AppleVerifyCallback } from 'passport-apple';
import dotenv from 'dotenv';
import User from '../models/user.model';
import { initializeUserData } from '../controllers/auth.controller';
import { Request } from 'express';
import { generateToken } from '../utils/jwt';

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
  callbackURL: process.env.GOOGLE_CALLBACK_URL || '',
  passReqToCallback: true as const,
  scope: ['profile', 'email']
};

passport.use(
  new GoogleStrategy(googleOptions, async (
    req: Request,
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: any, user?: any) => void
  ) => {
    try {
      console.log('Google strategy - Profile:', profile);
      // Get email from profile
      const email = profile.emails?.[0].value;
      if (!email) {
        console.error('No email in Google profile');
        return done(new Error('No email received from Google'));
      }

      // Find or create user
      let user = await User.findOne({ email });
      
      if (!user) {
        user = new User({
          email,
          name: profile.displayName,
          picture: profile.photos?.[0].value,
          status: 'active',
          role: 'user',
          oauthProvider: 'google',
          googleId: profile.id
        });
        await user.save();
      } else if (!user.googleId) {
        // Update existing user with Google ID if not set
        user.googleId = profile.id;
        user.name = user.name || profile.displayName;
        user.picture = user.picture || profile.photos?.[0].value;
        await user.save();
      }
      
      // Generate our JWT token here since we have the user
      const token = generateToken(user);
      
      // Add the token to the user object
      const userWithToken = {
        ...user.toObject(),
        token
      };
      
      return done(null, userWithToken);
    } catch (error) {
      console.error('Google strategy error:', error);
      return done(error as Error);
    }
  })
);

// // Facebook
// passport.use(new FacebookStrategy({
//   clientID: process.env.FACEBOOK_APP_ID!,
//   clientSecret: process.env.FACEBOOK_APP_SECRET!,
//   callbackURL: `${process.env.REACT_APP_API_URL || 'http://localhost:4000/api'}/auth/facebook/callback`,
//   profileFields: ['id', 'emails', 'name', 'displayName', 'photos']
// }, async (accessToken: any, refreshToken: any, profile: any, done: any) => {
//   try {
//     let email = profile.emails && profile.emails[0] && profile.emails[0].value;
//     if (!email) return done(new Error('No email from Facebook'), undefined);
//     let user = await User.findOne({ email });
//     if (!user) {
//       user = new User({
//         email,
//         name: profile.displayName,
//         status: 'active',
//         role: 'user',
//         facebookId: profile.id,
//         picture: profile.photos?.[0]?.value
//       });
//       await user.save();
//     }
//     done(null, user);
//   } catch (err) {
//     done(err, undefined);
//   }
// }));

// Apple
// passport.use(new AppleStrategy({
//   clientID: process.env.APPLE_CLIENT_ID!,
//   teamID: process.env.APPLE_TEAM_ID!,
//   keyID: process.env.APPLE_KEY_ID!,
//   privateKeyString: process.env.APPLE_PRIVATE_KEY!,
//   callbackURL: `${process.env.REACT_APP_API_URL || 'http://localhost:4000/api'}/auth/apple/callback`
// }, async (accessToken: any, refreshToken: any, idToken: any, profile: any, done: any) => {
//   try {
//     let email = profile.email;
//     if (!email) return done(new Error('No email from Apple'), undefined);
//     let user = await User.findOne({ email });
//     if (!user) {
//       user = new User({
//         email,
//         name: profile.name?.fullName || '',
//         status: 'active',
//         role: 'user',
//         appleId: profile.id
//       });
//       await user.save();
//     }
//     done(null, user);
//   } catch (err) {
//     done(err, undefined);
//   }
// }));

export default passport; 