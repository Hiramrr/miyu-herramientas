<script>
  import { onDestroy, tick } from 'svelte';

  const modelId = 'briaai/RMBG-1.4';

  let sourceImage = null;
  let resultImage = null;
  let status = 'idle';
  let message = '';
  let progress = 0;
  let pipelineInstance = null;
  let resultCanvas;
  let fileInput;

  $: isProcessing = status === 'downloading' || status === 'processing';

  onDestroy(() => {
    if (pipelineInstance?.dispose) {
      pipelineInstance.dispose();
    }
  });

  function openFilePicker() {
    if (!isProcessing) fileInput?.click();
  }

  async function refreshIcons() {
    await tick();
    if (window.lucide?.createIcons) window.lucide.createIcons();
  }

  function handleFileSelect(event) {
    const file = event.currentTarget.files?.[0];
    if (file) readImageFile(file);
  }

  function handleDrop(event) {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file?.type.startsWith('image/')) readImageFile(file);
  }

  function readImageFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      sourceImage = reader.result;
      resultImage = null;
      status = 'idle';
      message = '';
      progress = 0;
      refreshIcons();
    };
    reader.readAsDataURL(file);
  }

  async function getPipeline() {
    if (pipelineInstance) return pipelineInstance;

    status = 'downloading';
    message = 'Descargando modelo...';
    progress = 0;

    const { pipeline, env } = await import('@huggingface/transformers');

    env.allowLocalModels = false;
    env.useBrowserCache = true;

    const progress_callback = (event) => {
      if (event.status === 'progress' && Number.isFinite(event.progress)) {
        progress = Math.round(event.progress);
      }
    };

    try {
      pipelineInstance = await pipeline('image-segmentation', modelId, {
        device: 'webgpu',
        dtype: 'fp32',
        progress_callback,
      });
    } catch (error) {
      console.info('WebGPU no disponible, usando WASM para quitar fondo.', error);
      pipelineInstance = await pipeline('image-segmentation', modelId, {
        device: 'wasm',
        dtype: 'fp32',
        progress_callback,
      });
    }

    return pipelineInstance;
  }

  async function removeBackground() {
    if (!sourceImage || isProcessing) return;

    try {
      const segmenter = await getPipeline();

      status = 'processing';
      message = 'Quitando fondo...';

      const result = await segmenter(sourceImage);
      const mask = result?.[0]?.mask;
      if (!mask) throw new Error('No se pudo generar la mascara de la imagen.');

      const maskUrl = await maskToImageUrl(mask);
      try {
        resultImage = await applyMask(sourceImage, maskUrl.url);
      } finally {
        if (maskUrl.revoke) URL.revokeObjectURL(maskUrl.url);
      }

      status = 'done';
      message = '';
      refreshIcons();
    } catch (error) {
      console.error('No se pudo quitar el fondo:', error);
      status = 'error';
      message = error instanceof Error ? error.message : 'No se pudo procesar la imagen.';
    }
  }

  async function maskToImageUrl(mask) {
    if (typeof mask?.toDataURL === 'function') {
      return { url: mask.toDataURL(), revoke: false };
    }

    if (mask instanceof Blob) {
      return { url: URL.createObjectURL(mask), revoke: true };
    }

    if (typeof mask === 'string') {
      return { url: mask, revoke: false };
    }

    if (mask?.data && mask?.width && mask?.height) {
      const canvas = document.createElement('canvas');
      canvas.width = mask.width;
      canvas.height = mask.height;
      const context = canvas.getContext('2d');
      const imageData = context.createImageData(mask.width, mask.height);

      for (let index = 0; index < mask.data.length; index += 1) {
        const value = mask.data[index];
        const offset = index * 4;
        imageData.data[offset] = value;
        imageData.data[offset + 1] = value;
        imageData.data[offset + 2] = value;
        imageData.data[offset + 3] = 255;
      }

      context.putImageData(imageData, 0, 0);
      return { url: canvas.toDataURL('image/png'), revoke: false };
    }

    throw new Error('Formato de mascara no soportado.');
  }

  async function applyMask(imageUrl, maskUrl) {
    const [image, mask] = await Promise.all([
      loadImage(imageUrl),
      loadImage(maskUrl),
    ]);

    const canvas = resultCanvas;
    const context = canvas.getContext('2d');

    canvas.width = image.width;
    canvas.height = image.height;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = canvas.width;
    maskCanvas.height = canvas.height;
    const maskContext = maskCanvas.getContext('2d');
    maskContext.drawImage(mask, 0, 0, canvas.width, canvas.height);
    const maskData = maskContext.getImageData(0, 0, canvas.width, canvas.height);

    for (let index = 0; index < imageData.data.length; index += 4) {
      imageData.data[index + 3] = maskData.data[index];
    }

    context.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/png');
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
  }

  function downloadResult() {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.download = 'sin-fondo.png';
    link.href = resultImage;
    link.click();
  }

  function clearImage() {
    sourceImage = null;
    resultImage = null;
    status = 'idle';
    message = '';
    progress = 0;
    if (fileInput) fileInput.value = '';
    refreshIcons();
  }
