<script>
  import { onMount, tick } from 'svelte';

  let { toolId } = $props();

  onMount(() => {
    tick().then(() => {
      requestAnimationFrame(() => {
        const panel = document.getElementById('panel-' + toolId);
        if (panel && !panel.classList.contains('active')) {
          document.querySelectorAll('.tool-panel').forEach((p) => p.classList.remove('active'));
          panel.classList.add('active');
        }
      });
    });
  });
</script>
