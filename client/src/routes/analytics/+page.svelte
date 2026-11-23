<script>
  import { getContext } from 'svelte';
  import PageHeading from '$lib/components/PageHeading.svelte';
  import StatCard from '$lib/components/StatCard.svelte';
  import { Footprints, Heart, Target, TrendingUp, Users } from '@lucide/svelte';

  const app = getContext('teampulse');
  const manager = $derived(app.auth.user.role === 'manager');
  const days = $derived(app.data.insights.byDay || []);
  const maxCount = $derived(Math.max(1, ...days.map((day) => day.count)));
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const formatDay = (iso) => dayLabels[new Date(`${iso}T00:00:00Z`).getUTCDay()];
</script>

<PageHeading eyebrow={manager ? 'TEAM WELLBEING' : 'YOUR PERSONAL PROGRESS'} title={manager ? 'Team insights' : 'Your analytics'} desc={manager ? 'Aggregated participation trends. Individual wellness details are not shown.' : 'Review your activity totals and recent consistency.'} />
<div class="stat-grid">
  <StatCard icon={Users} tone="green" label={manager ? 'Team members' : 'Activities tracked'} value={manager ? app.data.insights.members || 0 : app.data.insights.total || app.data.activities.length} meta="In your workspace" trend="Private" />
  <StatCard icon={Footprints} tone="blue" label={manager ? 'Team completions' : 'Your completions'} value={manager ? app.data.insights.completions || 0 : app.data.insights.completed || 0} meta="All time" trend="Recorded" />
  <StatCard icon={Heart} tone="pink" label={manager ? 'This week' : 'Completed this week'} value={app.data.insights.completedThisWeek || 0} meta="Last 7 days" trend="Recent" />
  <StatCard icon={Target} tone="gold" label="Active challenges" value={app.data.insights.challengeCount ?? app.data.challenges.length} meta="Your team" trend="Together" />
</div>
<section class="analytics-panel"><div class="section-head"><div><span class="eyebrow">LAST 7 DAYS</span><h2>{manager ? 'Aggregated team completions' : 'Your activity completions'}</h2></div></div>
  <div class="chart"><div class="chart-y"><span>{maxCount}</span><span>{Math.ceil(maxCount * .75)}</span><span>{Math.ceil(maxCount * .5)}</span><span>{Math.ceil(maxCount * .25)}</span><span>0</span></div><div class="chart-area"><div class="chart-gridlines"><i></i><i></i><i></i><i></i><i></i></div><div class="bars">{#each days as day, index (day.date)}<div class="bar-group"><div class={`bar ${index === days.length - 1 ? 'highlight' : ''}`} style={`height:${Math.max(8, day.count / maxCount * 90)}%`}><span>{day.count}</span></div><small>{formatDay(day.date)}</small></div>{/each}</div></div></div>
  <div class="chart-legend"><i></i>Activity completions <span>Based on recorded completion events</span></div>
</section>
{#if manager}<div class="privacy-note"><span>🔒</span><span><b>Privacy boundary active.</b> These figures are aggregated for the team; names and individual activity histories are excluded.</span></div>{/if}
