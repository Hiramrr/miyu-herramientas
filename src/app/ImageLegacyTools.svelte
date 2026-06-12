<script>
  import QRCode from 'qrcode';
  import { activeTool } from '../tools/activeTool.svelte.js';

  const qrModuleShapes = [
    { value: 'square', label: 'Cuadros' },
    { value: 'rounded', label: 'Redondeados' },
    { value: 'dots', label: 'Puntos' },
    { value: 'diamond', label: 'Diamantes' },
  ];

  const qrEyeShapes = [
    { value: 'square', label: 'Cuadrados' },
    { value: 'rounded', label: 'Redondeados' },
    { value: 'circle', label: 'Circulares' },
  ];

  const qrErrorLevels = [
    { value: 'L', label: 'Baja' },
    { value: 'M', label: 'Media' },
    { value: 'Q', label: 'Alta' },
    { value: 'H', label: 'Máxima' },
  ];

  let qrDataURL = '';
  let qrError = '';
  let qrStatus = '';
  let qrText = '';
  let qrSize = 360;
  let qrMargin = 4;
  let qrModuleShape = 'rounded';
  let qrEyeShape = 'rounded';
  let qrDarkColor = '#1f2937';
  let qrLightColor = '#ffffff';
  let qrBackgroundTransparent = false;
  let qrErrorCorrection = 'H';
  let qrLogoInput;
  let qrLogoDataURL = '';
  let qrLogoName = '';
  let qrLogoSize = 22;
  let qrLogoPadding = 10;
  let qrLogoRadius = 18;
  let qrLogoBackground = true;
  let qrRenderId = 0;
  let imgBase64 = '';

  async function generateQR() {
    const renderId = ++qrRenderId;
    qrError = '';
    qrStatus = '';

    if (!qrText.trim()) {
      qrDataURL = '';
      qrError = 'Escribe un texto o URL para generar el código QR.';
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      const safeSize = clampNumber(qrSize, 180, 900);
      canvas.width = safeSize;
      canvas.height = safeSize;

      const qr = QRCode.create(qrText.trim(), {
        errorCorrectionLevel: qrErrorCorrection,
      });

      drawStyledQR(canvas, qr);

      if (qrLogoDataURL) {
        await drawQRLogo(canvas);
      }

      if (renderId !== qrRenderId) return;
      qrDataURL = canvas.toDataURL('image/png');
      qrStatus = `${qr.modules.size} módulos · ${safeSize}px · corrección ${getQRErrorLabel(qrErrorCorrection)}${qrLogoDataURL ? ' · logo aplicado' : ''}`;
    } catch (error) {
      if (renderId !== qrRenderId) return;
      qrDataURL = '';
      qrError = 'No se pudo generar el código QR. Intenta con un texto más corto.';
      console.error('QR generation error:', error);
    }
  }

  function regenerateQRIfReady() {
    if (qrDataURL && qrText.trim()) generateQR();
  }

  function downloadQR() {
    if (qrDataURL) {
      const a = document.createElement('a');
      a.href = qrDataURL;
      a.download = 'qrcode.png';
      a.click();
    }
  }

  function resetQRStyle() {
    qrSize = 360;
    qrMargin = 4;
    qrModuleShape = 'rounded';
    qrEyeShape = 'rounded';
    qrDarkColor = '#1f2937';
    qrLightColor = '#ffffff';
    qrBackgroundTransparent = false;
    qrErrorCorrection = 'H';
    qrLogoSize = 22;
    qrLogoPadding = 10;
    qrLogoRadius = 18;
    qrLogoBackground = true;
    regenerateQRIfReady();
  }

  function getQRErrorLabel(value) {
    return qrErrorLevels.find((level) => level.value === value)?.label || value;
  }

  function openQRLogoPicker() {
    qrLogoInput?.click();
  }

  function handleQRLogoSelect(event) {
    const file = event.currentTarget.files?.[0];
    if (file) readQRLogo(file);
  }

  function handleQRLogoDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');
    const file = event.dataTransfer?.files?.[0];
    if (file?.type.startsWith('image/')) readQRLogo(file);
  }

  function readQRLogo(file) {
    if (!file.type.startsWith('image/')) {
      qrError = 'Selecciona una imagen válida para el logo.';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      qrLogoDataURL = reader.result;
      qrLogoName = file.name;
      if (qrText.trim()) generateQR();
    };
    reader.onerror = () => {
      qrError = 'No se pudo cargar la imagen del logo.';
    };
    reader.readAsDataURL(file);
  }

  function clearQRLogo() {
    qrLogoDataURL = '';
    qrLogoName = '';
    if (qrLogoInput) qrLogoInput.value = '';
    regenerateQRIfReady();
  }

  function drawStyledQR(canvas, qr) {
    const context = canvas.getContext('2d');
    const size = canvas.width;
    const moduleCount = qr.modules.size;
    const margin = clampNumber(qrMargin, 0, 8);
    const moduleSize = size / (moduleCount + margin * 2);
    const offset = margin * moduleSize;

    context.clearRect(0, 0, size, size);
    if (!qrBackgroundTransparent) {
      context.fillStyle = qrLightColor;
      context.fillRect(0, 0, size, size);
    }

    context.fillStyle = qrDarkColor;
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (!qr.modules.data[row * moduleCount + col]) continue;
        if (isFinderPattern(row, col, moduleCount)) continue;

        drawModule(
          context,
          offset + col * moduleSize,
          offset + row * moduleSize,
          moduleSize,
          qrModuleShape,
          qrDarkColor,
        );
      }
    }

    drawFinderPattern(context, offset, offset, moduleSize);
    drawFinderPattern(context, offset + (moduleCount - 7) * moduleSize, offset, moduleSize);
    drawFinderPattern(context, offset, offset + (moduleCount - 7) * moduleSize, moduleSize);
  }

  async function drawQRLogo(canvas) {
    const context = canvas.getContext('2d');
    const image = await loadImage(qrLogoDataURL);
    const canvasSize = canvas.width;
    const logoBox = canvasSize * (clampNumber(qrLogoSize, 8, 34) / 100);
    const padding = logoBox * (clampNumber(qrLogoPadding, 0, 22) / 100);
    const backgroundBox = logoBox + padding * 2;
    const center = canvasSize / 2;
    const backgroundX = center - backgroundBox / 2;
    const backgroundY = center - backgroundBox / 2;
    const logoX = center - logoBox / 2;
    const logoY = center - logoBox / 2;
    const radius = backgroundBox * (clampNumber(qrLogoRadius, 0, 50) / 100);

    if (qrLogoBackground) {
      context.save();
      context.shadowColor = 'rgba(0, 0, 0, 0.14)';
      context.shadowBlur = canvasSize * 0.015;
      context.shadowOffsetY = canvasSize * 0.006;
      drawRoundedRect(context, backgroundX, backgroundY, backgroundBox, backgroundBox, radius);
      context.fillStyle = qrBackgroundTransparent ? '#ffffff' : qrLightColor;
      context.fill();
      context.restore();
    }

    const imageRatio = image.width / image.height;
    let drawWidth = logoBox;
    let drawHeight = logoBox;
    if (imageRatio > 1) {
      drawHeight = logoBox / imageRatio;
    } else {
      drawWidth = logoBox * imageRatio;
    }

    context.save();
    drawRoundedRect(context, logoX, logoY, logoBox, logoBox, logoBox * (clampNumber(qrLogoRadius, 0, 50) / 100));
    context.clip();
    context.drawImage(
      image,
      center - drawWidth / 2,
      center - drawHeight / 2,
      drawWidth,
      drawHeight,
    );
    context.restore();
  }

  function drawModule(context, x, y, size, shape, color) {
    context.fillStyle = color;
    const inset = size * 0.06;
    const drawSize = size - inset * 2;

    if (shape === 'dots') {
      context.beginPath();
      context.arc(x + size / 2, y + size / 2, size * 0.42, 0, Math.PI * 2);
      context.fill();
      return;
    }

    if (shape === 'diamond') {
      context.beginPath();
      context.moveTo(x + size / 2, y + inset);
      context.lineTo(x + size - inset, y + size / 2);
      context.lineTo(x + size / 2, y + size - inset);
      context.lineTo(x + inset, y + size / 2);
      context.closePath();
      context.fill();
      return;
    }

    if (shape === 'rounded') {
      drawRoundedRect(context, x + inset, y + inset, drawSize, drawSize, size * 0.28);
      context.fill();
      return;
    }

    context.fillRect(x, y, size + 0.2, size + 0.2);
  }

  function drawFinderPattern(context, x, y, moduleSize) {
    const lightIsTransparent = qrBackgroundTransparent;
    drawFinderLayer(context, x, y, moduleSize * 7, qrDarkColor);
    drawFinderLayer(context, x + moduleSize, y + moduleSize, moduleSize * 5, qrLightColor, lightIsTransparent);
    drawFinderLayer(context, x + moduleSize * 2, y + moduleSize * 2, moduleSize * 3, qrDarkColor);
  }

  function drawFinderLayer(context, x, y, size, color, erase = false) {
    context.save();
    if (erase) context.globalCompositeOperation = 'destination-out';
    context.fillStyle = color;

    if (qrEyeShape === 'circle') {
      context.beginPath();
      context.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
      context.fill();
    } else {
      const radius = qrEyeShape === 'rounded' ? size * 0.2 : 0;
      drawRoundedRect(context, x, y, size, size, radius);
      context.fill();
    }

    context.restore();
  }

  function isFinderPattern(row, col, moduleCount) {
    const inTop = row < 7;
    const inBottom = row >= moduleCount - 7;
    const inLeft = col < 7;
    const inRight = col >= moduleCount - 7;
    return (inTop && inLeft) || (inTop && inRight) || (inBottom && inLeft);
  }

  function drawRoundedRect(context, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.lineTo(x + width - r, y);
    context.quadraticCurveTo(x + width, y, x + width, y + r);
    context.lineTo(x + width, y + height - r);
    context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    context.lineTo(x + r, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - r);
    context.lineTo(x, y + r);
    context.quadraticCurveTo(x, y, x + r, y);
    context.closePath();
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
  }

  function clampNumber(value, min, max) {
    const number = Number(value);
    if (!Number.isFinite(number)) return min;
    return Math.min(max, Math.max(min, number));
  }

  function imageToBase64() {
    var f = document.getElementById('img-file').files[0];
    if (!f) return;
    var r = new FileReader();
    r.onload = function (e) {
      imgBase64 = e.target.result;
      document.getElementById('img-output').innerHTML = '<img src="' + imgBase64 + '" style="max-width:200px;margin-bottom:10px;border-radius:8px"><br><code style="font-size:0.75rem;word-break:break-all">' + imgBase64.slice(0, 80) + '...</code>';
    };
    r.readAsDataURL(f);
  }

  function copyImgBase64() {
    if (imgBase64) navigator.clipboard.writeText(imgBase64);
  }
