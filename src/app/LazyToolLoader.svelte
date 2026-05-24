<script>
  import { activeTool } from '../tools/activeTool.svelte.js';
  import { toolLoaders } from '../tools/lazyImports.js';

  let currentId = $derived(activeTool.id);

  $effect(() => {
    const id = currentId;
    const _trigger = activeTool.trigger; // re-run even if id hasn't changed
    if (!id) return;

    // If a legacy panel exists, showTool already activated it.
    // If this is a lazy-loaded tool, wait for its panel to appear in the DOM.
    const legacyPanel = document.getElementById('panel-' + id);
    if (legacyPanel) return;

    const loader = toolLoaders[id];
    if (!loader) return;

    // Panel may already be mounted from a previous visit
    const existing = document.getElementById('panel-' + id);
    if (existing) {
      document.querySelectorAll('.tool-panel').forEach((p) => p.classList.remove('active'));
      existing.classList.add('active');
      return;
    }

    // Wait for the lazy component to mount and insert its panel
    const observer = new MutationObserver(() => {
      const panel = document.getElementById('panel-' + id);
      if (panel) {
        document.querySelectorAll('.tool-panel').forEach((p) => p.classList.remove('active'));
        panel.classList.add('active');
        observer.disconnect();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  });
</script>

{#key currentId}
  {#if currentId && toolLoaders[currentId]}
    {#await toolLoaders[currentId]()}
      <div class="tool-panel active" id="panel-lazy-loading">
        <div class="panel-header">
          <h2><span class="lazy-spinner"></span> Cargando herramienta...</h2>
          <p>Descargando recursos necesarios, esto tomará solo un momento.</p>
        </div>
        <div class="output" style="text-align:center; padding: 32px;">
          <div class="bgremove-spinner" style="margin: 0 auto;"></div>
          <p style="margin-top: 14px; color: var(--muted);">Preparando componentes</p>
        </div>
      </div>
    {:then { default: Component }}
      <Component />
    {/await}
  {/if}
{/key}
