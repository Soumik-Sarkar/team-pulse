<script>
  import { getContext } from 'svelte';
  import { api } from '$lib/api.js';
  import PageHeading from '$lib/components/PageHeading.svelte';
  import { Search, ShieldCheck, Sparkles, Target, Users } from '@lucide/svelte';

  const app = getContext('teampulse');
  let leaderboard = $state(null);
  let leaderboardId = $state('');
  let error = $state('');
  let query = $state('');
  let statusFilter = $state('All challenges');
  let fromDate = $state('');
  let toDate = $state('');
  const visible = $derived(app.data.challenges.filter((challenge) => {
    const matchesText = challenge.title.toLowerCase().includes(query.toLowerCase());
    const end = challenge.endDate ? new Date(challenge.endDate).toISOString().slice(0, 10) : '';
    const start = challenge.startDate ? new Date(challenge.startDate).toISOString().slice(0, 10) : '';
    const today = new Date().toISOString().slice(0, 10);
    const active = (!start || start <= today) && (!end || end >= today);
    const matchesStatus = statusFilter === 'All challenges' || (statusFilter === 'Active' ? active : !active);
    const matchesStart = !fromDate || !end || end >= fromDate;
    const matchesEnd = !toDate || !challenge.startDate || new Date(challenge.startDate).toISOString().slice(0, 10) <= toDate;
    return matchesText && matchesStatus && matchesStart && matchesEnd;
  }));

  async function join(challenge) {
    error = '';
    try { await api(`/challenges/${challenge._id}/join`, app.auth.token, { method: 'POST' }); await app.refresh(); app.setMessage('You joined the team challenge.'); }
    catch (e) { error = e.message; }
  }
  async function showLeaderboard(challenge) {
    error = ''; leaderboard = null; leaderboardId = challenge._id;
    try { leaderboard = await api(`/challenges/${challenge._id}/leaderboard`, app.auth.token); }
    catch (e) { error = e.message; }
  }
</script>

<PageHeading eyebrow="GROW TOGETHER" title="Team challenges" desc="Join a shared goal and celebrate your team's progress." />
<div class="filter-bar challenge-filter"><div class="search-box"><Search size={17} /><input aria-label="Search challenges" placeholder="Search challenges…" bind:value={query} /></div><select aria-label="Filter challenge status" bind:value={statusFilter}><option>All challenges</option><option>Active</option><option>Ended</option></select><label>Date from<input aria-label="Start date" type="date" bind:value={fromDate} /></label><label>Date to<input aria-label="End date" type="date" bind:value={toDate} /></label><button class="text-button" onclick={() => { query = ''; statusFilter = 'All challenges'; fromDate = ''; toDate = ''; }}>Clear filters</button></div>
{#if error}<div class="error-text page-error">{error}</div>{/if}
<div class="challenge-grid">
  {#each visible as challenge (challenge._id)}
    <article class="challenge-card">
      <div class="challenge-card-top"><div class="challenge-icon"><Target size={20} /></div><span class="live-pill"><i></i> OPEN</span></div>
      <span class="eyebrow">TEAM CHALLENGE</span><h2>{challenge.title}</h2><p>{challenge.description || 'Build a steady rhythm together. Every completed activity counts.'}</p>
      <div class="challenge-progress"><span><i style={`width:${challenge.progress}%`}></i></span><b>{challenge.progress}%</b></div>
      <div class="challenge-meta"><span>{challenge.goal} completions goal</span><span><Users size={14} /> {challenge.team}</span></div>
      <div class="badge-reward"><Sparkles size={16} /> {challenge.badgeEarned ? 'Badge earned:' : 'Badge reward:'} <b>{challenge.badge}</b></div>
      <div class="challenge-buttons"><button class="button primary" disabled={challenge.joined} onclick={() => join(challenge)}>{challenge.joined ? 'Joined' : 'Join challenge'}</button><button class="button subtle" onclick={() => showLeaderboard(challenge)}>{leaderboardId === challenge._id ? 'Refresh team progress' : 'Team leaderboard'}</button></div>
      {#if leaderboardId === challenge._id && leaderboard}<div class="leaderboard-result"><b>{leaderboard.team} team</b><span>{leaderboard.completions} completions · {leaderboard.participants} joined</span><small>{leaderboard.progress}% of the {leaderboard.goal} completion goal</small></div>{/if}
    </article>
  {:else}<div class="empty-state">No challenges match these filters.</div>{/each}
</div>
<div class="privacy-note"><ShieldCheck size={17} /><span><b>Progress stays aggregated.</b> The challenge view shows team totals, not employee wellness histories.</span></div>
