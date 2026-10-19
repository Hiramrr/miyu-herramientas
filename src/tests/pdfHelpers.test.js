import { describe, expect, it } from 'vitest';
import { PDFDocument, degrees } from 'pdf-lib';
import {
  canvasDeltaToPdf,
  cropBoxForPage,
  cropError,
  cropMarginsToCanvas,
  cropPdfPages,
  cropScale,
  effectivePageSize,
  imageKind,
  pickSmallerPdf,
  unsupportedImageMessage,
} from '../app/pdfHelpers.js';

describe('pdf crop coordinates', () => {
  it('crops a real rotated PDF relative to its existing visible box', async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage([595, 842]);
    page.setRotation(degrees(90));
    page.setCropBox(20, 30, 540, 750);
    cropPdfPages(doc.getPages(), { top: 10, right: 20, bottom: 30, left: 40 });
    const restored = await PDFDocument.load(await doc.save());
    expect(restored.getPage(0).getCropBox()).toEqual({ x: 30, y: 70, width: 500, height: 690 });
    expect(restored.getPage(0).getRotation().angle).toBe(90);
  });

  it('scales PDF points to canvas pixels and back', () => {
    const scale = cropScale(367, 595);
    expect(cropMarginsToCanvas({ top: 24, right: 0, bottom: 0, left: 0 }, scale).top).toBeCloseTo(14.8, 1);
    expect(canvasDeltaToPdf(14.8, scale)).toBeCloseTo(24, 0);
  });

  it('swaps page size for pages rotated 90 or 270 degrees', () => {
    expect(effectivePageSize(595, 842, 90)).toEqual({ width: 842, height: 595 });
    expect(effectivePageSize(595, 842, 180)).toEqual({ width: 595, height: 842 });
  });

  it('maps visual margins to an unrotated crop box', () => {
    const margins = { top: 10, right: 20, bottom: 30, left: 40 };
    expect(cropBoxForPage({ width: 595, height: 842, rotation: 0 }, margins)).toEqual({ x: 40, y: 30, width: 535, height: 802 });
    expect(cropBoxForPage({ width: 595, height: 842, rotation: 180 }, margins)).toEqual({ x: 20, y: 10, width: 535, height: 802 });
  });

  it('maps visual margins for pages rotated 90 and 270 degrees', () => {
    const margins = { top: 10, right: 20, bottom: 30, left: 40 };
    expect(cropBoxForPage({ width: 595, height: 842, rotation: 90 }, margins)).toEqual({ x: 10, y: 40, width: 555, height: 782 });
    expect(cropBoxForPage({ width: 595, height: 842, rotation: 270 }, margins)).toEqual({ x: 30, y: 20, width: 555, height: 782 });
  });

  it('rejects margins that leave almost no page', () => {
    expect(cropError({ width: 100, height: 100, rotation: 0 }, { top: 0, right: 0, bottom: 0, left: 90 })).toMatch(/demasiado grandes/);
    expect(cropError({ width: 595, height: 842, rotation: 0 }, { top: 24, right: 24, bottom: 24, left: 24 })).toBeNull();
  });
});

describe('pdf download choice', () => {
  it('keeps the original when the result is not smaller', () => {
    const original = new Uint8Array(100);
    expect(pickSmallerPdf(original, new Uint8Array(120)).isOriginal).toBe(true);
    expect(pickSmallerPdf(original, new Uint8Array(80)).isOriginal).toBe(false);
    expect(pickSmallerPdf(original, new Uint8Array(80)).bytes.length).toBe(80);
  });
});

describe('image kind for images to PDF', () => {
  it('accepts PNG, JPEG and WebP by type or extension', () => {
    expect(imageKind({ type: 'image/webp', name: 'foto.webp' })).toBe('webp');
    expect(imageKind({ type: '', name: 'foto.JPG' })).toBe('jpeg');
    expect(imageKind({ type: 'image/png', name: 'foto' })).toBe('png');
  });

  it('rejects other formats with a human message', () => {
    expect(imageKind({ type: 'image/gif', name: 'foto.gif' })).toBeNull();
    expect(unsupportedImageMessage({ name: 'foto.gif' })).toContain('PNG, JPEG o WebP');
  });
});
