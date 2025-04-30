import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

// Define user status types
export type UserStatus = 'invited' | 'active' | 'inactive' | 'blocked';

// Define the User document interface
export interface IUser extends Document {
  email: string;
  password?: string;
  name?: string;
  picture?: string;
  googleId?: string;
  role: 'user' | 'admin';
  status: UserStatus;
  apiKey?: string;
  inviteToken?: string;
  inviteExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword: (candidatePassword: string) => Promise<boolean>;
}

// Create the user schema
const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      select: false
    },
    name: {
      type: String,
      trim: true
    },
    picture: {
      type: String
    },
    googleId: {
      type: String,
      sparse: true,
      unique: true
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    status: {
      type: String,
      enum: ['invited', 'active', 'inactive', 'blocked'],
      default: 'active'
    },
    apiKey: {
      type: String,
      select: false
    },
    inviteToken: {
      type: String
    },
    inviteExpires: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Method to compare a candidate password with the user's hashed password
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    // If no password set (e.g., Google auth), return false
    if (!this.password) {
      console.log('Password comparison failed: No password set for user');
      return false;
    }
    
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    if (!isMatch) {
      console.log('Password comparison failed: Passwords do not match');
    }
    return isMatch;
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
};

// Create and export the User model
const User = mongoose.model<IUser>('User', userSchema);
export default User; 