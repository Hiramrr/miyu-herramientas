<script>
  import { onMount } from 'svelte';
  import AppHeader from './AppHeader.svelte';
  import BackgroundRemover from './BackgroundRemover.svelte';
  import ImageConverter from './ImageConverter.svelte';
  import LegacyPanels from './LegacyPanels.svelte';
  import PaletteGenny from './PaletteGenny.svelte';
  import SettingsPanel from './SettingsPanel.svelte';
  import Sidebar from './Sidebar.svelte';
  import VideoDownloader from './VideoDownloader.svelte';

  onMount(async () => {
    await import('../scripts/app.js');
  });
</script>

<Sidebar />

<main class="main">
  <AppHeader />
  <LegacyPanels />
  <ImageConverter />
  <PaletteGenny />
  <BackgroundRemover />
  <VideoDownloader />
</main>

<SettingsPanel />
