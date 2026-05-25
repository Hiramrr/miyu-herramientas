export function isAppleMobile() {
  if (typeof navigator === 'undefined') return false;

  const platform = navigator.platform || '';
  const userAgent = navigator.userAgent || '';
  const iPadDesktopMode = platform === 'MacIntel' && navigator.maxTouchPoints > 1;

  return /iPad|iPhone|iPod/.test(userAgent) || iPadDesktopMode;
}

export function shouldUseSingleThreadWasm() {
  if (typeof window === 'undefined') return true;

  return isAppleMobile() || window.crossOriginIsolated !== true;
}

export async function supportsWebGpu() {
  if (isAppleMobile()) return false;
  if (typeof navigator === 'undefined' || !navigator.gpu) return false;

  try {
    const adapter = await navigator.gpu.requestAdapter();
    return Boolean(adapter);
  } catch (error) {
    console.info('No se pudo validar WebGPU en este navegador.', error);
    return false;
  }
}

export function configureOnnxWasm(ortEnv) {
  if (!ortEnv?.wasm) return;

  ortEnv.wasm.proxy = false;
  ortEnv.wasm.numThreads = shouldUseSingleThreadWasm()
    ? 1
    : Math.min(4, navigator.hardwareConcurrency || 4);
}

export function mobileAiErrorMessage(error) {
  const detail = error instanceof Error ? error.message : String(error || '');

  if (isAppleMobile()) {
    return 'No se pudo iniciar el modelo en iPhone. Se intentó el modo compatible WASM; prueba con una imagen más pequeña o vuelve a cargar la página.';
  }

  return detail || 'No se pudo iniciar el modelo de IA en este navegador.';
}
