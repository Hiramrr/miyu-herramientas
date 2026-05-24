export const toolLoaders = {
  bgremove: () => import('../app/BackgroundRemover.svelte'),
  'csv-json': () => import('../app/DataConverter.svelte'),
  'image-convert': () => import('../app/ImageConverter.svelte'),
  'image-optimize': () => import('../app/ImageOptimizer.svelte'),
  'image-editor': () => import('../app/ImageEditor.svelte'),
  favicon: () => import('../app/FaviconGenerator.svelte'),
  palette: () => import('../app/PaletteGenny.svelte'),
  pdf: () => import('../app/PdfExtraTools.svelte'),
  'video-download': () => import('../app/VideoDownloader.svelte'),
};
