<script>
  import { Plus, ShieldCheck, X } from '@lucide/svelte';
  let { activity = null, onClose, onSave } = $props();
  let title = $state('');
  let type = $state('Movement');
  let cadence = $state('Daily');
  let saving = $state(false);
  let error = $state('');
  $effect(() => {
    title = activity?.title || '';
    type = activity?.type || 'Movement';
    cadence = activity?.cadence || 'Daily';
  });

  async function submit(event) {
    event.preventDefault();
    saving = true;
    error = '';
    try { await onSave({ title: title.trim(), type, cadence }); }
    catch (e) { error = e.message; }
    finally { saving = false; }
  }
</script>

<div class="modal-backdrop" role="presentation" onclick={(e) => e.target === e.currentTarget && onClose()}>
  <form class="modal" onsubmit={submit}>
    <div class="modal-head"><div><span class="eyebrow">BUILD A HEALTHIER ROUTINE</span><h2>{activity ? 'Edit activity' : 'Add an activity'}</h2></div><button type="button" class="icon-button" aria-label="Close" onclick={onClose}><X size={19} /></button></div>
    <p class="muted">Keep it small, make it yours. Your activity stays private.</p>
    <label>Activity name<input placeholder="e.g. Take a mindful walk" bind:value={title} required maxlength="100" /></label>
    <label>Activity type<select bind:value={type}><option>Movement</option><option>Mindfulness</option><option>Sleep</option><option>Nutrition</option><option>Other</option></select></label>
    <label>How often?<select bind:value={cadence}><option>Daily</option><option>Weekly</option></select></label>
    {#if error}<div class="error-text">{error}</div>{/if}
    <div class="modal-private"><ShieldCheck size={16} /> Only you can see this activity.</div>
    <div class="modal-actions"><button type="button" class="button subtle" onclick={onClose}>Cancel</button><button class="button primary" disabled={saving}><Plus size={16} />{saving ? 'Saving…' : activity ? 'Save changes' : 'Add activity'}</button></div>
  </form>
</div>
