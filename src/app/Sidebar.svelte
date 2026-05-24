<script>
  import { toolSections } from '../tools/registry.js';
</script>

<aside class="sidebar">
  <div class="sidebar-header">
    <pre class="brand-ascii" aria-hidden="true"> ▒▒▒▒         ▒▒▒▒
 ▒▒▒▒▒▒▒░░░░░░▒▒▒▒
   ▒▒░░░▒▒▒░░▒▒▒░▒▒
   ▒▒▓▒▓▒░░░░▒▒▓█▓▒
  ▒░▒▓▓▓▒▒▒░░░▒▒▓▓▒▒
  ░▒▒░░░░░░▒▒▒▒▒▒▒▒▒
  ░░▒▒▒░░░▒▓▓▓▓▓▓▒▒▒
  ░░░▒░░░░░▒▓▓█▓▒▒▒▒
  ░░░░░░▒▒▒▒▒▓▓▓▓▓▓▒▒
  ░░░░░░░▒▒▓▓▓▓▓▓▓▓
  ░░░░░░▒▒▒▒▓▓▓▓▓▓▓</pre>
    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
      <h1>miyu-herramientas</h1>
      <div style="display:flex;gap:6px">
        <button class="theme-toggle sidebar-close-mobile" id="sidebar-close-mobile" title="Cerrar menú" aria-label="Cerrar menú">
          <i data-lucide="x"></i>
        </button>
        <button class="theme-toggle" id="settings-open" data-settings-open title="Configuración" aria-label="Abrir configuración">
          <i data-lucide="settings"></i>
        </button>
      </div>
    </div>
    <p>Herramientas</p>
  </div>

  <div class="sidebar-search">
    <i data-lucide="search"></i>
    <input id="sidebar-search" type="text" placeholder="Buscar herramienta...">
  </div>

  <div class="tool-list">
    <div class="tool-section tool-section-home" data-section="inicio">
      <div class="tool-section-title">Inicio</div>
      <div
        class="tool-item tool-home-item"
        id="tool-home-item"
        data-tool-home
        role="button"
        tabindex="0"
      >
        <i data-lucide="layout-grid"></i>
        <div class="tool-info">
          <div class="tool-name">Todas las herramientas</div>
          <div class="tool-desc">Explora las utilidades disponibles</div>
        </div>
      </div>
    </div>
    <div class="tool-section tool-section-favorites" id="sidebar-favorites-section" data-section="favoritas">
      <div class="tool-section-title">Favoritas</div>
      <div id="sidebar-favorites-list"></div>
    </div>
    {#each toolSections as section}
      <div class="tool-section" data-section={section.id}>
        <div class="tool-section-title">{section.title}</div>
        {#each section.tools as tool}
          <div
            class:active={tool.id === 'text'}
            class="tool-item"
            data-tool={tool.id}
            role="button"
            tabindex="0"
          >
            <i data-lucide={tool.icon}></i>
            <div class="tool-info">
              <div class="tool-name">{tool.name}</div>
              <div class="tool-desc">{tool.description}</div>
            </div>
            <button
              class="tool-favorite"
              type="button"
              data-favorite={tool.id}
              aria-label="Marcar como favorita"
              title="Favorita"
            >
              <i data-lucide="star"></i>
            </button>
          </div>
        {/each}
      </div>
    {/each}
    <div class="tool-empty" id="tool-empty">No encontré herramientas con ese nombre.</div>
  </div>
</aside>

<div class="sidebar-backdrop" id="sidebar-backdrop"></div>
