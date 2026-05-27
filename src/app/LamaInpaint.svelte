<script>
  import { onDestroy, tick } from 'svelte';
  import {
    configureOnnxWasm,
    isAppleMobile,
    mobileAiErrorMessage,
    supportsWebGpu,
  } from '../tools/browserAiRuntime.js';

  const modelUrl = 'https://huggingface.co/IsGarrido/LaMa-ONNX/resolve/main/lama_fp32.onnx';
  const modelSizeMb = 208;
  const inputSize = 512;
  const modelCacheName = 'miyu-lama-models-v1';

  let sourceImage = null;
  let resultImage = null;
  let status = 'idle';
  let message = '';
  let progress = 0;
  let brushSize = 34;
  let isDrawing = false;
  let maskHasPaint = false;
  let session = null;
  let ortRuntime = null;
  let backend = '';
  let fileInput;
  let imageCanvas;
  let maskCanvas;
  let resultCanvas;
  let sourceBitmap = null;
  let imageAspect = '1 / 1';
  let lastPoint = null;

  $: isProcessing = status === 'downloading' || status === 'loading' || status === 'processing';
  $: actionLabel = status === 'done' ? 'Generar de nuevo' : 'Reparar imagen';

  onDestroy(() => {
    sourceBitmap?.close?.();
    session?.release?.();
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
    reader.onload = async () => {
      sourceImage = reader.result;
      resultImage = null;
      status = 'idle';
      message = '';
      progress = 0;
      maskHasPaint = false;
      await tick();
      await drawSourceImage();
      refreshIcons();
    };
    reader.readAsDataURL(file);
  }

  async function drawSourceImage() {
    if (!sourceImage || !imageCanvas || !maskCanvas) return;

    sourceBitmap?.close?.();
    sourceBitmap = await loadImage(sourceImage);
    imageAspect = `${sourceBitmap.width} / ${sourceBitmap.height}`;

    for (const canvas of [imageCanvas, maskCanvas]) {
      canvas.width = sourceBitmap.width;
      canvas.height = sourceBitmap.height;
    }

    const imageContext = imageCanvas.getContext('2d');
    imageContext.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
    imageContext.drawImage(sourceBitmap, 0, 0);

    clearMask();
  }

  async function getSession() {
    if (session) return session;

    status = 'downloading';
    message = `Buscando LaMa ONNX en caché...`;
    progress = 0;

    const modelBytes = await fetchModelBytes();
    const canUseWebGpu = await supportsWebGpu();
    ortRuntime = canUseWebGpu
      ? await import('onnxruntime-web/webgpu')
      : await import('onnxruntime-web');
    configureOnnxWasm(ortRuntime.env);

    status = 'loading';
    message = 'Inicializando modelo...';
    const sessionOptions = {
      executionProviders: ['wasm'],
      graphOptimizationLevel: isAppleMobile() ? 'disabled' : 'all',
    };

    if (canUseWebGpu) {
      try {
        session = await ortRuntime.InferenceSession.create(modelBytes, {
          executionProviders: ['webgpu'],
          graphOptimizationLevel: 'all',
        });
        backend = 'WebGPU';
        return session;
      } catch (error) {
        console.info('WebGPU no disponible para LaMa, usando WASM.', error);
      }
    }

    session = await ortRuntime.InferenceSession.create(modelBytes, sessionOptions);
    backend = 'WASM';

    return session;
  }

  async function fetchModelBytes() {
    const skipCache = isAppleMobile();
    const cachedResponse = skipCache ? null : await getCachedModelResponse();
    if (cachedResponse) {
      progress = 100;
      message = 'Cargando LaMa ONNX desde caché...';
      return new Uint8Array(await cachedResponse.arrayBuffer());
    }

    message = `Descargando LaMa ONNX (~${modelSizeMb} MB)...`;
    const response = await fetch(modelUrl, { cache: 'force-cache' });
    if (!response.ok) throw new Error('No se pudo descargar el modelo LaMa.');

    const total = Number(response.headers.get('content-length')) || 0;
    if (skipCache || !response.body) {
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (!skipCache) await cacheModelBytes(bytes);
      progress = 100;
      return bytes;
    }

    const reader = response.body.getReader();
    const chunks = [];
    let received = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
      if (total > 0) progress = Math.round((received / total) * 100);
    }

    const bytes = new Uint8Array(received);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    progress = 100;
    await cacheModelBytes(bytes);
    return bytes;
  }

  async function getCachedModelResponse() {
    if (!('caches' in window)) return null;

    try {
      const cache = await caches.open(modelCacheName);
      return await cache.match(modelUrl);
    } catch (error) {
      console.info('No se pudo leer el caché de LaMa.', error);
      return null;
    }
  }

  async function cacheModelBytes(bytes) {
    if (!('caches' in window)) return;

    try {
      const cache = await caches.open(modelCacheName);
      await cache.put(modelUrl, new Response(bytes, {
        headers: {
          'content-type': 'application/octet-stream',
        },
      }));
    } catch (error) {
      console.info('No se pudo guardar LaMa en caché.', error);
    }
  }

  async function runInpaint() {
    if (!sourceImage || !maskHasPaint || isProcessing) return;

    try {
      const model = await getSession();

      status = 'processing';
      message = `Reparando imagen con LaMa (${backend})...`;

      const feeds = prepareFeeds(model);
      const outputs = await model.run(feeds);
      const output = outputs[model.outputNames[0]];
      resultImage = renderOutput(output);

      status = 'done';
      message = '';
      refreshIcons();
    } catch (error) {
      console.error('No se pudo reparar la imagen con LaMa:', error);
      status = 'error';
      message = mobileAiErrorMessage(error);
    }
  }

  function prepareFeeds(model) {
    const imageData = resizedImageData(imageCanvas, inputSize, inputSize);
    const maskData = expandedMaskImageData(inputSize, inputSize, 10);
    const imageTensorData = new Float32Array(1 * 3 * inputSize * inputSize);
    const maskTensorData = new Float32Array(1 * 1 * inputSize * inputSize);
    const planeSize = inputSize * inputSize;

    for (let pixel = 0; pixel < planeSize; pixel += 1) {
      const rgbaOffset = pixel * 4;
      imageTensorData[pixel] = imageData.data[rgbaOffset] / 255;
      imageTensorData[planeSize + pixel] = imageData.data[rgbaOffset + 1] / 255;
      imageTensorData[(planeSize * 2) + pixel] = imageData.data[rgbaOffset + 2] / 255;
      maskTensorData[pixel] = maskData.data[rgbaOffset + 3] > 0 ? 1 : 0;
    }

    return {
      [model.inputNames.includes('image') ? 'image' : model.inputNames[0]]: new ortRuntime.Tensor(
        'float32',
        imageTensorData,
        [1, 3, inputSize, inputSize],
      ),
      [model.inputNames.includes('mask') ? 'mask' : model.inputNames[1]]: new ortRuntime.Tensor(
        'float32',
        maskTensorData,
        [1, 1, inputSize, inputSize],
      ),
    };
  }

  function resizedImageData(canvas, width, height) {
    const resized = document.createElement('canvas');
    resized.width = width;
    resized.height = height;
    const context = resized.getContext('2d');
    context.imageSmoothingEnabled = true;
    context.drawImage(canvas, 0, 0, width, height);
    return context.getImageData(0, 0, width, height);
  }

  function expandedMaskImageData(width, height, radius) {
    const resized = document.createElement('canvas');
    resized.width = width;
    resized.height = height;
    const context = resized.getContext('2d');
    context.imageSmoothingEnabled = false;
    context.drawImage(maskCanvas, 0, 0, width, height);

    const source = context.getImageData(0, 0, width, height);
    const sourceMask = new Uint8Array(width * height);

    for (let pixel = 0; pixel < sourceMask.length; pixel += 1) {
      sourceMask[pixel] = source.data[(pixel * 4) + 3] > 8 ? 1 : 0;
    }

    const expanded = dilateMask(sourceMask, width, height, radius);
    const imageData = context.createImageData(width, height);

    for (let pixel = 0; pixel < expanded.length; pixel += 1) {
      if (!expanded[pixel]) continue;
      const offset = pixel * 4;
      imageData.data[offset] = 255;
      imageData.data[offset + 1] = 255;
      imageData.data[offset + 2] = 255;
      imageData.data[offset + 3] = 255;
    }

    return imageData;
  }

  function renderOutput(output) {
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = inputSize;
    outputCanvas.height = inputSize;
    const context = outputCanvas.getContext('2d');
    const imageData = context.createImageData(inputSize, inputSize);
    const data = output.data;
    const planeSize = inputSize * inputSize;

    for (let pixel = 0; pixel < planeSize; pixel += 1) {
      const rgbaOffset = pixel * 4;
      imageData.data[rgbaOffset] = clampChannel(data[pixel]);
      imageData.data[rgbaOffset + 1] = clampChannel(data[planeSize + pixel]);
      imageData.data[rgbaOffset + 2] = clampChannel(data[(planeSize * 2) + pixel]);
      imageData.data[rgbaOffset + 3] = 255;
    }

    context.putImageData(imageData, 0, 0);

    const resizedOutput = document.createElement('canvas');
    resizedOutput.width = imageCanvas.width;
    resizedOutput.height = imageCanvas.height;
    const resizedContext = resizedOutput.getContext('2d');
    resizedContext.imageSmoothingEnabled = true;
    resizedContext.drawImage(outputCanvas, 0, 0, resizedOutput.width, resizedOutput.height);

    resultCanvas.width = imageCanvas.width;
    resultCanvas.height = imageCanvas.height;
    const resultContext = resultCanvas.getContext('2d');
    resultContext.clearRect(0, 0, resultCanvas.width, resultCanvas.height);
    resultContext.drawImage(imageCanvas, 0, 0);

    const originalData = resultContext.getImageData(0, 0, resultCanvas.width, resultCanvas.height);
    const outputData = resizedContext.getImageData(0, 0, resizedOutput.width, resizedOutput.height);
    const maskData = expandedMaskImageData(
      maskCanvas.width,
      maskCanvas.height,
      Math.min(12, Math.max(4, Math.round(brushSize * 0.18))),
    );

    for (let index = 0; index < originalData.data.length; index += 4) {
      const maskAlpha = maskData.data[index + 3];
      if (maskAlpha <= 8) continue;

      originalData.data[index] = outputData.data[index];
      originalData.data[index + 1] = outputData.data[index + 1];
      originalData.data[index + 2] = outputData.data[index + 2];
    }

    resultContext.putImageData(originalData, 0, 0);

    return resultCanvas.toDataURL('image/png');
  }

  function clampChannel(value) {
    const scaled = value <= 1 ? value * 255 : value;
    return Math.max(0, Math.min(255, Math.round(scaled)));
  }

  function startDrawing(event) {
    if (isProcessing || !sourceImage) return;
    isDrawing = true;
    maskCanvas.setPointerCapture?.(event.pointerId);
    lastPoint = pointerPoint(event, maskCanvas);
    drawBrushDot(lastPoint);
    maskHasPaint = true;
  }

  function paintAt(event) {
    if (!isDrawing || !maskCanvas) return;
    const point = pointerPoint(event, maskCanvas);
    drawBrushStroke(lastPoint || point, point);
    lastPoint = point;
    maskHasPaint = true;
  }

  function stopDrawing(event) {
    isDrawing = false;
    lastPoint = null;
    maskCanvas?.releasePointerCapture?.(event.pointerId);
  }

  function drawBrushDot(point) {
    const context = maskCanvas.getContext('2d');
    context.fillStyle = 'rgba(90, 166, 176, 0.68)';
    context.beginPath();
    context.arc(point.x, point.y, brushSize / 2, 0, Math.PI * 2);
    context.fill();
  }

  function drawBrushStroke(fromPoint, toPoint) {
    const context = maskCanvas.getContext('2d');
    context.strokeStyle = 'rgba(90, 166, 176, 0.68)';
    context.lineWidth = brushSize;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.beginPath();
    context.moveTo(fromPoint.x, fromPoint.y);
    context.lineTo(toPoint.x, toPoint.y);
    context.stroke();
  }

  function pointerPoint(event, canvas) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function clearMask() {
    const context = maskCanvas?.getContext('2d');
    context?.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    maskHasPaint = false;
  }

  function autoDetectMask() {
    if (!imageCanvas || !maskCanvas || isProcessing) return;

    const scale = Math.min(1, 1000 / Math.max(imageCanvas.width, imageCanvas.height));
    const width = Math.max(1, Math.round(imageCanvas.width * scale));
    const height = Math.max(1, Math.round(imageCanvas.height * scale));
    const detectionCanvas = document.createElement('canvas');
    detectionCanvas.width = width;
    detectionCanvas.height = height;
    const sourceContext = detectionCanvas.getContext('2d');
    sourceContext.imageSmoothingEnabled = true;
    sourceContext.drawImage(imageCanvas, 0, 0, width, height);
    const pixels = sourceContext.getImageData(0, 0, width, height).data;
    const candidates = new Uint8Array(width * height);
    const luminanceMap = new Float32Array(width * height);

    for (let index = 0; index < luminanceMap.length; index += 1) {
      luminanceMap[index] = getLuminance(pixels, index);
    }

    for (let y = 2; y < height - 2; y += 1) {
      for (let x = 2; x < width - 2; x += 1) {
        const index = y * width + x;
        const offset = index * 4;
        const red = pixels[offset];
        const green = pixels[offset + 1];
        const blue = pixels[offset + 2];
        const max = Math.max(red, green, blue);
        const min = Math.min(red, green, blue);
        const saturation = max === 0 ? 0 : (max - min) / max;
        const luminance = luminanceMap[index];
        const averageAround = (
          luminanceMap[index - 2]
          + luminanceMap[index + 2]
          + luminanceMap[index - (width * 2)]
          + luminanceMap[index + (width * 2)]
          + luminanceMap[index - width - 1]
          + luminanceMap[index - width + 1]
          + luminanceMap[index + width - 1]
          + luminanceMap[index + width + 1]
        ) / 8;
        const contrast = Math.max(
          Math.abs(luminance - luminanceMap[index - 2]),
          Math.abs(luminance - luminanceMap[index + 2]),
          Math.abs(luminance - luminanceMap[index - (width * 2)]),
          Math.abs(luminance - luminanceMap[index + (width * 2)]),
        );
        const localSeparation = Math.abs(luminance - averageAround);

        const lightOverlay = luminance > 178 && saturation < 0.24 && contrast > 16 && localSeparation > 8;
        const darkOverlay = luminance < 76 && saturation < 0.28 && contrast > 18 && localSeparation > 10;
        if (lightOverlay || darkOverlay) candidates[index] = 1;
      }
    }

    const filtered = filterAutoMaskComponents(candidates, width, height);
    const expanded = dilateMask(filtered, width, height, 4);
    const maskPreview = document.createElement('canvas');
    maskPreview.width = width;
    maskPreview.height = height;
    const previewContext = maskPreview.getContext('2d');
    const imageData = previewContext.createImageData(width, height);
    let markedPixels = 0;

    for (let index = 0; index < expanded.length; index += 1) {
      if (!expanded[index]) continue;
      const offset = index * 4;
      imageData.data[offset] = 90;
      imageData.data[offset + 1] = 166;
      imageData.data[offset + 2] = 176;
      imageData.data[offset + 3] = 150;
      markedPixels += 1;
    }

    previewContext.putImageData(imageData, 0, 0);

    const context = maskCanvas.getContext('2d');
    context.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    context.imageSmoothingEnabled = true;
    context.drawImage(maskPreview, 0, 0, maskCanvas.width, maskCanvas.height);
    maskHasPaint = markedPixels > 0;
  }

  function filterAutoMaskComponents(mask, width, height) {
    const output = new Uint8Array(mask.length);
    const visited = new Uint8Array(mask.length);
    const totalPixels = width * height;
    const minArea = Math.max(6, Math.round(totalPixels * 0.000008));
    const maxArea = Math.max(120, Math.round(totalPixels * 0.035));
    const stack = [];
    const component = [];

    for (let start = 0; start < mask.length; start += 1) {
      if (!mask[start] || visited[start]) continue;

      stack.length = 0;
      component.length = 0;
      stack.push(start);
      visited[start] = 1;

      let minX = width;
      let minY = height;
      let maxX = 0;
      let maxY = 0;

      while (stack.length > 0) {
        const index = stack.pop();
        component.push(index);

        const x = index % width;
        const y = Math.floor(index / width);
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);

        const neighbors = [index - 1, index + 1, index - width, index + width];
        for (const neighbor of neighbors) {
          if (neighbor < 0 || neighbor >= mask.length || visited[neighbor] || !mask[neighbor]) continue;
          const neighborX = neighbor % width;
          if (Math.abs(neighborX - x) > 1) continue;
          visited[neighbor] = 1;
          stack.push(neighbor);
        }
      }

      const area = component.length;
      const boxWidth = maxX - minX + 1;
      const boxHeight = maxY - minY + 1;
      const boxArea = boxWidth * boxHeight;
      const fillRatio = area / boxArea;
      const narrowTextLike = boxHeight <= height * 0.18 || boxWidth <= width * 0.18;
      const compactOverlay = boxArea <= totalPixels * 0.16 && fillRatio <= 0.78;
      const keep = area >= minArea && area <= maxArea && (narrowTextLike || compactOverlay);

      if (!keep) continue;
      for (const index of component) output[index] = 1;
    }

    return output;
  }

  function getLuminance(data, index) {
    const offset = index * 4;
    return (0.299 * data[offset]) + (0.587 * data[offset + 1]) + (0.114 * data[offset + 2]);
  }

  function dilateMask(mask, width, height, radius) {
    const output = new Uint8Array(mask.length);

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = y * width + x;
        if (!mask[index]) continue;

        for (let dy = -radius; dy <= radius; dy += 1) {
          for (let dx = -radius; dx <= radius; dx += 1) {
            if ((dx * dx) + (dy * dy) > radius * radius) continue;
            const nextX = x + dx;
            const nextY = y + dy;
            if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height) continue;
            output[nextY * width + nextX] = 1;
          }
        }
      }
    }

    return output;
  }

  function clearImage() {
    sourceBitmap?.close?.();
    sourceBitmap = null;
    sourceImage = null;
    resultImage = null;
    status = 'idle';
    message = '';
    progress = 0;
    maskHasPaint = false;
    if (fileInput) fileInput.value = '';
    refreshIcons();
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
    link.download = 'reparado-lama.png';
    link.href = resultImage;
    link.click();
  }
