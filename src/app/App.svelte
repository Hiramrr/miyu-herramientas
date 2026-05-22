<script>
  import { onMount } from 'svelte';
  import AppHeader from './AppHeader.svelte';
  import LegacyPanels from './LegacyPanels.svelte';
  import SettingsPanel from './SettingsPanel.svelte';
  import Sidebar from './Sidebar.svelte';

  onMount(async () => {
    await import('../scripts/app.js');
  });
</script>

<Sidebar />

<main class="main">
  <AppHeader />
  <LegacyPanels />
</main>

<SettingsPanel />
