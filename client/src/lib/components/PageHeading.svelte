<script>
  let { eyebrow, title, desc, action = null } = $props();
</script>

<div class="page-heading">
  <div>
    <span class="eyebrow">{eyebrow}</span>
    <h1>{title}</h1>
    <p>{desc}</p>
  </div>
  {#if action}{@render action()}{/if}
</div>
