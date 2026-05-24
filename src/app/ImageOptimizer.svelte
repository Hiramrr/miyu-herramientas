<script>
  import { onDestroy } from 'svelte';

  let fileInput;
  let file = null;
  let sourceUrl = '';
  let resultUrl = '';
  let resultBlob = null;
  let status = 'Selecciona una imagen para redimensionarla o reducir su peso.';
  let sourceMeta = '';
  let resultMeta = '';
  let maxWidth = 1920;
  let maxHeight = 1080;
  let format = 'image/webp';
  let quality = 0.82;
  let keepAspect = true;
  let isWorking = false;

  $: outputExtension = format === 'image/png' ? 'png' : format === 'image/jpeg' ? 'jpg' : 'webp';
  $: downloadName = file ? `${file.name.replace(/\.[^.]+$/, '')}-optimizada.${outputExtension}` : `imagen-optimizada.${outputExtension}`;

  onDestroy(() => {
    revoke(sourceUrl);
    revoke(resultUrl);
  });

  function revoke(url) {
    if (url) URL.revokeObjectURL(url);
  }

  function formatBytes(bytes) {
    if (!bytes) return '0 KB';
    const units = ['B', 'KB', 'MB', 'GB'];
    let value = bytes;
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) {
      value /= 1024;
      unit += 1;
    }
    return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
  }

  function loadImage(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('No se pudo leer la imagen.'));
      image.src = url;
    });
  }

  function targetSize(width, height) {
    const safeWidth = Math.max(1, Number(maxWidth) || width);
    const safeHeight = Math.max(1, Number(maxHeight) || height);
    if (!keepAspect) return { width: safeWidth, height: safeHeight };
    const ratio = Math.min(safeWidth / width, safeHeight / height, 1);
    return {
      width: Math.max(1, Math.round(width * ratio)),
      height: Math.max(1, Math.round(height * ratio)),
    };
  }

  async function selectImage(event) {
    const nextFile = event.currentTarget.files?.[0];
    if (!nextFile) return;
    file = nextFile;
    revoke(sourceUrl);
    revoke(resultUrl);
    resultUrl = '';
    resultBlob = null;
    resultMeta = '';
    sourceUrl = URL.createObjectURL(nextFile);
    try {
      const image = await loadImage(sourceUrl);
      sourceMeta = `${image.naturalWidth} x ${image.naturalHeight}px · ${formatBytes(nextFile.size)}`;
      status = 'Imagen lista. Ajusta tamaño, formato o calidad y optimiza.';
    } catch (error) {
      status = error.message;
      sourceMeta = '';
    }
  }

  async function optimizeImage() {
    if (!file || !sourceUrl) {
      status = 'Selecciona una imagen primero.';
      return;
    }
    isWorking = true;
    status = 'Optimizando imagen...';
    try {
      const image = await loadImage(sourceUrl);
      const size = targetSize(image.naturalWidth, image.naturalHeight);
      const canvas = document.createElement('canvas');
      canvas.width = size.width;
      canvas.height = size.height;
      const ctx = canvas.getContext('2d', { alpha: format !== 'image/jpeg' });
      if (format === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size.width, size.height);
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(image, 0, 0, size.width, size.height);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, format, Number(quality)));
      if (!blob) throw new Error('El navegador no pudo exportar la imagen.');
      revoke(resultUrl);
      resultBlob = blob;
      resultUrl = URL.createObjectURL(blob);
      const saved = Math.max(0, Math.round((1 - blob.size / file.size) * 100));
      resultMeta = `${size.width} x ${size.height}px · ${formatBytes(blob.size)} · ${saved}% menos`;
      status = 'Imagen optimizada localmente.';
    } catch (error) {
      status = error.message || 'No se pudo optimizar la imagen.';
    } finally {
      isWorking = false;
    }
  }

  function downloadResult() {
    if (!resultUrl) return;
    const link = document.createElement('a');
    link.href = resultUrl;
    link.download = downloadName;
    link.click();
  }
</script>

<div class="tool-panel" id="panel-image-optimize">
  <div class="panel-header">
    <h2><i data-lucide="sliders-horizontal"></i> Optimizar Imagen</h2>
    <p>Reduce peso, cambia formato y ajusta dimensiones sin subir tus archivos</p>
  </div>

  <input class="image-convert-file" bind:this={fileInput} type="file" accept="image/*" onchange={selectImage}>
  <button class="image-convert-dropzone" type="button" onclick={() => fileInput?.click()}>
    <i data-lucide="image-up"></i>
    <strong>{file ? file.name : 'Seleccionar imagen'}</strong>
    <span>{sourceMeta || 'PNG, JPG, WebP, GIF estático y otros formatos soportados por el navegador'}</span>
  </button>

  <div class="image-opt-grid">
    <div>
      <div class="image-convert-preview-head">
        <h3>Vista previa</h3>
        <span>{resultMeta || sourceMeta}</span>
      </div>
      <div class="image-convert-frame">
        {#if resultUrl}
          <img src={resultUrl} alt="Imagen optimizada">
        {:else if sourceUrl}
          <img src={sourceUrl} alt="Imagen original">
        {:else}
          <span class="image-opt-empty">La imagen aparecerá aquí</span>
        {/if}
      </div>
    </div>

    <div class="image-convert-options">
      <div class="pdf-extra-grid image-opt-controls">
        <div>
          <label for="image-opt-width">Ancho máximo</label>
          <input id="image-opt-width" type="number" min="1" bind:value={maxWidth}>
        </div>
        <div>
          <label for="image-opt-height">Alto máximo</label>
          <input id="image-opt-height" type="number" min="1" bind:value={maxHeight}>
        </div>
        <div>
          <label for="image-opt-format">Formato</label>
          <select id="image-opt-format" bind:value={format}>
            <option value="image/webp">WebP</option>
            <option value="image/jpeg">JPEG</option>
            <option value="image/png">PNG</option>
          </select>
        </div>
        <div>
          <label for="image-opt-quality">Calidad: {Math.round(quality * 100)}%</label>
          <input id="image-opt-quality" type="range" min="0.35" max="1" step="0.01" bind:value={quality} disabled={format === 'image/png'}>
        </div>
      </div>

      <label class="inline-toggle" for="image-opt-aspect">
        <input id="image-opt-aspect" type="checkbox" bind:checked={keepAspect}>
        Mantener proporción
      </label>

      <div class="btn-row">
        <button class="btn" type="button" onclick={optimizeImage} disabled={isWorking}>
          {#if isWorking}<span class="image-convert-spinner"></span>{:else}<i data-lucide="wand-sparkles"></i>{/if}
          Optimizar
        </button>
        {#if resultUrl}
          <button class="btn btn-green" type="button" onclick={downloadResult}><i data-lucide="download"></i> Descargar</button>
        {/if}
      </div>
    </div>
  </div>

  <div class="output image-convert-status" class:success={resultUrl} class:error={status.includes('No se') || status.includes('no pudo')}>
    {status}
  </div>
</div>
