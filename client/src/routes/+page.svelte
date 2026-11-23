<script>
  import { getContext } from 'svelte';
  import { api, json } from '$lib/api.js';
  import PageHeading from '$lib/components/PageHeading.svelte';
  import StatCard from '$lib/components/StatCard.svelte';
  import ActivityRow from '$lib/components/ActivityRow.svelte';
  import ActivityModal from '$lib/components/ActivityModal.svelte';
  import { Footprints, Heart, Plus, ShieldCheck, Target, TrendingUp, Users } from '@lucide/svelte';

  const app = getContext('teampulse');
  let showModal = $state(false);
  let editing = $state(null);
  const user = $derived(app.auth.user);
  const activities = $derived(app.data.activities.slice(0, 4));
  const done = $derived(app.data.activities.filter((item) => item.status === 'done').length);
  const streak = $derived(app.data.activities.reduce((total, item) => total + item.streak, 0));
  const todayLabel = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date()).toUpperCase();

  async function saveActivity(form) {
    const wasEditing = Boolean(editing);
    if (wasEditing) await api(`/activities/${editing._id}`, app.auth.token, json('PATCH', form));
    else await api('/activities', app.auth.token, json('POST', form));
    showModal = false; editing = null; await app.refresh(); app.setMessage(wasEditing ? 'Activity updated.' : 'Your new activity is ready.');
  }
  async function changeStatus(activity, status) {
    try { await api(`/activities/${activity._id}/status`, app.auth.token, json('PATCH', { status })); await app.refresh(); app.setMessage(status === 'done' ? 'Activity completed. Nice work!' : `Activity marked ${status}.`); }
    catch (e) { app.setMessage(e.message); }
  }
  async function removeActivity(activity) {
    if (!confirm(`Remove “${activity.title}” and its completion history?`)) return;
    try { await api(`/activities/${activity._id}`, app.auth.token, { method: 'DELETE' }); await app.refresh(); app.setMessage('Activity removed.'); }
    catch (e) { app.setMessage(e.message); }
  }
</script>

<PageHeading eyebrow={todayLabel} title={`Good morning, ${user.name.split(' ')[0]} 👋`} desc="Small steps add up. Here's your wellbeing at a glance.">
  {#snippet action()}<button class="button primary" onclick={() => { editing = null; showModal = true; }}><Plus size={17} /> Add an activity</button>{/snippet}
</PageHeading>

<section class="welcome-banner"><div class="welcome-copy"><span class="eyebrow light">A MOMENT FOR YOU</span><h2>Consistency over intensity.</h2><p>Your activities are private. Every small step counts.</p><div class="banner-progress"><span><i style={`width:${Math.min(100, Math.max(25, done * 14))}%`}></i></span><small>{done} completed activities</small></div></div><div class="banner-art"><div class="sun-disc"></div><div class="hill hill-back"></div><div class="hill hill-front"></div><span class="banner-spark">✦</span></div><div class="banner-count"><b>{streak}</b><span>active streak days</span><span class="flame">✦</span></div></section>

<div class="stat-grid">
  <StatCard icon={Footprints} tone="green" label="Activities completed" value={app.data.insights.completed ?? done} meta="Recorded in your routine" trend="Personal" />
  <StatCard icon={Heart} tone="pink" label="Active streaks" value={app.data.insights.activeStreaks ?? 0} meta="Keep the rhythm" trend="Private" />
  <StatCard icon={Users} tone="blue" label="Team challenge" value={app.data.challenges.length ? `${app.data.challenges[0].progress}%` : '—'} meta={app.data.challenges[0]?.title || 'No active challenge'} trend="Team" />
  <StatCard icon={TrendingUp} tone="gold" label="Activities tracked" value={app.data.activities.length} meta="Your personal routine" trend="Yours" />
</div>

<div class="section-head"><div><span class="eyebrow">YOUR ROUTINE</span><h2>Activities <span class="count-pill">{app.data.activities.length}</span></h2></div><a class="text-button" href="/habits">Manage habits <span>→</span></a></div>
<div class="activity-list">
  {#if app.ui.loading && !app.data.activities.length}<div class="empty-state">Loading your activities…</div>
  {:else if activities.length}
    {#each activities as activity (activity._id)}<ActivityRow {activity} onStatus={changeStatus} onEdit={(item) => { editing = item; showModal = true; }} onDelete={removeActivity} />{/each}
  {:else}<div class="empty-state">Start with one small habit. Add your first activity above.</div>{/if}
</div>
<div class="lower-grid">
  <div class="quote-card"><div class="quote-mark">“</div><p>It is not the mountain we conquer, but ourselves.</p><span>— Edmund Hillary</span><div class="quote-leaves">✳</div></div>
  <div class="challenge-mini"><div class="mini-head"><div class="challenge-icon"><Target size={18} /></div><span class="live-pill"><i></i> IN PROGRESS</span></div><h3>{app.data.challenges[0]?.title || 'Find a team challenge'}</h3><p>{app.data.challenges[0]?.description || 'Join your team in building a steady rhythm.'}</p><div class="challenge-progress"><span><i style={`width:${app.data.challenges[0]?.progress || 0}%`}></i></span><b>{app.data.challenges[0]?.progress || 0}%</b></div><div class="challenge-meta"><span>{app.data.challenges[0]?.goal || 0} completions goal</span><a href="/challenges">View challenges →</a></div></div>
</div>
<footer class="page-footer">Your personal habits stay private. Managers see aggregated team trends only. <ShieldCheck size={14} /></footer>

{#if showModal}<ActivityModal activity={editing} onClose={() => { showModal = false; editing = null; }} onSave={saveActivity} />{/if}
