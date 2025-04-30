import mongoose, { Document, Schema } from 'mongoose';
import crypto from 'crypto';

// Define the Invite document interface
export interface IInvite extends Document {
  email: string;
  token: string;
  expires: Date;
  status: 'pending' | 'accepted' | 'expired';
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  isExpired: () => boolean;
}

// Create the invite schema
const inviteSchema = new Schema<IInvite>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    token: {
      type: String,
      required: true,
      unique: true
    },
    expires: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'expired'],
      default: 'pending'
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Method to check if the invite is expired
inviteSchema.methods.isExpired = function(): boolean {
  return new Date() > this.expires;
};

// Static method to generate a unique token
inviteSchema.statics.generateToken = function(): string {
  return crypto.randomBytes(32).toString('hex');
};

// Create and export the Invite model
const Invite = mongoose.model<IInvite>('Invite', inviteSchema);
export default Invite; 