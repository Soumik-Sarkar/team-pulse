import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import { fileURLToPath } from 'node:url';
import { Activity, ActivityEvent, Challenge, ChallengeMembership, Notification, User } from './models.js';
import { authenticate, managerOnly } from './middleware.js';

const app = express();
app.use(helmet()); app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' })); app.use(express.json({ limit: '32kb' }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 100 }));
const spec = YAML.load(fileURLToPath(new URL('../../docs/openapi.yaml', import.meta.url)));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec));
app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'teampulse-api' }));

app.post('/api/auth/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim() || !/^\S+@\S+\.\S+$/.test(email || '') || typeof password !== 'string' || password.length < 10) return res.status(400).json({ error: 'Provide a name, valid email, and password of at least 10 characters' });
    if (await User.exists({ email: email.toLowerCase() })) return res.status(409).json({ error: 'An account with this email already exists' });
    const user = await User.create({ name: name.trim(), email, passwordHash: await bcrypt.hash(password, 12) });
    return res.status(201).json(authResponse(user));
  } catch (e) { if (e.code === 11000) return res.status(409).json({ error: 'An account with this email already exists' }); next(e); }
});
app.post('/api/auth/login', async (req, res, next) => {
  try {
    const user = await User.findOne({ email: String(req.body.email || '').toLowerCase() });
    if (!user || !await bcrypt.compare(req.body.password || '', user.passwordHash)) return res.status(401).json({ error: 'Email or password is incorrect' });
    res.json(authResponse(user));
  } catch (e) { next(e); }
});
function authResponse(user) { return { token: jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '8h' }), user: { id: user.id, name: user.name, email: user.email, role: user.role, team: user.team } }; }
app.get('/api/auth/me', authenticate, (req, res) => res.json({ user: req.user }));
app.patch('/api/auth/profile', authenticate, async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    if (name.length < 2 || name.length > 80) return res.status(400).json({ error: 'Name must be between 2 and 80 characters' });
    req.user.name = name;
    await req.user.save();
    res.json({ user: { id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role, team: req.user.team } });
  } catch (e) { next(e); }
});

app.get('/api/activities', authenticate, async (req, res, next) => {
  try { const filter = { owner: req.user.id }; if (req.query.type) filter.type = req.query.type; if (req.query.status) filter.status = req.query.status; res.json(await Activity.find(filter).sort({ createdAt: -1 })); } catch (e) { next(e); }
});
app.post('/api/activities', authenticate, async (req, res, next) => {
  try { const { title, type, cadence, private: isPrivate } = req.body; if (!title?.trim()) return res.status(400).json({ error: 'Activity title is required' }); const activity = await Activity.create({ owner: req.user.id, title: title.trim(), type, cadence, private: isPrivate ?? true }); res.status(201).json(activity); } catch (e) { next(e); }
});
app.patch('/api/activities/:id', authenticate, async (req, res, next) => {
  try {
    const activity = await Activity.findOne({ _id: req.params.id, owner: req.user.id });
    if (!activity) return res.status(404).json({ error: 'Activity not found' });
    if (req.body.title !== undefined) {
      const title = String(req.body.title).trim();
      if (!title || title.length > 100) return res.status(400).json({ error: 'Title must be between 1 and 100 characters' });
      activity.title = title;
    }
    if (req.body.type !== undefined) {
      if (!['Movement', 'Mindfulness', 'Sleep', 'Nutrition', 'Other'].includes(req.body.type)) return res.status(400).json({ error: 'Invalid activity type' });
      activity.type = req.body.type;
    }
    if (req.body.cadence !== undefined) {
      if (!['Daily', 'Weekly'].includes(req.body.cadence)) return res.status(400).json({ error: 'Invalid activity cadence' });
      activity.cadence = req.body.cadence;
    }
    await activity.save();
    res.json(activity);
  } catch (e) { next(e); }
});
app.delete('/api/activities/:id', authenticate, async (req, res, next) => {
  try {
    const activity = await Activity.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
    if (!activity) return res.status(404).json({ error: 'Activity not found' });
    await ActivityEvent.deleteMany({ activity: activity._id, owner: req.user.id });
    res.json({ deleted: true, id: activity.id });
  } catch (e) { next(e); }
});
app.patch('/api/activities/:id/status', authenticate, async (req, res, next) => {
  try {
    if (!['done', 'missed', 'planned'].includes(req.body.status)) return res.status(400).json({ error: 'Status must be done, missed, or planned' });
    const activity = await Activity.findOne({ _id: req.params.id, owner: req.user.id }); if (!activity) return res.status(404).json({ error: 'Activity not found' });
    const previousStatus = activity.status;
    activity.status = req.body.status;
    if (req.body.status === 'done' && previousStatus !== 'done') { activity.streak += 1; activity.lastCompletedAt = new Date(); await ActivityEvent.create({ owner: req.user.id, activity: activity.id, action: 'done' }); await Notification.create({ owner: req.user.id, message: `Nice work completing ${activity.title}. Keep your streak going!` }); }
    else if (req.body.status === 'missed' && previousStatus !== 'missed') { activity.streak = 0; await ActivityEvent.create({ owner: req.user.id, activity: activity.id, action: 'missed' }); }
    await activity.save();
    if (req.body.status === 'done' && previousStatus !== 'done') await awardCompletedChallengeBadges(req.user.team);
    res.json(activity);
  } catch (e) { next(e); }
});

