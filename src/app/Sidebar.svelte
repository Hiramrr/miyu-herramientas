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
      <button class="theme-toggle" id="settings-open" title="Configuración" aria-label="Abrir configuración">
        <i data-lucide="settings"></i>
      </button>
    </div>
    <p>Herramientas</p>
  </div>

  <div class="sidebar-search">
    <i data-lucide="search"></i>
    <input id="sidebar-search" type="text" placeholder="Buscar herramienta...">
  </div>

  <div class="tool-list">
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
