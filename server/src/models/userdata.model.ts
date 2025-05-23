import mongoose, { Document, Schema } from 'mongoose';
import { AppData, Emotion, Goal, Initiative, CheckIn, JournalEntry, Action } from '../types/app.types';

// Interface for the UserData document
export interface IUserData extends Document {
  userId: mongoose.Types.ObjectId;
  emotions: Emotion[];
  actions: Action[];
  journalEntries: JournalEntry[];
  goals: Goal[];
  initiatives: Initiative[];
  checkIns: CheckIn[];
  settings: {
    customEmotions: boolean;
    theme: 'light' | 'dark';
    aiEnabled: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
  isSubscribed: boolean;
  subscriptionType: 'yearly' | 'monthly' | null;
  subscriptionEnd: Date | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  activeProductId: string | null;
}

// Emotion Schema
const EmotionSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  emoji: { type: String, required: true },
  isPositive: { type: Boolean, required: true }
});

// Emotion Record Schema
const EmotionRecordSchema = new Schema({
  emotionId: { type: String, required: true },
  timestamp: { type: String, required: true },
  action: { type: String },
  timeInMinutes: { type: Number },
  suggestionSelected: { type: String },
  followup: { type: String },
  feedback: { type: Schema.Types.Mixed },
});

// Action Schema
const ActionSchema = new Schema({
  id: { type: String, required: true },
  text: { type: String, required: true },
  completed: { type: Boolean, default: false },
  timestamp: { type: String, required: true },
  emotionId: { type: String, required: true }
});

// Journal Entry Schema
const JournalEntrySchema = new Schema({
  id: { type: String, required: true },
  date: { type: String, required: true },
  content: { type: String, default: '' },
  emotionRecords: [EmotionRecordSchema],
  actions: [String]
});

// Check-In Schema
const CheckInSchema = new Schema({
  id: { type: String, required: true },
  content: { type: String, required: true },
  timestamp: { type: String, required: true },
  entityId: { type: String, required: true },
  entityType: { type: String, enum: ['goal', 'initiative'], required: true }
});

// Initiative Schema
const InitiativeSchema = new Schema({
  id: { type: String, required: true },
  text: { type: String, required: true },
  completed: { type: Boolean, default: false },
  goalId: { type: String, required: true },
  createdAt: { type: String, required: true },
  completedAt: { type: String }
});

// Goal Schema
const GoalSchema = new Schema({
  id: { type: String, required: true },
  text: { type: String, required: true },
  description: { type: String, default: '' },
  completed: { type: Boolean, default: false },
  isFixed: { type: Boolean, default: false },
  createdAt: { type: String, required: true },
  completedAt: { type: String }
});

// Settings Schema
const SettingsSchema = new Schema({
  customEmotions: { type: Boolean, default: false },
  theme: { type: String, enum: ['light', 'dark'], default: 'dark' },
  aiEnabled: { type: Boolean, default: true }
});

// UserData Schema
const UserDataSchema = new Schema<IUserData>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    emotions: [EmotionSchema],
    actions: [ActionSchema],
    journalEntries: [JournalEntrySchema],
    goals: [GoalSchema],
    initiatives: [InitiativeSchema],
    checkIns: [CheckInSchema],
    settings: SettingsSchema,
    isSubscribed: { type: Boolean, default: false },
    subscriptionType: { type: String, enum: ['yearly', 'monthly', null], default: null },
    subscriptionEnd: { type: Date, default: null },
    stripeCustomerId: { type: String, default: null },
    stripeSubscriptionId: { type: String, default: null },
    activeProductId: { type: String, default: null }
  },
  {
    timestamps: true
  }
);

// Create and export the UserData model
const UserData = mongoose.model<IUserData>('UserData', UserDataSchema);
export default UserData; 