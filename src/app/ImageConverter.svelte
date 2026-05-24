<script>
  import { onDestroy, tick } from 'svelte';

  const formats = [
    { value: 'image/png', label: 'PNG', extension: 'png', supportsQuality: false },
    { value: 'image/jpeg', label: 'JPEG', extension: 'jpg', supportsQuality: true },
    { value: 'image/webp', label: 'WebP', extension: 'webp', supportsQuality: true },
  ];

  let fileInput;
  let previewCanvas;
  let selectedFile = null;
  let sourceUrl = '';
  let outputUrl = '';
  let outputBlob = null;
  let status = 'idle';
  let message = '';
  let targetFormat = 'image/jpeg';
  let quality = 0.9;
  let backgroundColor = '#ffffff';
  let sourceInfo = null;

  $: selectedFormat = formats.find((format) => format.value === targetFormat) || formats[0];
  $: downloadName = selectedFile
    ? `${selectedFile.name.replace(/\.[^.]+$/, '')}.${selectedFormat.extension}`
    : `imagen-convertida.${selectedFormat.extension}`;
  $: canConvert = Boolean(selectedFile) && status !== 'processing';

  onDestroy(() => {
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    clearOutput();
  });

  function openFilePicker() {
    if (status !== 'processing') fileInput?.click();
  }

  function backToList() {
    if (window.showTool) window.showTool(null);
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

  async function readImageFile(file) {
    clearOutput();
    selectedFile = file;
    sourceUrl = URL.createObjectURL(file);
    status = 'idle';
    message = '';

    try {
      const image = await loadImage(sourceUrl);
      sourceInfo = {
        width: image.naturalWidth || image.width,
        height: image.naturalHeight || image.height,
        size: file.size,
        type: file.type || 'image/*',
      };
    } catch (error) {
      console.error('No se pudo leer la imagen:', error);
      status = 'error';
      message = 'No se pudo cargar la imagen seleccionada.';
      sourceInfo = null;
    }

    refreshIcons();
  }

  function clearOutput() {
    if (outputUrl) URL.revokeObjectURL(outputUrl);
    outputUrl = '';
    outputBlob = null;
  }

  function clearImage() {
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    clearOutput();
    selectedFile = null;
    sourceUrl = '';
    sourceInfo = null;
    status = 'idle';
    message = '';
    if (fileInput) fileInput.value = '';
    refreshIcons();
  }

  async function convertImage() {
    if (!selectedFile || status === 'processing') return;

    try {
      status = 'processing';
      message = 'Convirtiendo imagen...';
      clearOutput();

      const image = await loadImage(sourceUrl);
      const canvas = previewCanvas;
      const context = canvas.getContext('2d');
      const width = image.naturalWidth || image.width;
      const height = image.naturalHeight || image.height;

      canvas.width = width;
      canvas.height = height;
      context.clearRect(0, 0, width, height);

      if (targetFormat === 'image/jpeg') {
        context.fillStyle = backgroundColor;
        context.fillRect(0, 0, width, height);
      }

      context.drawImage(image, 0, 0, width, height);
      outputBlob = await canvasToBlob(canvas, targetFormat, selectedFormat.supportsQuality ? Number(quality) : undefined);
      outputUrl = URL.createObjectURL(outputBlob);
      status = 'done';
      message = 'Imagen lista para descargar.';
      refreshIcons();
    } catch (error) {
      console.error('No se pudo convertir la imagen:', error);
      status = 'error';
      message = error instanceof Error ? error.message : 'No se pudo convertir la imagen.';
    }
  }

  function canvasToBlob(canvas, type, imageQuality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Este navegador no pudo exportar ese formato.'));
          return;
        }
        resolve(blob);
      }, type, imageQuality);
    });
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
  }

  function downloadResult() {
    if (!outputUrl) return;
    const link = document.createElement('a');
    link.download = downloadName;
    link.href = outputUrl;
    link.click();
  }

  function formatBytes(bytes) {
    if (!Number.isFinite(bytes)) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
</script>

<div class="tool-panel" id="panel-image-convert">
  <div class="panel-header">
    <h2><i data-lucide="repeat"></i> Convertir Imagen</h2>
    <p>Cambia imágenes entre PNG, JPEG y WebP directamente en tu navegador</p>
  </div>

  <input
    bind:this={fileInput}
    class="image-convert-file"
    type="file"
    accept="image/png,image/jpeg,image/webp,image/*"
    onchange={handleFileSelect}
  >

  {#if !selectedFile}
    <button
      class="image-convert-dropzone"
      type="button"
      onclick={openFilePicker}
      ondragover={(event) => event.preventDefault()}
      ondrop={handleDrop}
    >
      <i data-lucide="upload-cloud"></i>
      <strong>Arrastra una imagen aquí</strong>
      <span>PNG, JPEG, WebP y otros formatos compatibles del navegador</span>
    </button>
  {:else}
    <div class="image-convert-grid">
      <div class="image-convert-preview">
        <div class="image-convert-preview-head">
          <h3>Original</h3>
          <button class="btn btn-quiet" type="button" onclick={clearImage} disabled={status === 'processing'}>
            <i data-lucide="trash-2"></i> Limpiar
          </button>
        </div>
        <div class="image-convert-frame">
          <img src={sourceUrl} alt="Imagen original">
        </div>
        {#if sourceInfo}
          <div class="image-convert-meta">
            {sourceInfo.width} x {sourceInfo.height}px · {formatBytes(sourceInfo.size)}
          </div>
        {/if}
      </div>

      <div class="image-convert-options">
        <label for="image-convert-format">Formato de salida</label>
        <select id="image-convert-format" bind:value={targetFormat} disabled={status === 'processing'}>
          {#each formats as format}
            <option value={format.value}>{format.label}</option>
          {/each}
        </select>

        {#if selectedFormat.supportsQuality}
          <label for="image-convert-quality">Calidad: {Math.round(quality * 100)}%</label>
          <input
            id="image-convert-quality"
            type="range"
            min="0.1"
            max="1"
            step="0.05"
            bind:value={quality}
            disabled={status === 'processing'}
          >
        {/if}

        {#if targetFormat === 'image/jpeg'}
          <label for="image-convert-bg">Fondo para transparencias</label>
          <input
            id="image-convert-bg"
            class="image-convert-color"
            type="color"
            bind:value={backgroundColor}
            disabled={status === 'processing'}
          >
        {/if}

        <div class="btn-row">
          <button class="btn" type="button" onclick={convertImage} disabled={!canConvert}>
            {#if status === 'processing'}
              <span class="image-convert-spinner"></span> Convirtiendo
            {:else}
              <i data-lucide="repeat"></i> Convertir
            {/if}
          </button>
          {#if outputUrl}
            <button class="btn btn-green" type="button" onclick={downloadResult}>
              <i data-lucide="download"></i> Descargar {selectedFormat.label}
            </button>
          {/if}
        </div>

        {#if outputBlob}
          <div class="output image-convert-result">
            <strong>{downloadName}</strong>
            <span>{formatBytes(outputBlob.size)}</span>
          </div>
        {/if}
      </div>
    </div>
  {/if}

  {#if status === 'error' || status === 'done'}
    <div class:error={status === 'error'} class:success={status === 'done'} class="output image-convert-status">
      {message}
    </div>
  {/if}

  <canvas bind:this={previewCanvas} class="image-convert-canvas"></canvas>
</div>
