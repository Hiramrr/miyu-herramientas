import { describe, expect, it } from 'vitest';
import { toolLoaders } from '../tools/lazyImports.js';

describe('lazy tool imports', () => {
  it('loads every Svelte PDF extra tool from the sidebar registry', () => {
    [
      'pdf-organize',
      'pdf-page-numbers',
      'pdf-sign',
      'pdf-crop',
      'pdf-watermark',
      'pdf-metadata',
      'pdf-rotate',
      'pdf-remove',
    ].forEach((id) => {
      expect(toolLoaders[id], id).toBeTypeOf('function');
    });
  });
});
