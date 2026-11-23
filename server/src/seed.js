import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Activity, ActivityEvent, Challenge, ChallengeMembership, User } from './models.js';

await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/teampulse');
const passwordHash = await bcrypt.hash('PulseDemo2026!', 12);
const employee = await User.findOneAndUpdate({ email: 'employee@teampulse.local' }, { name: 'Jordan Lee', email: 'employee@teampulse.local', passwordHash, role: 'employee', team: 'Bright Sparks' }, { upsert: true, new: true });
await User.findOneAndUpdate({ email: 'manager@teampulse.local' }, { name: 'Taylor Morgan', email: 'manager@teampulse.local', passwordHash, role: 'manager', team: 'Bright Sparks' }, { upsert: true, new: true });
if (!await Activity.exists({ owner: employee.id })) await Activity.insertMany([
  { owner: employee.id, title: 'Morning walk', type: 'Movement', cadence: 'Daily', private: true, status: 'done', streak: 5, lastCompletedAt: new Date() },
  { owner: employee.id, title: 'Five-minute breathing break', type: 'Mindfulness', cadence: 'Daily', private: true },
  { owner: employee.id, title: 'Screen-free wind-down', type: 'Sleep', cadence: 'Daily', private: true }
]);
const walk = await Activity.findOne({ owner: employee.id, title: 'Morning walk' });
if (walk && !await ActivityEvent.exists({ activity: walk.id, action: 'done' })) await ActivityEvent.create({ owner: employee.id, activity: walk.id, action: 'done', occurredAt: walk.lastCompletedAt || new Date() });
let challenge = await Challenge.findOne({ team: 'Bright Sparks' });
if (!challenge) challenge = await Challenge.create({ title: 'Small Steps, Strong Team', description: 'Build a steady rhythm together. Every completed activity counts.', team: 'Bright Sparks', goal: 30, startDate: new Date(Date.now() - 7 * 86400000), endDate: new Date(Date.now() + 14 * 86400000), badge: 'Consistency star' });
await ChallengeMembership.updateOne({ challenge: challenge.id, member: employee.id }, { $setOnInsert: { challenge: challenge.id, member: employee.id } }, { upsert: true });
console.log('TeamPulse demo data is ready.');
await mongoose.disconnect();
