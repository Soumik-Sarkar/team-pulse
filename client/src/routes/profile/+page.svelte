<script>
  import { getContext } from 'svelte';
  import { api, json } from '$lib/api.js';
  import { LogOut, Save, ShieldCheck } from '@lucide/svelte';
  import PageHeading from '$lib/components/PageHeading.svelte';

  const app = getContext('teampulse');
  let name = $state(app.auth.user.name);
  let saving = $state(false);
  let error = $state('');

  async function saveProfile(event) {
    event.preventDefault(); saving = true; error = '';
    try {
      const result = await api('/auth/profile', app.auth.token, json('PATCH', { name }));
      app.updateUser(result.user); app.setMessage('Profile updated.');
    } catch (e) { error = e.message; }
    finally { saving = false; }
  }
</script>

<PageHeading eyebrow="ACCOUNT" title="Profile & settings" desc="Update your account details and manage your signed-in session." />
<section class="profile-panel"><div class="profile-identity"><div class="avatar profile-large">{name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</div><div><h2>{app.auth.user.name}</h2><p>{app.auth.user.email}</p><span class="role-badge">{app.auth.user.role === 'manager' ? 'Team manager' : 'Team member'} · {app.auth.user.team}</span></div></div>
  <form class="profile-form" onsubmit={saveProfile}><label>Display name<input bind:value={name} required minlength="2" maxlength="80" /></label><label>Email address<input value={app.auth.user.email} disabled /></label><label>Team<input value={app.auth.user.team} disabled /></label>{#if error}<div class="error-text">{error}</div>{/if}<button class="button primary" disabled={saving}><Save size={16} />{saving ? 'Saving…' : 'Save profile'}</button></form>
  <div class="privacy-note"><ShieldCheck size={17} /><span>Your personal habits and wellness history are visible only to you. Managers receive team-level aggregates.</span></div>
  <button class="button subtle profile-signout" onclick={app.signOut}><LogOut size={16} /> Sign out of TeamPulse</button>
</section>
