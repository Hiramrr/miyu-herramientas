<script>
  import { activeTool } from '../tools/activeTool.svelte.js';
  import { toolLoaders } from '../tools/lazyImports.js';

  let currentId = $derived(activeTool.id);
  let iconFrame = null;

  function refreshLucideIcons() {
    if (iconFrame) cancelAnimationFrame(iconFrame);
    iconFrame = requestAnimationFrame(() => {
      iconFrame = null;
      if (!document.querySelector('i[data-lucide]')) return;
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    });
  }

  $effect(() => {
    const id = currentId;
    const _trigger = activeTool.trigger;
    if (!id) return;

    const loader = toolLoaders[id];
    if (!loader) return;
    let panelIconObserver = null;

    function activatePanel(panel) {
      document.querySelectorAll('.tool-panel').forEach((p) => {
        if (!p.id.startsWith('panel-lazy-')) p.classList.remove('active');
      });
      panel.classList.add('active');
      refreshLucideIcons();
      if (typeof window.setupFilePickers === 'function') {
        window.setupFilePickers();
      }
      panelIconObserver = new MutationObserver(refreshLucideIcons);
      panelIconObserver.observe(panel, { childList: true, subtree: true });
    }

    // Hide grid panel when a lazy tool is active
    const gridPanel = document.getElementById('panel-tool-grid');
    if (gridPanel) gridPanel.classList.remove('active');

    // If panel already exists (second visit), activate it immediately
    const existing = document.getElementById('panel-' + id);
    if (existing) {
      activatePanel(existing);
      return () => panelIconObserver?.disconnect();
    }

    // Wait for component to mount and insert its panel
    const observer = new MutationObserver(() => {
      refreshLucideIcons();
      const panel = document.getElementById('panel-' + id);
      if (panel) {
        activatePanel(panel);
        observer.disconnect();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      panelIconObserver?.disconnect();
      if (iconFrame) cancelAnimationFrame(iconFrame);
    };
  });
</script>

{#key currentId}
  {#if currentId && toolLoaders[currentId]}
    {#await toolLoaders[currentId]()}
      <div class="tool-panel" id="panel-lazy-loading">
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
    {:catch error}
      <div class="tool-panel" id="panel-lazy-error">
        <div class="panel-header">
          <h2><i data-lucide="alert-circle"></i> Error al cargar</h2>
          <p>No se pudo cargar la herramienta seleccionada.</p>
        </div>
        <div class="output" style="border-color: #e0a8a8; background: #fff4f2; color: #9a483d;">
          <p style="font-weight: 600;">Detalles técnicos:</p>
          <pre style="font-size: 0.8rem; margin-top: 8px; overflow: auto;">{error.message}</pre>
        </div>
      </div>
    {/await}
  {/if}
{/key}
