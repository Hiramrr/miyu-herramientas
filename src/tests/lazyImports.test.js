import { describe, expect, it } from 'vitest';
import { toolLoaders } from '../tools/lazyImports.js';

const allToolIds = [
  'bgremove', 'csv-json', 'image-convert', 'image-optimize', 'image-editor',
  'favicon', 'palette', 'video-download',
  // Legacy tools migrated to Svelte
  'text', 'case', 'lorem', 'findreplace', 'markdown', 'diff',
  'password', 'passcheck',
  'qr', 'image',
  'json', 'html', 'htmlpreview', 'regex', 'hash', 'uuid', 'bases', 'ffmpeg',
  'color', 'harmony', 'contrast', 'gradient', 'boxshadow',
  'unit', 'random', 'timestamp', 'timer', 'notes',
  'pdf', 'pdf-merge', 'pdf-split', 'pdf-img2pdf', 'pdf-pdf2img', 'pdf-text',
  'ascii',
  // PDF extra tools
  'pdf-organize', 'pdf-page-numbers', 'pdf-sign', 'pdf-crop',
  'pdf-watermark', 'pdf-metadata', 'pdf-rotate', 'pdf-remove',
];

describe('lazy tool imports', () => {
  it('provides a loader for every tool', () => {
    allToolIds.forEach((id) => {
      expect(toolLoaders[id], `missing loader for "${id}"`).toBeTypeOf('function');
    });
  });
});
