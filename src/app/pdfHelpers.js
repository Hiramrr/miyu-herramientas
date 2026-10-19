export function cropScale(canvasWidth, pdfWidth) {
  if (!canvasWidth || !pdfWidth) return 1;
  return canvasWidth / pdfWidth;
}

export function cropMarginsToCanvas(margins, scale) {
  return {
    top: (Number(margins.top) || 0) * scale,
    right: (Number(margins.right) || 0) * scale,
    bottom: (Number(margins.bottom) || 0) * scale,
    left: (Number(margins.left) || 0) * scale,
  };
}

export function canvasDeltaToPdf(delta, scale) {
  if (!scale) return delta;
  return delta / scale;
}

export function normalizeRotation(rotation) {
  return ((Number(rotation) || 0) % 360 + 360) % 360;
}

export function effectivePageSize(width, height, rotation) {
  const rotated = normalizeRotation(rotation);
  return rotated === 90 || rotated === 270
    ? { width: height, height: width }
    : { width, height };
}

// Margins are in the rotated view the person sees. The returned box uses
// pdf-lib coordinates, origin at the lower-left corner of the unrotated page.
export function cropBoxForPage(page, margins) {
  const top = Number(margins.top) || 0;
  const right = Number(margins.right) || 0;
  const bottom = Number(margins.bottom) || 0;
  const left = Number(margins.left) || 0;
  const rotation = normalizeRotation(page.rotation);
  const view = effectivePageSize(page.width, page.height, rotation);
  const width = view.width - left - right;
  const height = view.height - top - bottom;

  if (rotation === 90) return { x: top, y: left, width: page.width - top - bottom, height: page.height - left - right };
  if (rotation === 180) return { x: right, y: top, width, height };
  if (rotation === 270) return { x: bottom, y: right, width: page.width - top - bottom, height: page.height - left - right };
  return { x: left, y: bottom, width, height };
}

export function cropError(page, margins) {
  const view = effectivePageSize(page.width, page.height, page.rotation);
  const left = Number(margins.left) || 0;
  const right = Number(margins.right) || 0;
  const top = Number(margins.top) || 0;
  const bottom = Number(margins.bottom) || 0;
  if (left < 0 || right < 0 || top < 0 || bottom < 0) return 'Los márgenes no pueden ser negativos.';
  if (view.width - left - right <= 20 || view.height - top - bottom <= 20) {
    return 'Los márgenes son demasiado grandes para el tamaño del PDF.';
  }
  return null;
}

export function cropPdfPages(pages, margins) {
  for (const page of pages) {
    const original = page.getCropBox();
    const size = { ...original, rotation: page.getRotation().angle };
    const error = cropError(size, margins);
    if (error) throw new Error(error);
    const box = cropBoxForPage(size, margins);
    page.setCropBox(original.x + box.x, original.y + box.y, box.width, box.height);
  }
}

export function pickSmallerPdf(originalBytes, outputBytes) {
  if (outputBytes && outputBytes.length < originalBytes.length) {
    return { bytes: outputBytes, isOriginal: false };
  }
  return { bytes: originalBytes, isOriginal: true };
}

const IMAGE_KIND_BY_TYPE = {
  'image/png': 'png',
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpeg',
  'image/webp': 'webp',
};

const IMAGE_KIND_BY_EXTENSION = {
  png: 'png',
  jpg: 'jpeg',
  jpeg: 'jpeg',
  webp: 'webp',
};

export function imageKind(file) {
  const byType = IMAGE_KIND_BY_TYPE[(file?.type || '').toLowerCase()];
  if (byType) return byType;
  const extension = (file?.name || '').split('.').pop()?.toLowerCase();
  return IMAGE_KIND_BY_EXTENSION[extension] || null;
}

export function unsupportedImageMessage(file) {
  const name = file?.name || 'Una imagen';
  return `${name} no es un formato compatible. Usa PNG, JPEG o WebP.`;
}
