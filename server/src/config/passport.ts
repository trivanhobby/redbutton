import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
// import { Strategy as FacebookStrategy } from 'passport-facebook';
// import AppleStrategy from 'passport-apple';
// import type { VerifyFunction as FacebookVerifyFunction } from 'passport-facebook';
// import type { VerifyCallback as AppleVerifyCallback } from 'passport-apple';
import dotenv from 'dotenv';
import User from '../models/user.model';
import { initializeUserData } from '../controllers/auth.controller';

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
  callbackURL: process.env.GOOGLE_CALLBACK_URL || ''
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
        // Create new user without requiring invitation
        const newUser = new User({
          email: profile.emails?.[0]?.value,
          googleId: profile.id,
          name: profile.displayName,
          picture: profile.photos?.[0]?.value,
          status: 'active',
          role: 'user'
        });
        
        await newUser.save();
        
        // Initialize user data with default values
        if (newUser._id) {
          await initializeUserData(newUser._id.toString());
        }
        
        return done(null, newUser);
      }
    } catch (error) {
      return done(error, false);
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