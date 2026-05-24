const pdfExtraToolLoader = () => import('../app/PdfExtraTools.svelte');

const pdfExtraToolIds = [
  'pdf-organize',
  'pdf-page-numbers',
  'pdf-sign',
  'pdf-crop',
  'pdf-watermark',
  'pdf-metadata',
  'pdf-rotate',
  'pdf-remove',
];

export const toolLoaders = {
  bgremove: () => import('../app/BackgroundRemover.svelte'),
  'csv-json': () => import('../app/DataConverter.svelte'),
  'image-convert': () => import('../app/ImageConverter.svelte'),
  'image-optimize': () => import('../app/ImageOptimizer.svelte'),
  'image-editor': () => import('../app/ImageEditor.svelte'),
  favicon: () => import('../app/FaviconGenerator.svelte'),
  palette: () => import('../app/PaletteGenny.svelte'),
  ...Object.fromEntries(pdfExtraToolIds.map((id) => [id, pdfExtraToolLoader])),
  'video-download': () => import('../app/VideoDownloader.svelte'),
};
