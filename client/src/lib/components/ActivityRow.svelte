<script>
  import { Activity, Check, Clock3, Footprints, Heart, Pencil, Trash2, X } from '@lucide/svelte';
  let { activity, onStatus, onEdit, onDelete } = $props();
  const icons = { Movement: Footprints, Mindfulness: Heart, Sleep: Clock3, Nutrition: Heart, Other: Activity };
  let Icon = $derived(icons[activity.type] || Activity);
</script>

<div class="activity-row">
  <div class={`activity-icon ${activity.type?.toLowerCase()}`}><Icon size={18} /></div>
  <div class="activity-info"><b>{activity.title}</b><span>{activity.cadence} · {activity.type}</span></div>
  {#if activity.streak > 0}<div class="streak-chip">✦ {activity.streak} day streak</div>{/if}
  <span class={`status-chip ${activity.status}`}>
    {#if activity.status === 'done'}<Check size={13} />{/if}{activity.status}
  </span>
  <div class="activity-actions">
    <button aria-label="Mark done" title="Mark done" onclick={() => onStatus(activity, 'done')}><Check size={16} /></button>
    <button aria-label="Mark missed" title="Mark missed" onclick={() => onStatus(activity, 'missed')}><X size={15} /></button>
    <button aria-label="Edit activity" title="Edit activity" onclick={() => onEdit(activity)}><Pencil size={15} /></button>
    <button class="danger-action" aria-label="Remove activity" title="Remove activity" onclick={() => onDelete(activity)}><Trash2 size={15} /></button>
  </div>
</div>