</script>

<div class="tool-panel" id="panel-lama-inpaint">
  <div class="panel-header">
    <h2><i data-lucide="paintbrush"></i> Reparar Imagen con LaMa</h2>
    <p>Pinta una zona o detecta marcas automáticamente; LaMa reconstruye el área en tu navegador</p>
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
    <div class:has-result={resultImage} class="lama-workspace">
      <div class="bgremove-preview">
        <div class="bgremove-preview-head">
          <h3>Original</h3>
          <button class="btn btn-quiet" type="button" onclick={clearImage} disabled={isProcessing}>
            <i data-lucide="trash-2"></i> Limpiar
          </button>
        </div>

        <div class="lama-controls-row">
          <label>
            Brocha
            <input type="range" min="8" max="110" step="2" bind:value={brushSize} disabled={isProcessing}>
            <span>{brushSize}px</span>
          </label>
          <button class="btn" type="button" onclick={clearMask} disabled={isProcessing || !maskHasPaint}>
            <i data-lucide="undo-2"></i> Máscara
          </button>
          <button class="btn lama-auto-btn" type="button" onclick={autoDetectMask} disabled={isProcessing}>
            <i data-lucide="scan-search"></i> Auto
          </button>
        </div>

        <div class="bgremove-image-frame lama-canvas-frame">
          <div class="lama-canvas-stack" style={`--lama-aspect: ${imageAspect};`}>
            <canvas bind:this={imageCanvas}></canvas>
            <canvas
              bind:this={maskCanvas}
              class="lama-mask-canvas"
              onpointerdown={startDrawing}
              onpointermove={paintAt}
              onpointerup={stopDrawing}
              onpointercancel={stopDrawing}
              onpointerleave={stopDrawing}
            ></canvas>
          </div>
        </div>
      </div>

    </div>

    <div class="lama-run-row">
      <button class="btn bgremove-action" type="button" onclick={runInpaint} disabled={isProcessing || !maskHasPaint}>
        {#if isProcessing}
          <span class="bgremove-spinner"></span>
          {message}
          {#if status === 'downloading' && progress > 0}
            <span>{progress}%</span>
          {/if}
        {:else}
          <i data-lucide="wand-sparkles"></i>
          <span class="lama-action-label">{actionLabel}</span>
        {/if}
      </button>
    </div>

    {#if resultImage}
      <div class="bgremove-preview lama-result-panel">
        <div class="bgremove-preview-head">
          <h3>Resultado</h3>
          <button class="btn btn-green" type="button" onclick={downloadResult}>
            <i data-lucide="download"></i> PNG
          </button>
        </div>
        <div class="bgremove-image-frame lama-result-frame" style={`--lama-aspect: ${imageAspect};`}>
          <img src={resultImage} alt="Imagen reparada con LaMa">
        </div>
      </div>
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

  <div class="output bgremove-note lama-note">
    <i data-lucide="shield-check"></i>
    <span>Procesa en tu navegador. Usa imágenes propias o con permiso; la primera descarga puede tardar.</span>
  </div>

  <canvas bind:this={resultCanvas} class="bgremove-canvas"></canvas>
</div>
