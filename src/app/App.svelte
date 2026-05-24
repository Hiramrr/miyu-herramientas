<script>
  import { onMount } from 'svelte';
  import AppHeader from './AppHeader.svelte';
  import BackgroundRemover from './BackgroundRemover.svelte';
  import DataConverter from './DataConverter.svelte';
  import FaviconGenerator from './FaviconGenerator.svelte';
  import ImageConverter from './ImageConverter.svelte';
  import ImageEditor from './ImageEditor.svelte';
  import ImageOptimizer from './ImageOptimizer.svelte';
  import LegacyPanels from './LegacyPanels.svelte';
  import PaletteGenny from './PaletteGenny.svelte';
  import PdfExtraTools from './PdfExtraTools.svelte';
  import SettingsPanel from './SettingsPanel.svelte';
  import Sidebar from './Sidebar.svelte';
  import ToolGrid from './ToolGrid.svelte';
  import VideoDownloader from './VideoDownloader.svelte';

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
  <DataConverter />
  <ImageConverter />
  <ImageOptimizer />
  <ImageEditor />
  <FaviconGenerator />
  <PdfExtraTools />
  <PaletteGenny />
  <BackgroundRemover />
  <VideoDownloader />
</main>

<SettingsPanel />
