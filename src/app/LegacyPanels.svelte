<script>
  import { panelsMarkup } from '../legacy/panels.js';
  import { toolLoaders } from '../tools/lazyImports.js';

  // Split the markup into individual panels and filter out those with Svelte loaders
  const panelIdsWithLoader = new Set(Object.keys(toolLoaders));
  const panels = panelsMarkup.split('<div class="tool-panel"');
  const filteredPanels = panels.filter((panel) => {
    if (!panel.trim()) return false;
    const idMatch = panel.match(/id="panel-([^"]+)"/);
    if (!idMatch) return true;
    return !panelIdsWithLoader.has(idMatch[1]);
  });
  const filteredMarkup = filteredPanels.join('<div class="tool-panel"');
</script>

{@html filteredMarkup}
