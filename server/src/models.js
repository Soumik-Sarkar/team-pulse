import mongoose from 'mongoose';

const { Schema, model } = mongoose;
const userSchema = new Schema({
  name: { type: String, required: true, trim: true }, email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true }, role: { type: String, enum: ['employee', 'manager'], default: 'employee' },
  team: { type: String, default: 'Bright Sparks' }, createdAt: { type: Date, default: Date.now }
});
const activitySchema = new Schema({
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, title: { type: String, required: true, trim: true },
  type: { type: String, enum: ['Movement', 'Mindfulness', 'Sleep', 'Nutrition', 'Other'], default: 'Other' },
  cadence: { type: String, enum: ['Daily', 'Weekly'], default: 'Daily' }, private: { type: Boolean, default: true },
  status: { type: String, enum: ['planned', 'done', 'missed'], default: 'planned' }, streak: { type: Number, default: 0 },
  lastCompletedAt: Date, preferredTime: String, createdAt: { type: Date, default: Date.now }
});
const eventSchema = new Schema({ owner: { type: Schema.Types.ObjectId, ref: 'User', required: true }, activity: { type: Schema.Types.ObjectId, ref: 'Activity', required: true }, action: { type: String, enum: ['done', 'missed'], required: true }, occurredAt: { type: Date, default: Date.now } });
const challengeSchema = new Schema({ title: { type: String, required: true }, description: String, team: { type: String, default: 'Bright Sparks' }, goal: { type: Number, default: 20 }, startDate: Date, endDate: Date, badge: { type: String, default: 'Consistency star' }, createdAt: { type: Date, default: Date.now } });
const challengeMembershipSchema = new Schema({ challenge: { type: Schema.Types.ObjectId, ref: 'Challenge', required: true }, member: { type: Schema.Types.ObjectId, ref: 'User', required: true }, joinedAt: { type: Date, default: Date.now }, badgeAwardedAt: Date });
challengeMembershipSchema.index({ challenge: 1, member: 1 }, { unique: true });
const notificationSchema = new Schema({ owner: { type: Schema.Types.ObjectId, ref: 'User', required: true }, message: String, read: { type: Boolean, default: false }, createdAt: { type: Date, default: Date.now } });
export const User = mongoose.models.User || model('User', userSchema);
export const Activity = mongoose.models.Activity || model('Activity', activitySchema);
export const ActivityEvent = mongoose.models.ActivityEvent || model('ActivityEvent', eventSchema);
export const Challenge = mongoose.models.Challenge || model('Challenge', challengeSchema);
export const ChallengeMembership = mongoose.models.ChallengeMembership || model('ChallengeMembership', challengeMembershipSchema);
export const Notification = mongoose.models.Notification || model('Notification', notificationSchema);
