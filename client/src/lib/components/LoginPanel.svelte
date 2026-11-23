<script>
  import { Activity, Heart, ShieldCheck } from '@lucide/svelte';
  import { api, json } from '$lib/api.js';
  let { onSignIn } = $props();
  let registering = $state(false);
  let name = $state('');
  let email = $state('employee@teampulse.local');
  let password = $state('PulseDemo2026!');
  let error = $state('');
  let loading = $state(false);

  async function submit(event) {
    event.preventDefault(); error = ''; loading = true;
    try {
      const endpoint = registering ? '/auth/register' : '/auth/login';
      const body = registering ? { name, email, password } : { email, password };
      onSignIn(await api(endpoint, null, json('POST', body)));
    } catch (e) { error = e.message; }
    finally { loading = false; }
  }
</script>

<main class="login-page">
  <section class="login-art">
    <div class="brand"><span class="brand-mark"><Activity size={19} /></span> team<span>pulse</span></div>
    <div class="art-copy"><span class="eyebrow light">A LITTLE BETTER, TOGETHER</span><h1>Wellbeing is<br />a team sport.</h1><p>Build small habits. Celebrate steady progress.<br />Make space for a healthier workday.</p><div class="orbit"><div class="orbit-core"><Heart size={34} /></div><span class="orbit-dot one">✦</span><span class="orbit-dot two">✓</span><span class="orbit-dot three">↗</span></div></div>
    <span class="art-foot">A healthier rhythm starts with one small step.</span>
  </section>
  <section class="login-side">
    <form class="login-form" onsubmit={submit}>
      <span class="eyebrow">YOUR TEAM, IN GOOD HEALTH</span><h2>{registering ? 'Create your account' : 'Welcome back'}</h2><p class="muted">{registering ? 'Start a private wellness routine with your team.' : 'Sign in to continue your wellness journey.'}</p>
      {#if registering}<label>Your name<input bind:value={name} autocomplete="name" required minlength="2" maxlength="80" /></label>{/if}
      <label>Email address<input type="email" bind:value={email} autocomplete="username" required /></label>
      <label>Password<input type="password" bind:value={password} autocomplete={registering ? 'new-password' : 'current-password'} required minlength={registering ? 10 : 1} /></label>
      {#if error}<div class="error-text">{error}</div>{/if}
      <button class="button primary full" disabled={loading}>{loading ? 'Please wait…' : registering ? 'Create account' : 'Sign in'}<span>→</span></button>
      <button type="button" class="auth-toggle" onclick={() => { registering = !registering; error = ''; }}>{registering ? 'Already have an account? Sign in' : 'New here? Create an employee account'}</button>
      <div class="login-privacy"><ShieldCheck size={16} /> Your wellness data stays private to you.</div>
      {#if !registering}<div class="demo-login"><span>DEMO ACCESS</span><p>employee@teampulse.local <i>·</i> manager@teampulse.local</p><small>Password: PulseDemo2026!</small></div>{/if}
    </form>
    <span class="login-copyright">© 2026 TeamPulse · Built for balance</span>
  </section>
</main>