</script>

{#if activeTool.id === 'qr'}
<div class="tool-panel" id="panel-qr">
      <div class="panel-header">
        <h2><i data-lucide="qr-code"></i> Código QR</h2>
        <p>Crea códigos QR personalizados con logo, colores y formas</p>
      </div>

      <div class="qr-builder">
        <div class="qr-options">
          <label for="qr-text">Texto, URL o datos</label>
          <textarea
            id="qr-text"
            class="qr-textarea"
            placeholder="https://ejemplo.com"
            bind:value={qrText}
            oninput={regenerateQRIfReady}
          ></textarea>

          <div class="qr-option-grid">
            <div>
              <label for="qr-size">Tamaño: {qrSize}px</label>
              <input
                id="qr-size"
                type="range"
                min="180"
                max="900"
                step="20"
                bind:value={qrSize}
                oninput={regenerateQRIfReady}
              >
            </div>

            <div>
              <label for="qr-margin">Margen: {qrMargin}</label>
              <input
                id="qr-margin"
                type="range"
                min="0"
                max="8"
                step="1"
                bind:value={qrMargin}
                oninput={regenerateQRIfReady}
              >
            </div>

            <div>
              <label for="qr-module-shape">Forma de módulos</label>
              <select id="qr-module-shape" bind:value={qrModuleShape} onchange={regenerateQRIfReady}>
                {#each qrModuleShapes as shape}
                  <option value={shape.value}>{shape.label}</option>
                {/each}
              </select>
            </div>

            <div>
              <label for="qr-eye-shape">Forma de esquinas</label>
              <select id="qr-eye-shape" bind:value={qrEyeShape} onchange={regenerateQRIfReady}>
                {#each qrEyeShapes as shape}
                  <option value={shape.value}>{shape.label}</option>
                {/each}
              </select>
            </div>

            <div>
              <label for="qr-error-correction">Corrección de errores</label>
              <select id="qr-error-correction" bind:value={qrErrorCorrection} onchange={regenerateQRIfReady}>
                {#each qrErrorLevels as level}
                  <option value={level.value}>{level.label}</option>
                {/each}
              </select>
            </div>

            <label class="qr-inline-toggle" for="qr-transparent">
              <input
                id="qr-transparent"
                type="checkbox"
                bind:checked={qrBackgroundTransparent}
                onchange={regenerateQRIfReady}
              >
              Fondo transparente
            </label>
          </div>

          <div class="qr-color-row">
            <div>
              <label for="qr-dark-color">Color del QR</label>
              <input
                id="qr-dark-color"
                class="qr-color-input"
                type="color"
                bind:value={qrDarkColor}
                onchange={regenerateQRIfReady}
              >
            </div>

            <div>
              <label for="qr-light-color">Color de fondo</label>
              <input
                id="qr-light-color"
                class="qr-color-input"
                type="color"
                bind:value={qrLightColor}
                disabled={qrBackgroundTransparent}
                onchange={regenerateQRIfReady}
              >
            </div>
          </div>

          <div class="qr-logo-section">
            <div class="qr-logo-head">
              <div>
                <h3>Logo central</h3>
                <p>Usa PNG, JPG, WebP o SVG. Con logo conviene corrección máxima.</p>
              </div>
              {#if qrLogoDataURL}
                <button class="btn btn-quiet" type="button" onclick={clearQRLogo}>
                  <i data-lucide="trash-2"></i> Quitar
                </button>
              {/if}
            </div>

            <input
              bind:this={qrLogoInput}
              class="qr-logo-input"
              type="file"
              accept="image/*"
              onchange={handleQRLogoSelect}
            >

            <button
              class:has-file={qrLogoDataURL}
              class="qr-logo-picker"
              type="button"
              onclick={openQRLogoPicker}
              ondragover={(event) => { event.preventDefault(); event.currentTarget.classList.add('drag-over'); }}
              ondragleave={(event) => event.currentTarget.classList.remove('drag-over')}
              ondrop={handleQRLogoDrop}
            >
              {#if qrLogoDataURL}
                <img src={qrLogoDataURL} alt="Logo seleccionado">
                <span>{qrLogoName}</span>
              {:else}
                <i data-lucide="image-plus"></i>
                <span>Agregar imagen o arrastrarla aquí</span>
              {/if}
            </button>

            {#if qrLogoDataURL}
              <div class="qr-option-grid qr-logo-controls">
                <div>
                  <label for="qr-logo-size">Tamaño logo: {qrLogoSize}%</label>
                  <input
                    id="qr-logo-size"
                    type="range"
                    min="8"
                    max="34"
                    step="1"
                    bind:value={qrLogoSize}
                    oninput={regenerateQRIfReady}
                  >
                </div>

                <div>
                  <label for="qr-logo-padding">Fondo logo: {qrLogoPadding}%</label>
                  <input
                    id="qr-logo-padding"
                    type="range"
                    min="0"
                    max="22"
                    step="1"
                    bind:value={qrLogoPadding}
                    disabled={!qrLogoBackground}
                    oninput={regenerateQRIfReady}
                  >
                </div>

                <div>
                  <label for="qr-logo-radius">Redondeo logo: {qrLogoRadius}%</label>
                  <input
                    id="qr-logo-radius"
                    type="range"
                    min="0"
                    max="50"
                    step="1"
                    bind:value={qrLogoRadius}
                    oninput={regenerateQRIfReady}
                  >
                </div>

                <label class="qr-inline-toggle" for="qr-logo-bg">
                  <input
                    id="qr-logo-bg"
                    type="checkbox"
                    bind:checked={qrLogoBackground}
                    onchange={regenerateQRIfReady}
                  >
                  Fondo detrás del logo
                </label>
              </div>
            {/if}
          </div>

          <div class="btn-row">
            <button class="btn" type="button" onclick={generateQR}><i data-lucide="qr-code"></i> Generar QR</button>
            <button class="btn btn-quiet" type="button" onclick={resetQRStyle}><i data-lucide="rotate-ccw"></i> Reiniciar estilo</button>
          </div>
        </div>

        <div class="qr-preview-panel">
          <div class="qr-preview-head">
            <h3>Vista previa</h3>
            <button class="btn btn-green" type="button" onclick={downloadQR} disabled={!qrDataURL}>
              <i data-lucide="download"></i> Descargar PNG
            </button>
          </div>

          <div class:transparent={qrBackgroundTransparent} class="qr-preview-stage">
            {#if qrDataURL}
              <img src={qrDataURL} alt="Código QR generado">
            {:else}
              <div class="qr-empty">
                <i data-lucide="scan-line"></i>
                <span>Genera un QR para ver el resultado aquí.</span>
              </div>
            {/if}
          </div>

          {#if qrError}
            <div class="tool-status error">{qrError}</div>
          {:else if qrStatus}
            <div class="tool-status success">{qrStatus}</div>
          {/if}
        </div>
      </div>
    </div>
{/if}

{#if activeTool.id === 'image'}
<div class="tool-panel" id="panel-image">
      <div class="panel-header">
        <h2><i data-lucide="image"></i> Imagen a Base64</h2>
        <p>Convierte imágenes a código Base64 para embeber en HTML o CSS</p>
      </div>
      <input type="file" id="img-file" accept="image/*" onchange={imageToBase64}>
      <div class="output" id="img-output"></div>
      <div class="btn-row"><button class="btn btn-green" onclick={copyImgBase64}><i data-lucide="copy"></i> Copiar Base64</button></div>
    </div>
{/if}
