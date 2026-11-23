<script>
  import { getContext } from 'svelte';
  import { api, json } from '$lib/api.js';
  import { Clock3, Check, ShieldCheck, Sparkles } from '@lucide/svelte';
  import PageHeading from '$lib/components/PageHeading.svelte';

  const app = getContext('teampulse');
  let recommendations = $state([]);
  let loading = $state(true);
  let error = $state('');
  let accepting = $state('');
  let loaded = false;

  async function load() {
    loading = true;
    try { recommendations = (await api('/recommendations', app.auth.token)).recommendations; }
    catch (e) { error = e.message; }
    finally { loading = false; }
  }
  async function accept(item) {
    accepting = item.activityId || item.activity;
    error = '';
    try {
      await api('/recommendations/accept', app.auth.token, json('POST', { activityId: item.activityId, activityTitle: item.activityId ? undefined : item.activity, suggestedWindow: item.suggestedWindow }));
      item.acceptedTime = item.suggestedWindow;
      await app.refresh();
      app.setMessage('Recommendation saved to your routine.');
    } catch (e) { error = e.message; }
    finally { accepting = ''; }
  }
  $effect(() => { if (app.auth.token && !loaded) { loaded = true; void load(); } });
</script>

<PageHeading eyebrow="PERSONALIZED FOR YOU" title="Find your rhythm" desc="Timing ideas based on your own completion history." />
<div class="recommend-banner"><span class="rec-spark"><Sparkles size={25} /></span><div><b>Your rhythm, your way.</b><p>Suggestions use only your personal activity history and are visible only to you.</p></div><ShieldCheck size={19} /></div>
{#if error}<div class="error-text page-error">{error}</div>{/if}
{#if loading}<div class="empty-state">Finding your rhythm…</div>{:else}
  <div class="recommend-grid">
    {#each recommendations as item (item.activityId || item.activity)}
      <article class="recommend-card"><span class="eyebrow">A GENTLE SUGGESTION</span><div class="rec-card-icon"><Clock3 size={20} /></div><h2>{item.activity}</h2><p>{item.reason}</p>
        <div class="suggested-time"><Clock3 size={16} /><span>Try around <b>{item.acceptedTime || item.suggestedWindow}</b></span></div>
        <div class="rec-source">Based on {item.source}</div>
        <button class={`button ${item.acceptedTime ? 'subtle' : 'primary'} full`} disabled={Boolean(item.acceptedTime) || accepting === (item.activityId || item.activity)} onclick={() => accept(item)}>{#if item.acceptedTime}<Check size={16} /> Saved to my routine{:else}{accepting ? 'Saving…' : 'Accept recommendation'}{/if}</button>
      </article>
    {/each}
    <aside class="recommend-tip"><Sparkles size={18} /><div><b>Keep it flexible</b><p>A suggested time is a starting point. Choose what works for you today.</p></div></aside>
  </div>
{/if}
