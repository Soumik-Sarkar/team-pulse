<script>
  import { setContext } from 'svelte';
  import { page } from '$app/state';
  import { Activity, Bell, ChevronDown, CircleHelp, LayoutDashboard, LogOut, Settings, ShieldCheck, Sparkles, Target, TrendingUp, Users, Heart, X } from '@lucide/svelte';
  import '../styles.css';
  import '../signout.css';
  import LoginPanel from '$lib/components/LoginPanel.svelte';
  import { api } from '$lib/api.js';
  import { createAppState } from '$lib/session.svelte.js';

  let { children } = $props();
  const app = createAppState();
  const nav = [
    ['Overview', '/', LayoutDashboard], ['My habits', '/habits', Heart],
    ['Challenges', '/challenges', Target], ['Recommendations', '/recommendations', Sparkles],
    ['Analytics', '/analytics', TrendingUp]
  ];
  const links = $derived(app.auth.user?.role === 'manager' ? [...nav, ['Team insights', '/team', Users], ['Administration', '/admin', Settings]] : nav);
  const today = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());
  let notificationsOpen = $state(false);
  let refreshInProgress = false;

  setContext('teampulse', app);

  function initials(value = '') { return value.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'TP'; }
  function setMessage(message) {
    app.ui.message = message;
    if (message) setTimeout(() => { if (app.ui.message === message) app.ui.message = ''; }, 4500);
  }
  async function refresh() {
    if (!app.auth.token || refreshInProgress) return;
    refreshInProgress = true;
    app.ui.loading = true;
    try {
      const [activities, challenges, insights, notifications] = await Promise.all([
        api('/activities', app.auth.token),
        api('/challenges', app.auth.token),
        api(app.auth.user?.role === 'manager' ? '/insights/team' : '/insights/personal', app.auth.token),
        api('/notifications', app.auth.token)
      ]);
      app.data.activities = activities;
      app.data.challenges = challenges;
      app.data.insights = insights;
      app.data.notifications = notifications;
    } catch (error) {
      setMessage(error.message);
      if (/session|token|authentication/i.test(error.message)) signOut();
    } finally {
      app.ui.loading = false;
      refreshInProgress = false;
    }
  }
  async function loadUsers() {
    app.data.members = await api('/admin/users', app.auth.token);
  }
  function signIn(result) {
    localStorage.setItem('tp-token', result.token);
    localStorage.setItem('tp-user', JSON.stringify(result.user));
    app.auth.token = result.token;
    app.auth.user = result.user;
  }
  function signOut() {
    localStorage.removeItem('tp-token');
    localStorage.removeItem('tp-user');
    app.auth.token = null;
    app.auth.user = null;
    app.data.activities = [];
    app.data.challenges = [];
    app.data.insights = {};
    app.data.notifications = [];
    notificationsOpen = false;
  }
  async function markNotification(item) {
    if (item.read) return;
    try {
      await api(`/notifications/${item._id}/read`, app.auth.token, { method: 'PATCH' });
      item.read = true;
    } catch (error) { setMessage(error.message); }
  }
  function updateUser(user) {
    app.auth.user = user;
    localStorage.setItem('tp-user', JSON.stringify(user));
  }
  Object.assign(app, { refresh, loadUsers, setMessage, signOut, updateUser });

  $effect(() => {
    if (!app.auth.ready) {
      try {
        app.auth.token = localStorage.getItem('tp-token');
        app.auth.user = JSON.parse(localStorage.getItem('tp-user') || 'null');
      } catch {
        app.auth.token = null;
        app.auth.user = null;
      }
      app.auth.ready = true;
    }
    if (app.auth.ready && app.auth.token) void refresh();
  });
</script>

<svelte:head><title>TeamPulse — Wellbeing, together</title></svelte:head>

{#if !app.auth.ready}
  <main class="app-loading">Loading TeamPulse…</main>
{:else if !app.auth.token || !app.auth.user}
  <LoginPanel onSignIn={signIn} />
{:else}
  <div class="app-shell">
    <aside class="sidebar">
      <a class="brand" href="/" aria-label="TeamPulse home"><span class="brand-mark"><Activity size={19} /></span> team<span>pulse</span></a>
      <div class="team-switch"><div class="team-icon">{initials(app.auth.user.team)}</div><div><b>{app.auth.user.team}</b><small>Wellness team</small></div><ChevronDown size={15} /></div>
      <div class="nav-label">WORKSPACE</div>
      <nav aria-label="Main navigation">
        {#each links as [label, href, Icon] (href)}
          <a {href} class:active={page.url.pathname === href || (href !== '/' && page.url.pathname.startsWith(`${href}/`))} class="nav-link">
            <Icon size={18} /><span>{label}</span>{#if label === 'Challenges'}<span class="nav-count">{app.data.challenges.length}</span>{/if}
          </a>
        {/each}
      </nav>
      <div class="sidebar-bottom">
        <div class="privacy-card"><div class="privacy-icon"><ShieldCheck size={18} /></div><b>Your wellbeing, your privacy.</b><p>Your personal habits are only visible to you.</p><a href="/profile">Privacy & profile <span>↗</span></a></div>
        <a class="nav-link" href="/profile"><CircleHelp size={18} /><span>Profile & settings</span></a>
        <div class="profile"><div class="avatar">{initials(app.auth.user.name)}</div><div><b>{app.auth.user.name}</b><small>{app.auth.user.role === 'manager' ? 'Team manager' : 'Team member'}</small></div></div>
      </div>
    </aside>
    <main class="main-area">
      <header class="topbar">
        <div class="breadcrumb">Workspace <span>/</span><b>{links.find((item) => item[1] === page.url.pathname)?.[0] || (page.url.pathname === '/profile' ? 'Profile & settings' : 'Overview')}</b></div>
        <div class="top-actions"><span class="today-label">{today}</span>
          <div class="notification-wrap">
            <button class="icon-button notification-button" aria-label="Notifications" aria-expanded={notificationsOpen} onclick={() => notificationsOpen = !notificationsOpen}><Bell size={19} />{#if app.data.notifications.some((item) => !item.read)}<i></i>{/if}</button>
            {#if notificationsOpen}<div class="notification-popover"><div class="notification-heading"><b>Notifications</b><button class="icon-button" aria-label="Close notifications" onclick={() => notificationsOpen = false}><X size={15} /></button></div>
              {#each app.data.notifications as notification (notification._id)}<button class:unread={!notification.read} class="notification-item" onclick={() => markNotification(notification)}>{notification.message}<small>{new Date(notification.createdAt).toLocaleString()}</small></button>{:else}<p class="muted notification-empty">You're all caught up.</p>{/each}
            </div>{/if}
          </div>
          <button class="signout-button" onclick={signOut} aria-label="Sign out"><LogOut size={16} /><span>Sign out</span></button>
          <div class="avatar small-avatar">{initials(app.auth.user.name)}</div>
        </div>
      </header>
      <div class="content">
        {#if app.ui.message}<div class="toast" role="status">{app.ui.message}<button aria-label="Dismiss message" onclick={() => app.ui.message = ''}><X size={15} /></button></div>{/if}
        {#if (page.url.pathname.startsWith('/admin') || page.url.pathname === '/team') && app.auth.user.role !== 'manager'}
          <section class="empty-state access-denied"><ShieldCheck size={22} /><h2>Manager access required</h2><p>This page is available to managers in your team.</p></section>
        {:else}
          {@render children()}
        {/if}
      </div>
    </main>
  </div>
{/if}

