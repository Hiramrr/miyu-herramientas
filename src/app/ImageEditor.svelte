<script>
  import { onDestroy, tick } from 'svelte';

  let fileInput;
  let canvas;
  let file = null;
  let image = null;
  let imageUrl = '';
  let status = 'Selecciona una imagen para editarla.';
  let brightness = 100;
  let contrast = 100;
  let saturation = 100;
  let blur = 0;
  let rotation = 0;
  let flipX = false;
  let flipY = false;
  let outputType = 'image/png';

  $: downloadExtension = outputType === 'image/jpeg' ? 'jpg' : outputType === 'image/webp' ? 'webp' : 'png';
  $: downloadName = file ? `${file.name.replace(/\.[^.]+$/, '')}-editada.${downloadExtension}` : `imagen-editada.${downloadExtension}`;
  $: if (image && canvas) {
    void brightness, void contrast, void saturation, void blur, void rotation, void flipX, void flipY;
    renderImage();
  }

  onDestroy(() => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
  });

  function loadImage(url) {
    return new Promise((resolve, reject) => {
      const nextImage = new Image();
      nextImage.onload = () => resolve(nextImage);
      nextImage.onerror = () => reject(new Error('No se pudo cargar la imagen.'));
      nextImage.src = url;
    });
  }

  async function selectImage(event) {
    const nextFile = event.currentTarget.files?.[0];
    if (!nextFile) return;
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    file = nextFile;
    imageUrl = URL.createObjectURL(nextFile);
    status = 'Cargando imagen...';
    try {
      image = await loadImage(imageUrl);
      status = `${image.naturalWidth} x ${image.naturalHeight}px lista para editar.`;
      await tick();
      renderImage();
    } catch (error) {
      image = null;
      status = error.message || 'No se pudo cargar la imagen.';
    }
  }

  function canvasSize() {
    if (!image) return { width: 1, height: 1 };
    const angle = ((Number(rotation) % 360) + 360) % 360;
    const sideways = angle === 90 || angle === 270;
    return {
      width: sideways ? image.naturalHeight : image.naturalWidth,
      height: sideways ? image.naturalWidth : image.naturalHeight,
    };
  }

  function renderImage() {
    if (!image || !canvas) return;
    const ctx = canvas.getContext('2d');
    const size = canvasSize();
    canvas.width = size.width;
    canvas.height = size.height;
    ctx.clearRect(0, 0, size.width, size.height);
    ctx.save();
    ctx.translate(size.width / 2, size.height / 2);
    ctx.rotate((Number(rotation) * Math.PI) / 180);
    ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blur}px)`;
    ctx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);
    ctx.restore();
  }

  function rotateBy(amount) {
    rotation = (((Number(rotation) + amount) % 360) + 360) % 360;
  }

  function resetEdits() {
    brightness = 100;
    contrast = 100;
    saturation = 100;
    blur = 0;
    rotation = 0;
    flipX = false;
    flipY = false;
    status = image ? 'Ajustes restablecidos.' : 'Selecciona una imagen para editarla.';
  }

  function downloadImage() {
    if (!canvas || !image) {
      status = 'Selecciona una imagen primero.';
      return;
    }
    const quality = outputType === 'image/png' ? undefined : 0.92;
    canvas.toBlob((blob) => {
      if (!blob) {
        status = 'El navegador no pudo exportar la imagen.';
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = downloadName;
      link.click();
      URL.revokeObjectURL(url);
      status = 'Imagen descargada.';
    }, outputType, quality);
  }
</script>

<div class="tool-panel" id="panel-image-editor">
  <div class="panel-header">
    <h2><i data-lucide="scan-line"></i> Editor de Imagen</h2>
    <p>Ajusta color, rota, voltea y exporta una imagen desde el navegador</p>
  </div>

  <input class="image-convert-file" bind:this={fileInput} type="file" accept="image/*" onchange={selectImage}>
  <button class="image-convert-dropzone" type="button" onclick={() => fileInput?.click()}>
    <i data-lucide="image-plus"></i>
    <strong>{file ? file.name : 'Seleccionar imagen'}</strong>
    <span>Los cambios se aplican localmente sobre una vista previa en canvas</span>
  </button>

  <div class="image-editor-grid">
    <div class="image-editor-stage">
      {#if image}
        <canvas bind:this={canvas} class="image-editor-canvas"></canvas>
      {:else}
        <div class="image-editor-empty">
          <i data-lucide="image"></i>
          <span>La vista previa aparecerá aquí</span>
        </div>
      {/if}
    </div>

    <div class="image-convert-options image-editor-options">
      <div class="image-editor-actions">
        <button class="btn" type="button" onclick={() => rotateBy(-90)} disabled={!image}><i data-lucide="rotate-ccw"></i> Izquierda</button>
        <button class="btn" type="button" onclick={() => rotateBy(90)} disabled={!image}><i data-lucide="rotate-cw"></i> Derecha</button>
        <button class="btn" type="button" onclick={() => (flipX = !flipX)} disabled={!image}><i data-lucide="flip-horizontal"></i> Horizontal</button>
        <button class="btn" type="button" onclick={() => (flipY = !flipY)} disabled={!image}><i data-lucide="flip-vertical"></i> Vertical</button>
      </div>

      <label for="image-edit-brightness">Brillo: {brightness}%</label>
      <input id="image-edit-brightness" type="range" min="0" max="200" step="1" bind:value={brightness} disabled={!image}>

      <label for="image-edit-contrast">Contraste: {contrast}%</label>
      <input id="image-edit-contrast" type="range" min="0" max="200" step="1" bind:value={contrast} disabled={!image}>

      <label for="image-edit-saturation">Saturación: {saturation}%</label>
      <input id="image-edit-saturation" type="range" min="0" max="220" step="1" bind:value={saturation} disabled={!image}>

      <label for="image-edit-blur">Desenfoque: {blur}px</label>
      <input id="image-edit-blur" type="range" min="0" max="12" step="0.5" bind:value={blur} disabled={!image}>

      <label for="image-edit-format">Formato de salida</label>
      <select id="image-edit-format" bind:value={outputType} disabled={!image}>
        <option value="image/png">PNG</option>
        <option value="image/jpeg">JPEG</option>
        <option value="image/webp">WebP</option>
      </select>

      <div class="btn-row">
        <button class="btn" type="button" onclick={resetEdits}><i data-lucide="undo-2"></i> Restablecer</button>
        <button class="btn btn-green" type="button" onclick={downloadImage} disabled={!image}><i data-lucide="download"></i> Descargar</button>
      </div>
    </div>
  </div>

  <div class="output">{status}</div>
</div>
