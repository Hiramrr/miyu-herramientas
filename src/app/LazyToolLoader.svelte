<script>
  import { activeTool } from '../tools/activeTool.svelte.js';
  import { toolLoaders } from '../tools/lazyImports.js';
  import PanelActivator from './PanelActivator.svelte';

  let currentId = $derived(activeTool.id);
</script>

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
    <PanelActivator toolId={currentId} />
  {:catch error}
    <div class="tool-panel active" id="panel-lazy-error">
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
