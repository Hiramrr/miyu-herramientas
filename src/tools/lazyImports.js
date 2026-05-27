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

const textToolLoader = () => import('../app/TextTools.svelte');
const securityToolLoader = () => import('../app/SecurityTools.svelte');
const imageLegacyToolLoader = () => import('../app/ImageLegacyTools.svelte');
const codeToolLoader = () => import('../app/CodeTools.svelte');
const cssToolLoader = () => import('../app/CssTools.svelte');
const utilityToolLoader = () => import('../app/UtilityTools.svelte');
const pdfLegacyToolLoader = () => import('../app/PdfLegacyTools.svelte');
const asciiToolLoader = () => import('../app/AsciiTools.svelte');

export const toolLoaders = {
  bgremove: () => import('../app/BackgroundRemover.svelte'),
  'lama-inpaint': () => import('../app/LamaInpaint.svelte'),
  'csv-json': () => import('../app/DataConverter.svelte'),
  'image-convert': () => import('../app/ImageConverter.svelte'),
  'image-optimize': () => import('../app/ImageOptimizer.svelte'),
  'image-editor': () => import('../app/ImageEditor.svelte'),
  favicon: () => import('../app/FaviconGenerator.svelte'),
  palette: () => import('../app/PaletteGenny.svelte'),
  base64: () => import('../app/Base64Tool.svelte'),
  jwt: () => import('../app/JwtDecoder.svelte'),
  ...Object.fromEntries(pdfExtraToolIds.map((id) => [id, pdfExtraToolLoader])),
  'video-download': () => import('../app/VideoDownloader.svelte'),

  // Legacy tools migrated to Svelte
  text: textToolLoader,
  case: textToolLoader,
  lorem: textToolLoader,
  findreplace: textToolLoader,
  markdown: textToolLoader,
  diff: textToolLoader,

  password: securityToolLoader,
  passcheck: securityToolLoader,

  qr: imageLegacyToolLoader,
  image: imageLegacyToolLoader,

  json: codeToolLoader,
  html: codeToolLoader,
  htmlpreview: codeToolLoader,
  regex: codeToolLoader,
  hash: codeToolLoader,
  uuid: codeToolLoader,
  bases: codeToolLoader,
  ffmpeg: codeToolLoader,

  color: cssToolLoader,
  harmony: cssToolLoader,
  contrast: cssToolLoader,
  gradient: cssToolLoader,
  boxshadow: cssToolLoader,

  unit: utilityToolLoader,
  random: utilityToolLoader,
  timestamp: utilityToolLoader,
  timer: utilityToolLoader,
  notes: utilityToolLoader,

  pdf: () => import('../app/PdfCompressTool.svelte'),
  'pdf-merge': pdfLegacyToolLoader,
  'pdf-split': pdfLegacyToolLoader,
  'pdf-img2pdf': pdfLegacyToolLoader,
  'pdf-pdf2img': pdfLegacyToolLoader,
  'pdf-text': pdfLegacyToolLoader,

  ascii: asciiToolLoader,
};
