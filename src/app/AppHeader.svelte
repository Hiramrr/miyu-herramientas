<script>
  import { activeTool } from '../tools/activeTool.svelte.js';
</script>

<div class="app-header">
  <button class="sidebar-toggle" id="sidebar-toggle" aria-label="Colapsar menu">
    <i data-lucide="panel-left"></i>
  </button>
  {#if activeTool.id}
    <button class="app-header-back" id="app-header-back" type="button" title="Volver a herramientas" onclick={() => window.showTool?.(null)}>
      <i data-lucide="arrow-left"></i>
    </button>
  {/if}
  <button class="app-header-title" id="app-header-title" type="button" title="Volver a herramientas">Herramientas</button>
  <div class="app-header-actions">
    <button class="quick-command" id="command-open" type="button" title="Buscar herramienta">
      <i class="quick-command-desktop-icon" data-lucide="command"></i>
      <i class="quick-command-mobile-icon" data-lucide="search"></i>
      <span>Buscar</span>
      <kbd>⌘K</kbd>
    </button>
    <button class="header-icon-button" type="button" data-settings-open title="Configuración" aria-label="Abrir configuración">
      <i data-lucide="settings"></i>
    </button>
  </div>
</div>
