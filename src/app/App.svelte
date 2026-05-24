<script>
  import { onMount } from 'svelte';
  import AppHeader from './AppHeader.svelte';
  import LegacyPanels from './LegacyPanels.svelte';
  import LazyToolLoader from './LazyToolLoader.svelte';
  import SettingsPanel from './SettingsPanel.svelte';
  import Sidebar from './Sidebar.svelte';
  import ToolGrid from './ToolGrid.svelte';

  onMount(async () => {
    window.onerror = (msg, url, line) => {
      console.error('App error:', msg, url, line);
    };
    window.onunhandledrejection = (event) => {
      console.error('Unhandled rejection:', event.reason);
    };
    await import('../scripts/app.js');
  });
</script>

<Sidebar />

<main class="main">
  <AppHeader />
  <ToolGrid />
  <LegacyPanels />
  <LazyToolLoader />
</main>

<SettingsPanel />
