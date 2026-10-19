let pdfjsPromise;
let pdfLibPromise;

export async function loadPdfJs() {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      const lib = await import('pdfjs-dist');
      const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
      lib.GlobalWorkerOptions.workerSrc = workerUrl;
      return lib;
    })();
  }
  return pdfjsPromise;
}

export async function openPdfDocument(data, options = {}) {
  const lib = await loadPdfJs();
  return lib.getDocument({ ...options, data, isEvalSupported: false }).promise;
}

export function loadPdfLib() {
  if (!pdfLibPromise) pdfLibPromise = import('pdf-lib');
  return pdfLibPromise;
}

export async function destroyPdfDocument(pdf) {
  if (!pdf || typeof pdf.destroy !== 'function') return;
  try {
    await pdf.destroy();
  } catch {
    // El documento ya estaba liberado.
  }
}
