<script>
  import { toolSections } from '../tools/registry.js';

  function handleClick(toolId) {
    if (window.showTool) window.showTool(toolId);
  }
</script>

<div class="tool-panel" id="panel-tool-grid">
  <div class="panel-header">
    <h2><i data-lucide="layout-grid"></i> Herramientas</h2>
    <p>Todas las utilidades organizadas por categoría. Toca una para comenzar.</p>
  </div>

  <div class="tool-quick-access" id="tool-quick-access"></div>

  {#each toolSections as section}
    <div class="tool-grid-section" data-section={section.id}>
      <div class="tool-grid-section-title">{section.title}</div>
      <div class="tool-grid">
        {#each section.tools as tool}
          <button
            class="tool-grid-card"
            data-tool={tool.id}
            type="button"
            onclick={() => handleClick(tool.id)}
          >
            <i data-lucide={tool.icon}></i>
            <span class="tool-grid-name">{tool.name}</span>
            <span class="tool-grid-desc">{tool.description}</span>
          </button>
        {/each}
      </div>
    </div>
  {/each}
</div>
