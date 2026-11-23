<script>
  import { getContext } from 'svelte';
  import { api, json } from '$lib/api.js';
  import { Plus, Save, ShieldCheck, Trash2, Users, X } from '@lucide/svelte';
  import PageHeading from '$lib/components/PageHeading.svelte';

  const app = getContext('teampulse');
  let title = $state('');
  let description = $state('');
  let goal = $state(30);
  let badge = $state('Consistency star');
  let startDate = $state('');
  let endDate = $state('');
  let editingId = $state('');
  let busy = $state(false);
  let error = $state('');
  let loaded = false;

  function clearForm() { title = ''; description = ''; goal = 30; badge = 'Consistency star'; startDate = ''; endDate = ''; editingId = ''; }
  function editChallenge(challenge) {
    editingId = challenge._id; title = challenge.title; description = challenge.description || ''; goal = challenge.goal; badge = challenge.badge || ''; startDate = challenge.startDate ? new Date(challenge.startDate).toISOString().slice(0, 10) : ''; endDate = challenge.endDate ? new Date(challenge.endDate).toISOString().slice(0, 10) : '';
    document.querySelector('#challenge-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  async function saveChallenge(event) {
    event.preventDefault(); busy = true; error = '';
    const wasEditing = Boolean(editingId);
    try {
      const body = { title, description, goal: Number(goal), badge, startDate: startDate || null, endDate: endDate || null };
      if (editingId) await api(`/admin/challenges/${editingId}`, app.auth.token, json('PATCH', body));
      else await api('/admin/challenges', app.auth.token, json('POST', body));
      clearForm(); await app.refresh(); app.setMessage(wasEditing ? 'Challenge updated.' : 'Challenge created.');
    } catch (e) { error = e.message; }
    finally { busy = false; }
  }
  async function deleteChallenge(challenge) {
    if (!confirm(`Delete the “${challenge.title}” challenge?`)) return;
    try { await api(`/admin/challenges/${challenge._id}`, app.auth.token, { method: 'DELETE' }); await app.refresh(); app.setMessage('Challenge deleted.'); }
    catch (e) { error = e.message; }
  }
  async function changeRole(member, role) {
    try { await api(`/admin/users/${member._id}/role`, app.auth.token, json('PATCH', { role })); await app.loadUsers(); app.setMessage(`${member.name}'s role was updated.`); }
    catch (e) { error = e.message; }
  }
  $effect(() => { if (app.auth.token && app.auth.user.role === 'manager' && !loaded) { loaded = true; app.loadUsers().catch((e) => error = e.message); } });
</script>

<PageHeading eyebrow="MANAGER TOOLS" title="Administration" desc="Manage team challenges and account roles. Employee wellness activity remains private." />
{#if error}<div class="error-text page-error">{error}</div>{/if}

<section class="admin-section"><div class="section-head"><div><span class="eyebrow">CHALLENGE MANAGEMENT</span><h2>Team challenges</h2></div></div>
  <form id="challenge-form" class="admin-form" onsubmit={saveChallenge}>
    <div class="admin-form-title"><b>{editingId ? 'Edit challenge' : 'Create a challenge'}</b>{#if editingId}<button type="button" class="icon-button" aria-label="Cancel edit" onclick={clearForm}><X size={16} /></button>{/if}</div>
    <div class="form-grid"><label>Challenge name<input bind:value={title} required maxlength="120" placeholder="e.g. Daily movement week" /></label><label>Completion goal<input type="number" min="1" step="1" bind:value={goal} required /></label><label>Badge reward<input bind:value={badge} maxlength="80" placeholder="Consistency star" /></label><label>Start date<input type="date" bind:value={startDate} /></label><label>End date<input type="date" bind:value={endDate} /></label><label class="form-wide">Description<textarea bind:value={description} rows="2" maxlength="500" placeholder="Describe the shared team goal"></textarea></label></div>
    <button class="button primary" disabled={busy}>{#if editingId}<Save size={16} /> Save challenge{:else}<Plus size={16} /> Create challenge{/if}</button>
  </form>
  <div class="admin-list">{#each app.data.challenges as challenge (challenge._id)}<div class="admin-list-row"><div><b>{challenge.title}</b><small>{challenge.goal} completions · {challenge.badge || 'No badge'} · {challenge.progress}% progress</small></div><div class="admin-row-actions"><button class="button subtle" onclick={() => editChallenge(challenge)}>Edit</button><button class="icon-button danger-action" aria-label={`Delete ${challenge.title}`} onclick={() => deleteChallenge(challenge)}><Trash2 size={16} /></button></div></div>{:else}<div class="empty-state">No challenges yet. Create one above.</div>{/each}</div>
</section>

<section class="admin-section"><div class="section-head"><div><span class="eyebrow">IDENTITY & ACCESS</span><h2>Team members <span class="count-pill">{app.data.members.length}</span></h2></div><button class="button subtle" onclick={() => app.loadUsers()}><Users size={16} /> Refresh list</button></div>
  <p class="muted">This list contains account details and roles only. It never displays personal wellness activity.</p>
  <div class="admin-list">{#each app.data.members as member (member._id)}<div class="admin-list-row"><div><b>{member.name}</b><small>{member.email} · {member.team}</small></div><label class="role-control">Role<select value={member.role} disabled={member._id === app.auth.user.id} onchange={(event) => changeRole(member, event.currentTarget.value)}><option value="employee">Employee</option><option value="manager">Manager</option></select></label></div>{:else}<div class="empty-state">Loading team accounts…</div>{/each}</div>
</section>
<div class="privacy-note"><ShieldCheck size={17} /><span><b>Role boundaries are enforced by the API.</b> Managers can manage challenges and team access, but cannot read individual wellness histories.</span></div>
