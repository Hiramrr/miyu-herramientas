<script>
  import { onDestroy } from 'svelte';

  const iconSizes = [
    { size: 16, name: 'favicon-16x16.png', label: 'Favicon 16' },
    { size: 32, name: 'favicon-32x32.png', label: 'Favicon 32' },
    { size: 48, name: 'favicon-48x48.png', label: 'Favicon 48' },
    { size: 180, name: 'apple-touch-icon.png', label: 'Apple Touch' },
    { size: 192, name: 'android-chrome-192x192.png', label: 'Android 192' },
    { size: 512, name: 'android-chrome-512x512.png', label: 'Android 512' },
  ];

  let fileInput;
  let file = null;
  let sourceUrl = '';
  let image = null;
  let padding = 10;
  let background = '#ffffff';
  let transparent = true;
  let icons = [];
  let status = 'Selecciona una imagen cuadrada o con buen margen para generar iconos.';

  $: htmlSnippet = `<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">`;
  $: manifestSnippet = JSON.stringify({
    icons: [
      { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  }, null, 2);

  onDestroy(() => {
    revoke(sourceUrl);
    icons.forEach((icon) => revoke(icon.url));
  });

  function revoke(url) {
    if (url) URL.revokeObjectURL(url);
  }

  function loadImage(url) {
    return new Promise((resolve, reject) => {
      const nextImage = new Image();
      nextImage.onload = () => resolve(nextImage);
      nextImage.onerror = () => reject(new Error('No se pudo leer la imagen.'));
      nextImage.src = url;
    });
  }

  async function selectImage(event) {
    const nextFile = event.currentTarget.files?.[0];
    if (!nextFile) return;
    revoke(sourceUrl);
    icons.forEach((icon) => revoke(icon.url));
    icons = [];
    file = nextFile;
    sourceUrl = URL.createObjectURL(nextFile);
    status = 'Imagen cargada. Genera los tamaños cuando quieras.';
    try {
      image = await loadImage(sourceUrl);
    } catch (error) {
      image = null;
      status = error.message || 'No se pudo cargar la imagen.';
    }
  }

  function renderIcon(size) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!transparent) {
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, size, size);
    }
    const inner = size * Math.max(0.2, Math.min(1, (100 - Number(padding)) / 100));
    const sourceSize = Math.min(image.naturalWidth, image.naturalHeight);
    const sx = (image.naturalWidth - sourceSize) / 2;
    const sy = (image.naturalHeight - sourceSize) / 2;
    const dx = (size - inner) / 2;
    const dy = (size - inner) / 2;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(image, sx, sy, sourceSize, sourceSize, dx, dy, inner, inner);
    return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  }

  async function generateIcons() {
    if (!image) {
      status = 'Selecciona una imagen primero.';
      return;
    }
    icons.forEach((icon) => revoke(icon.url));
    status = 'Generando iconos...';
    const nextIcons = [];
    for (const item of iconSizes) {
      const blob = await renderIcon(item.size);
      if (blob) nextIcons.push({ ...item, blob, url: URL.createObjectURL(blob) });
    }
    icons = nextIcons;
    status = `Listo: ${icons.length} iconos PNG generados localmente.`;
  }

  function downloadIcon(icon) {
    const link = document.createElement('a');
    link.href = icon.url;
    link.download = icon.name;
    link.click();
  }

  async function copySnippet(text, label) {
    await navigator.clipboard.writeText(text);
    status = `${label} copiado.`;
  }
</script>

<div class="tool-panel" id="panel-favicon">
  <div class="panel-header">
    <h2><i data-lucide="badge"></i> Favicon / App Icons</h2>
    <p>Crea iconos PNG para navegador, iOS y Android desde una imagen</p>
  </div>

  <input class="image-convert-file" bind:this={fileInput} type="file" accept="image/*" onchange={selectImage}>
  <button class="image-convert-dropzone" type="button" onclick={() => fileInput?.click()}>
    <i data-lucide="badge-plus"></i>
    <strong>{file ? file.name : 'Seleccionar imagen base'}</strong>
    <span>Se recorta al centro en formato cuadrado y se procesa localmente</span>
  </button>

  <div class="favicon-grid">
    <div class="favicon-preview">
      {#if sourceUrl}
        <img src={sourceUrl} alt="Imagen base para iconos">
      {:else}
        <i data-lucide="image"></i>
      {/if}
    </div>

    <div class="image-convert-options favicon-options">
      <label for="favicon-padding">Margen: {padding}%</label>
      <input id="favicon-padding" type="range" min="0" max="40" step="1" bind:value={padding}>

      <label class="inline-toggle" for="favicon-transparent">
        <input id="favicon-transparent" type="checkbox" bind:checked={transparent}>
        Fondo transparente
      </label>

      {#if !transparent}
        <label for="favicon-background">Color de fondo</label>
        <input id="favicon-background" class="image-convert-color" type="color" bind:value={background}>
      {/if}

      <div class="btn-row">
        <button class="btn" type="button" onclick={generateIcons}><i data-lucide="sparkles"></i> Generar iconos</button>
      </div>
    </div>
  </div>

  {#if icons.length}
    <div class="favicon-icons">
      {#each icons as icon}
        <button class="favicon-icon-card" type="button" onclick={() => downloadIcon(icon)}>
          <img src={icon.url} alt={icon.label}>
          <strong>{icon.label}</strong>
          <span>{icon.size}x{icon.size}</span>
        </button>
      {/each}
    </div>

    <div class="favicon-snippets">
      <div>
        <label for="favicon-html">HTML</label>
        <textarea id="favicon-html" readonly value={htmlSnippet}></textarea>
        <button class="btn btn-green" type="button" onclick={() => copySnippet(htmlSnippet, 'HTML')}><i data-lucide="copy"></i> Copiar HTML</button>
      </div>
      <div>
        <label for="favicon-manifest">Manifest</label>
        <textarea id="favicon-manifest" readonly value={manifestSnippet}></textarea>
        <button class="btn btn-green" type="button" onclick={() => copySnippet(manifestSnippet, 'Manifest')}><i data-lucide="copy"></i> Copiar manifest</button>
      </div>
    </div>
  {/if}

  <div class="output">{status}</div>
</div>
