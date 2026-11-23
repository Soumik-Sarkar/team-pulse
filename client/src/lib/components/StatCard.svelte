<script>
  let { icon: Icon, tone = 'green', label, value, meta = '', trend = '' } = $props();
</script>

<div class="stat-card">
  <div class="stat-top">
    <span class={`stat-icon ${tone}`}><Icon size={17} /></span>
    {#if trend}<span class="stat-trend">{trend}</span>{/if}
  </div>
  <span class="stat-value">{value}</span>
  <span class="stat-label">{label}</span>
  <span class="stat-meta">{meta}</span>
</div>