async function challengeStats(challenge) {
  const memberships = await ChallengeMembership.find({ challenge: challenge._id }).select('member joinedAt');
  if (!memberships.length) return { participants: 0, completions: 0 };
  const since = challenge.startDate || new Date(0);
  const until = challenge.endDate ? new Date(challenge.endDate) : new Date();
  if (challenge.endDate) until.setUTCHours(23, 59, 59, 999);
  const events = await ActivityEvent.find({ owner: { $in: memberships.map(m => m.member) }, action: 'done', occurredAt: { $gte: since, $lte: until } }).select('owner occurredAt');
  const joinedAt = new Map(memberships.map(m => [String(m.member), m.joinedAt]));
  return { participants: memberships.length, completions: events.filter(e => e.occurredAt >= joinedAt.get(String(e.owner))).length };
}
async function awardCompletedChallengeBadges(team) {
  const challenges = await Challenge.find({ team });
  for (const challenge of challenges) {
    const stats = await challengeStats(challenge);
    if (stats.completions < challenge.goal) continue;
    const memberships = await ChallengeMembership.find({ challenge: challenge._id, badgeAwardedAt: { $exists: false } }).select('_id member');
    for (const membership of memberships) {
      const awarded = await ChallengeMembership.findOneAndUpdate({ _id: membership._id, badgeAwardedAt: { $exists: false } }, { badgeAwardedAt: new Date() }, { new: true });
      if (awarded) await Notification.create({ owner: membership.member, message: `Your team completed “${challenge.title}”. You earned the ${challenge.badge} badge!` });
    }
  }
}
app.get('/api/challenges', authenticate, async (req, res, next) => { try { const rows = await Challenge.find({ team: req.user.team }).sort({ endDate: 1 }); const memberships = await ChallengeMembership.find({ member: req.user.id }); const result = await Promise.all(rows.map(async c => { const stats = await challengeStats(c); const membership = memberships.find(m => m.challenge.equals(c._id)); return { ...c.toObject(), ...stats, progress: Math.min(100, Math.round(stats.completions / Math.max(c.goal, 1) * 100)), joined: Boolean(membership), badgeEarned: Boolean(membership?.badgeAwardedAt) }; })); res.json(result); } catch (e) { next(e); } });
app.post('/api/challenges/:id/join', authenticate, async (req, res, next) => { try { const challenge = await Challenge.findOne({ _id: req.params.id, team: req.user.team }); if (!challenge) return res.status(404).json({ error: 'Challenge not found for your team' }); const now = new Date(); const end = challenge.endDate ? new Date(challenge.endDate) : null; if (end) end.setUTCHours(23, 59, 59, 999); if ((challenge.startDate && challenge.startDate > now) || (end && end < now)) return res.status(400).json({ error: 'This challenge is not currently open for joining' }); await ChallengeMembership.updateOne({ challenge: challenge._id, member: req.user.id }, { $setOnInsert: { challenge: challenge._id, member: req.user.id } }, { upsert: true }); res.status(201).json({ joined: true, challengeId: challenge.id }); } catch (e) { next(e); } });
app.get('/api/challenges/:id/leaderboard', authenticate, async (req, res, next) => { try { const challenge = await Challenge.findOne({ _id: req.params.id, team: req.user.team }); if (!challenge) return res.status(404).json({ error: 'Challenge not found for your team' }); const stats = await challengeStats(challenge); res.json({ challenge: challenge.title, team: req.user.team, participants: stats.participants, completions: stats.completions, goal: challenge.goal, progress: Math.min(100, Math.round(stats.completions / Math.max(challenge.goal, 1) * 100)) }); } catch (e) { next(e); } });
app.post('/api/admin/challenges', authenticate, managerOnly, async (req, res, next) => { try { const title = String(req.body.title || '').trim(); const goal = Number(req.body.goal); const startDate = req.body.startDate ? new Date(req.body.startDate) : undefined; const endDate = req.body.endDate ? new Date(req.body.endDate) : undefined; if (!title || title.length > 120 || !Number.isInteger(goal) || goal < 1) return res.status(400).json({ error: 'Provide a title and a positive whole-number goal' }); if ((startDate && Number.isNaN(+startDate)) || (endDate && Number.isNaN(+endDate)) || (startDate && endDate && endDate < startDate)) return res.status(400).json({ error: 'Provide valid challenge dates with the end date after the start date' }); const challenge = await Challenge.create({ title, description: String(req.body.description || '').trim(), goal, badge: String(req.body.badge || 'Consistency star').trim(), team: req.user.team, startDate, endDate }); res.status(201).json(challenge); } catch (e) { next(e); } });
app.patch('/api/admin/challenges/:id', authenticate, managerOnly, async (req, res, next) => { try { const challenge = await Challenge.findOne({ _id: req.params.id, team: req.user.team }); if (!challenge) return res.status(404).json({ error: 'Challenge not found' }); if (req.body.title !== undefined) challenge.title = String(req.body.title).trim(); if (req.body.description !== undefined) challenge.description = String(req.body.description).trim(); if (req.body.badge !== undefined) challenge.badge = String(req.body.badge).trim(); if (req.body.goal !== undefined) { const goal = Number(req.body.goal); if (!Number.isInteger(goal) || goal < 1) return res.status(400).json({ error: 'Goal must be a positive whole number' }); challenge.goal = goal; } if (req.body.startDate !== undefined) challenge.startDate = req.body.startDate ? new Date(req.body.startDate) : undefined; if (req.body.endDate !== undefined) challenge.endDate = req.body.endDate ? new Date(req.body.endDate) : undefined; if ((challenge.startDate && Number.isNaN(+challenge.startDate)) || (challenge.endDate && Number.isNaN(+challenge.endDate)) || (challenge.startDate && challenge.endDate && challenge.endDate < challenge.startDate)) return res.status(400).json({ error: 'Provide valid challenge dates with the end date after the start date' }); await challenge.save(); res.json(challenge); } catch (e) { next(e); } });
app.delete('/api/admin/challenges/:id', authenticate, managerOnly, async (req, res, next) => { try { const challenge = await Challenge.findOneAndDelete({ _id: req.params.id, team: req.user.team }); if (!challenge) return res.status(404).json({ error: 'Challenge not found' }); await ChallengeMembership.deleteMany({ challenge: challenge._id }); res.json({ deleted: true, id: challenge.id }); } catch (e) { next(e); } });
function lastSevenDays() {
  const days = [];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  for (let offset = 6; offset >= 0; offset--) {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - offset);
    days.push({ date: date.toISOString().slice(0, 10), count: 0 });
  }
  return days;
}
function countByDay(rows) {
  const counts = new Map(lastSevenDays().map(day => [day.date, 0]));
  for (const row of rows) { const day = new Date(row.occurredAt).toISOString().slice(0, 10); if (counts.has(day)) counts.set(day, counts.get(day) + 1); }
  return [...counts].map(([date, count]) => ({ date, count }));
}
app.get('/api/insights/personal', authenticate, async (req, res, next) => {
  try {
    const [activities, events, recent] = await Promise.all([
      Activity.find({ owner: req.user.id }), ActivityEvent.find({ owner: req.user.id, action: 'done' }),
      ActivityEvent.find({ owner: req.user.id, action: 'done', occurredAt: { $gte: new Date(Date.now() - 7 * 86400000) } }).select('occurredAt')
    ]);
    res.json({ total: activities.length, completed: events.length, completedThisWeek: recent.length, activeStreaks: activities.filter(a => a.streak > 0).length, byType: activities.reduce((a, x) => (a[x.type] = (a[x.type] || 0) + 1, a), {}), byDay: countByDay(recent) });
  } catch (e) { next(e); }
});
app.get('/api/insights/team', authenticate, managerOnly, async (req, res, next) => {
  try {
    const [members, memberIds, challenges] = await Promise.all([
      User.countDocuments({ team: req.user.team, role: 'employee' }),
      User.find({ team: req.user.team, role: 'employee' }).distinct('_id'),
      Challenge.find({ team: req.user.team })
    ]);
    const [events, recent] = await Promise.all([
      ActivityEvent.countDocuments({ owner: { $in: memberIds }, action: 'done' }),
      ActivityEvent.find({ owner: { $in: memberIds }, action: 'done', occurredAt: { $gte: new Date(Date.now() - 7 * 86400000) } }).select('occurredAt')
    ]);
    const challengeProgress = await Promise.all(challenges.map(async c => { const stats = await challengeStats(c); return { title: c.title, participants: stats.participants, completions: stats.completions, progress: Math.min(100, Math.round(stats.completions / Math.max(c.goal, 1) * 100)) }; }));
    res.json({ team: req.user.team, members, completions: events, completedThisWeek: recent.length, byDay: countByDay(recent), challengeCount: challenges.length, challengeProgress });
  } catch (e) { next(e); }
});
app.get('/api/admin/users', authenticate, managerOnly, async (req, res, next) => { try { const users = await User.find({ team: req.user.team }).select('_id name email role team createdAt').sort({ name: 1 }); res.json(users); } catch (e) { next(e); } });
app.patch('/api/admin/users/:id/role', authenticate, managerOnly, async (req, res, next) => { try { if (!['employee', 'manager'].includes(req.body.role)) return res.status(400).json({ error: 'Role must be employee or manager' }); if (String(req.user.id) === req.params.id) return res.status(400).json({ error: 'You cannot change your own role' }); const user = await User.findOneAndUpdate({ _id: req.params.id, team: req.user.team }, { role: req.body.role }, { new: true, runValidators: true }).select('_id name email role team'); if (!user) return res.status(404).json({ error: 'Team member not found' }); res.json(user); } catch (e) { next(e); } });
app.get('/api/recommendations', authenticate, async (req, res, next) => { try { const activities = await Activity.find({ owner: req.user.id, lastCompletedAt: { $exists: true } }); const buckets = Array(24).fill(0); for (const a of activities) buckets[new Date(a.lastCompletedAt).getHours()]++; const hour = buckets.indexOf(Math.max(...buckets)); const start = `${String(hour).padStart(2, '0')}:00`; const end = `${String((hour + 1) % 24).padStart(2, '0')}:00`; res.json({ recommendations: activities.length ? activities.map(a => ({ activityId: a.id, activity: a.title, suggestedWindow: `${start}–${end}`, reason: 'This hour matches the most common completion time in your own history.', source: 'personal activity history', acceptedTime: a.preferredTime || null })) : [{ activity: 'A short mindful break', suggestedWindow: '12:00–13:00', reason: 'Start small by pairing a wellness break with your midday routine.', source: 'starter suggestion', acceptedTime: null }] }); } catch (e) { next(e); } });
app.post('/api/recommendations/accept', authenticate, async (req, res, next) => { try { const { activityId, activityTitle, suggestedWindow } = req.body; let activity; if (activityId) { activity = await Activity.findOne({ _id: activityId, owner: req.user.id }); if (!activity) return res.status(404).json({ error: 'Activity not found' }); activity.preferredTime = suggestedWindow; await activity.save(); } else if (activityTitle !== undefined) { const title = String(activityTitle).trim(); if (!title || title.length > 100) return res.status(400).json({ error: 'A valid activity title is required' }); activity = await Activity.create({ owner: req.user.id, title, type: 'Mindfulness', cadence: 'Daily', private: true, preferredTime: suggestedWindow }); } else return res.status(400).json({ error: 'Provide an activity ID or a starter activity title' }); await Notification.create({ owner: req.user.id, message: `Recommendation accepted${suggestedWindow ? ` for ${suggestedWindow}` : ''}. It is saved to your routine.` }); res.status(201).json({ accepted: true, activityId: activity.id, suggestedWindow: suggestedWindow || null }); } catch (e) { next(e); } });
app.get('/api/notifications', authenticate, async (req, res, next) => { try { res.json(await Notification.find({ owner: req.user.id }).sort({ createdAt: -1 }).limit(30)); } catch (e) { next(e); } });
app.patch('/api/notifications/:id/read', authenticate, async (req, res, next) => { try { const item = await Notification.findOneAndUpdate({ _id: req.params.id, owner: req.user.id }, { read: true }, { new: true }); if (!item) return res.status(404).json({ error: 'Notification not found' }); res.json(item); } catch (e) { next(e); } });
app.get('/api/admin/summary', authenticate, managerOnly, async (req, res, next) => { try { res.json({ employees: await User.countDocuments({ team: req.user.team, role: 'employee' }), challenges: await Challenge.countDocuments({ team: req.user.team }) }); } catch (e) { next(e); } });

app.use((err, _req, res, _next) => { console.error(err); res.status(500).json({ error: 'An unexpected server error occurred' }); });
const port = process.env.PORT || 4000;
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!mongoUri) {
  throw new Error('MONGODB_URI environment variable is not configured');
}
await mongoose.connect(mongoUri);
app.listen(port, () => console.log(`TeamPulse API listening on ${port}`));
