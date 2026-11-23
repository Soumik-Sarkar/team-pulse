<script>
  import { getContext } from 'svelte';
  import { api, json } from '$lib/api.js';
  import { Plus, Search } from '@lucide/svelte';
  import PageHeading from '$lib/components/PageHeading.svelte';
  import ActivityRow from '$lib/components/ActivityRow.svelte';
  import ActivityModal from '$lib/components/ActivityModal.svelte';

  const app = getContext('teampulse');
  let query = $state('');
  let typeFilter = $state('All types');
  let statusFilter = $state('All status');
  let showModal = $state(false);
  let editing = $state(null);
  const visible = $derived(app.data.activities.filter((activity) => activity.title.toLowerCase().includes(query.toLowerCase()) && (typeFilter === 'All types' || activity.type === typeFilter) && (statusFilter === 'All status' || activity.status === statusFilter)));

  async function saveActivity(form) {
    if (editing) await api(`/activities/${editing._id}`, app.auth.token, json('PATCH', form));
    else await api('/activities', app.auth.token, json('POST', form));
    const wasEditing = Boolean(editing); editing = null; showModal = false; await app.refresh(); app.setMessage(wasEditing ? 'Activity updated.' : 'Activity added.');
  }
  async function changeStatus(activity, status) { try { await api(`/activities/${activity._id}/status`, app.auth.token, json('PATCH', { status })); await app.refresh(); app.setMessage(`Activity marked ${status}.`); } catch (e) { app.setMessage(e.message); } }
  async function removeActivity(activity) {
    if (!confirm(`Remove “${activity.title}” and its completion history?`)) return;
    try { await api(`/activities/${activity._id}`, app.auth.token, { method: 'DELETE' }); await app.refresh(); app.setMessage('Activity removed.'); } catch (e) { app.setMessage(e.message); }
  }
</script>

<PageHeading eyebrow="YOUR PERSONAL ROUTINE" title="My habits" desc="Create, update, complete, or remove your private wellness activities.">
  {#snippet action()}<button class="button primary" onclick={() => { editing = null; showModal = true; }}><Plus size={17} /> Add an activity</button>{/snippet}
</PageHeading>
<div class="filter-bar"><div class="search-box"><Search size={17} /><input aria-label="Search activities" placeholder="Search activities…" bind:value={query} /></div><select aria-label="Filter by activity type" bind:value={typeFilter}><option>All types</option><option>Movement</option><option>Mindfulness</option><option>Sleep</option><option>Nutrition</option><option>Other</option></select><select aria-label="Filter by status" bind:value={statusFilter}><option>All status</option><option value="done">done</option><option value="planned">planned</option><option value="missed">missed</option></select></div>
<div class="activity-list">{#if visible.length}{#each visible as activity (activity._id)}<ActivityRow {activity} onStatus={changeStatus} onEdit={(item) => { editing = item; showModal = true; }} onDelete={removeActivity} />{/each}{:else}<div class="empty-state">No activities match those filters. Clear a filter or add an activity.</div>{/if}</div>
<div class="privacy-note"><span>🔒</span><span><b>Private by design.</b> Managers can see aggregated participation, never your activity names or history.</span></div>
{#if showModal}<ActivityModal activity={editing} onClose={() => { showModal = false; editing = null; }} onSave={saveActivity} />{/if}
