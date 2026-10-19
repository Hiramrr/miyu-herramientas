<script>
  import { onDestroy, tick, untrack } from 'svelte';
  import { activeTool } from '../tools/activeTool.svelte.js';
  import { toolLoaders } from '../tools/lazyImports.js';

  const imports = new WeakMap();
  let components = $state.raw([]);
  let loadingId = $state(null);
  let loadError = $state(null);
  let navigation = 0;
  let iconFrame = null;
  let iconObserver = null;

  function refreshIcons() {
    if (iconFrame) cancelAnimationFrame(iconFrame);
    iconFrame = requestAnimationFrame(() => {
      iconFrame = null;
      if (document.querySelector('i[data-lucide]')) window.lucide?.createIcons();
    });
  }

  async function openTool(id) {
    const version = ++navigation;
    iconObserver?.disconnect();
    loadingId = null;
    loadError = null;
    document.querySelectorAll('.tool-panel.active').forEach((panel) => panel.classList.remove('active'));
    if (!id) {
      document.getElementById('panel-tool-grid')?.classList.add('active');
      return;
    }

    const loader = toolLoaders[id];
    if (!loader) return;
    loadingId = id;
    let pending = imports.get(loader);
    if (!pending) {
      pending = Promise.resolve().then(loader).then(({ default: Component }) => {
        if (!components.some((entry) => entry.loader === loader)) {
          components = [...components, { loader, Component }];
        }
      });
      imports.set(loader, pending);
    }

    try {
      await pending;
      await tick();
      if (version !== navigation) return;
      const panel = document.getElementById('panel-' + id);
      if (!panel) throw new Error('No se encontró el panel de la herramienta.');
      loadingId = null;
      panel.classList.add('active');
      window.setupFilePickers?.();
      refreshIcons();
      iconObserver = new MutationObserver(refreshIcons);
      iconObserver.observe(panel, { childList: true, subtree: true });
      window.dispatchEvent(new CustomEvent('mh:tool-ready', { detail: { id } }));
    } catch (error) {
      imports.delete(loader);
      if (version !== navigation) return;
      loadingId = null;
      loadError = error;
      refreshIcons();
    }
  }

  $effect(() => {
    const id = activeTool.id;
    activeTool.trigger;
    untrack(() => openTool(id));
  });

  onDestroy(() => {
    navigation += 1;
    iconObserver?.disconnect();
    if (iconFrame) cancelAnimationFrame(iconFrame);
  });
</script>

{#each components as entry (entry.loader)}
  <entry.Component />
{/each}

{#if loadingId}
  <div class="tool-panel" id="panel-lazy-loading" role="status">
    <div class="panel-header">
      <h2><span class="lazy-spinner"></span> Cargando herramienta...</h2>
      <p>Preparando los componentes necesarios.</p>
    </div>
  </div>
{:else if loadError}
  <div class="tool-panel" id="panel-lazy-error" role="alert">
    <div class="panel-header">
      <h2><i data-lucide="alert-circle"></i> No se pudo cargar la herramienta</h2>
      <p>Comprueba tu conexión y vuelve a intentarlo. Si el error continúa, recarga la aplicación.</p>
    </div>
    <div class="btn-row">
      <button class="btn" onclick={() => { activeTool.trigger += 1; }}>
        <i data-lucide="rotate-cw"></i> Reintentar
      </button>
      <button class="btn btn-quiet" onclick={() => window.location.reload()}>Recargar aplicación</button>
    </div>
  </div>
{/if}