</script>

<div class="tool-panel" id="panel-bgremove">
  <div class="panel-header">
    <h2><i data-lucide="eraser"></i> Quitar Fondo</h2>
    <p>Elimina el fondo de fotos en tu navegador con BRIA RMBG-1.4</p>
  </div>

  <input
    bind:this={fileInput}
    class="bgremove-file"
    type="file"
    accept="image/*"
    onchange={handleFileSelect}
  >

  {#if !sourceImage}
    <button
      class="bgremove-dropzone"
      type="button"
      onclick={openFilePicker}
      ondragover={(event) => event.preventDefault()}
      ondrop={handleDrop}
    >
      <i data-lucide="upload-cloud"></i>
      <strong>Arrastra una imagen aquí</strong>
      <span>o haz clic para seleccionar una foto</span>
    </button>
  {:else}
    <div class:has-result={resultImage} class="bgremove-workspace">
      <div class="bgremove-preview">
        <div class="bgremove-preview-head">
          <h3>Original</h3>
          <button class="btn btn-quiet" type="button" onclick={clearImage} disabled={isProcessing}>
            <i data-lucide="trash-2"></i> Limpiar
          </button>
        </div>
        <div class="bgremove-image-frame">
          <img src={sourceImage} alt="Imagen original">
        </div>
      </div>

      {#if resultImage}
        <div class="bgremove-preview">
          <div class="bgremove-preview-head">
            <h3>Resultado</h3>
            <button class="btn btn-green" type="button" onclick={downloadResult}>
              <i data-lucide="download"></i> PNG
            </button>
          </div>
          <div class="bgremove-image-frame transparent">
            <img src={resultImage} alt="Imagen sin fondo">
          </div>
        </div>
      {/if}
    </div>

    {#if !resultImage}
      <button class="btn bgremove-action" type="button" onclick={removeBackground} disabled={isProcessing}>
        {#if isProcessing}
          <span class="bgremove-spinner"></span>
          {message}
          {#if status === 'downloading' && progress > 0}
            <span>{progress}%</span>
          {/if}
        {:else}
          <i data-lucide="eraser"></i> Quitar fondo
        {/if}
      </button>
    {/if}
  {/if}

  {#if status === 'downloading'}
    <div class="progress active bgremove-progress">
      <div class="progress-bar" style={`width: ${progress}%`}></div>
    </div>
  {/if}

  {#if status === 'error'}
    <div class="output bgremove-error">{message}</div>
  {/if}

  <div class="output bgremove-note">
    La primera vez descarga el modelo de IA (~180 MB). El procesamiento ocurre en el navegador; intenta WebGPU y usa WASM si no está disponible.
  </div>

  <canvas bind:this={resultCanvas} class="bgremove-canvas"></canvas>
</div>
