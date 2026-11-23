<script>
  import { getContext } from 'svelte';
  import PageHeading from '$lib/components/PageHeading.svelte';
  import StatCard from '$lib/components/StatCard.svelte';
  import { Footprints, Target, TrendingUp, Users } from '@lucide/svelte';

  const app = getContext('teampulse');
  const insights = $derived(app.data.insights);
</script>

<PageHeading eyebrow="MANAGER VIEW" title="Team insights" desc="A team-level view of participation. Individual wellness information stays private." />
<div class="stat-grid"><StatCard icon={Users} tone="green" label="Team members" value={insights.members || 0} meta="In your workspace" trend="Team total" /><StatCard icon={Footprints} tone="blue" label="Team completions" value={insights.completions || 0} meta="Recorded completions" trend="Aggregated" /><StatCard icon={Target} tone="gold" label="Active challenges" value={insights.challengeCount || 0} meta="For your team" trend="Together" /><StatCard icon={TrendingUp} tone="pink" label="This week" value={insights.completedThisWeek || 0} meta="Team completions" trend="Aggregated" /></div>
<section class="analytics-panel"><div class="section-head"><div><span class="eyebrow">TEAM PARTICIPATION</span><h2>Challenge progress</h2></div></div>
  {#each insights.challengeProgress || [] as challenge (challenge.title)}<div class="team-progress-row"><div><b>{challenge.title}</b><small>Combined team completions</small></div><span class="challenge-progress"><span><i style={`width:${challenge.progress}%`}></i></span><b>{challenge.progress}%</b></span></div>{:else}<div class="empty-state">Create a team challenge in Administration to start tracking progress.</div>{/each}
</section>
<div class="privacy-note"><span>🔒</span><span><b>Aggregated insights only.</b> Managers cannot view employee names, private habits, or individual wellness histories.</span></div>
