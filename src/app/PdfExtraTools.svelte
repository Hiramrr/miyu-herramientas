<script>
  const pageNumberPositions = [
    { value: 'bottom-center', label: 'Abajo centro' },
    { value: 'bottom-right', label: 'Abajo derecha' },
    { value: 'bottom-left', label: 'Abajo izquierda' },
    { value: 'top-center', label: 'Arriba centro' },
    { value: 'top-right', label: 'Arriba derecha' },
    { value: 'top-left', label: 'Arriba izquierda' },
  ];

  let organizeFile;
  let organizeInfo = '';
  let organizeOrder = '';
  let organizeOutput = null;

  let pageNumberFile;
  let pageNumberText = 'Página {n} de {total}';
  let pageNumberPosition = 'bottom-center';
  let pageNumberStart = 1;
  let pageNumberSize = 12;
  let pageNumberColor = '#222222';
  let pageNumberOutput = null;
  let pageNumberInfo = '';

  let watermarkFile;
  let watermarkText = 'CONFIDENCIAL';
  let watermarkPosition = 'center';
  let watermarkOpacity = 0.22;
  let watermarkSize = 48;
  let watermarkRotation = -35;
  let watermarkColor = '#777777';
  let watermarkOutput = null;
  let watermarkInfo = '';

  let signFile;
  let signMode = 'text';
  let signText = 'Firma';
  let signImageFile;
  let signImageBytes = null;
  let signPage = 'last';
  let signPosition = 'bottom-right';
  let signSize = 80;
  let signColor = '#111111';
  let signOutput = null;
  let signInfo = '';

  let cropFile;
  let cropTop = 24;
  let cropRight = 24;
  let cropBottom = 24;
  let cropLeft = 24;
  let cropOutput = null;
  let cropInfo = '';

  let metadataFile;
  let metadataTitle = '';
  let metadataAuthor = '';
  let metadataSubject = '';
  let metadataKeywords = '';
  let metadataOutput = null;
  let metadataInfo = '';

  $: organizeDownloadName = fileName(organizeFile, 'ordenado.pdf');
  $: pageNumberDownloadName = fileName(pageNumberFile, 'numerado.pdf');
  $: watermarkDownloadName = fileName(watermarkFile, 'marca-de-agua.pdf');
  $: signDownloadName = fileName(signFile, 'firmado.pdf');
  $: cropDownloadName = fileName(cropFile, 'recortado.pdf');
  $: metadataDownloadName = fileName(metadataFile, 'metadatos.pdf');

  function fileName(file, suffix) {
    if (!file) return suffix;
    return `${file.name.replace(/\.pdf$/i, '')}-${suffix}`;
  }

  function getPdfLib() {
    if (!window.PDFLib) throw new Error('PDFLib no está disponible.');
    return window.PDFLib;
  }

  function setFile(event, kind) {
    const file = event.currentTarget.files?.[0];
    if (kind === 'organize') {
      organizeFile = file;
      organizeOutput = null;
      organizeInfo = file ? 'PDF cargado. Escribe un orden de páginas o usa una acción rápida.' : '';
      organizeOrder = '';
    }
    if (kind === 'numbers') {
      pageNumberFile = file;
      pageNumberOutput = null;
      pageNumberInfo = file ? 'PDF listo para numerar.' : '';
    }
    if (kind === 'watermark') {
      watermarkFile = file;
      watermarkOutput = null;
      watermarkInfo = file ? 'PDF listo para marca de agua.' : '';
    }
    if (kind === 'sign') {
      signFile = file;
      signOutput = null;
      signInfo = file ? 'PDF listo para firma visible.' : '';
    }
    if (kind === 'crop') {
      cropFile = file;
      cropOutput = null;
      cropInfo = file ? 'PDF listo para recortar.' : '';
    }
    if (kind === 'metadata') {
      metadataFile = file;
      metadataOutput = null;
      metadataInfo = file ? 'PDF listo para editar metadatos.' : '';
    }
  }

  function parsePageOrder(value, total) {
    const result = [];
    const chunks = (value || '').split(',').map((part) => part.trim()).filter(Boolean);
    for (const chunk of chunks) {
      const range = chunk.match(/^(\d+)\s*-\s*(\d+)$/);
      if (range) {
        const start = Number(range[1]);
        const end = Number(range[2]);
        const step = start <= end ? 1 : -1;
        for (let page = start; step > 0 ? page <= end : page >= end; page += step) {
          if (page >= 1 && page <= total) result.push(page - 1);
        }
      } else {
        const page = Number(chunk);
        if (page >= 1 && page <= total) result.push(page - 1);
      }
    }
    return result;
  }

  async function readPdf(file) {
    if (!file) throw new Error('Selecciona un PDF primero.');
    const { PDFDocument } = getPdfLib();
    return PDFDocument.load(await file.arrayBuffer());
  }

  async function organizePdf(mode = 'custom') {
    try {
      const { PDFDocument } = getPdfLib();
      const source = await readPdf(organizeFile);
      const total = source.getPageCount();
      let order = [];
      if (mode === 'reverse') order = Array.from({ length: total }, (_, index) => total - index - 1);
      if (mode === 'odd') order = Array.from({ length: total }, (_, index) => index).filter((index) => index % 2 === 0);
      if (mode === 'even') order = Array.from({ length: total }, (_, index) => index).filter((index) => index % 2 === 1);
      if (mode === 'custom') order = parsePageOrder(organizeOrder, total);
      if (!order.length) throw new Error(`Indica páginas válidas entre 1 y ${total}.`);

      const target = await PDFDocument.create();
      const pages = await target.copyPages(source, order);
      pages.forEach((page) => target.addPage(page));
      const bytes = await target.save();
      organizeOutput = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
      organizeInfo = `PDF creado con ${order.length} de ${total} páginas.`;
    } catch (error) {
      organizeInfo = error.message || 'No se pudo ordenar el PDF.';
    }
  }

  function hexToRgb(hex) {
    const clean = hex.replace('#', '');
    return {
      r: parseInt(clean.slice(0, 2), 16) / 255,
      g: parseInt(clean.slice(2, 4), 16) / 255,
      b: parseInt(clean.slice(4, 6), 16) / 255,
    };
  }

  function pageNumberXY(page, textWidth, position) {
    const { width, height } = page.getSize();
    const margin = 34;
    const top = height - margin;
    const bottom = margin;
    const x = position.endsWith('left') ? margin : position.endsWith('right') ? width - margin - textWidth : (width - textWidth) / 2;
    const y = position.startsWith('top') ? top : bottom;
    return { x, y };
  }

  async function addPageNumbers() {
    try {
      const { StandardFonts, rgb } = getPdfLib();
      const pdf = await readPdf(pageNumberFile);
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const pages = pdf.getPages();
      const color = hexToRgb(pageNumberColor);
      pages.forEach((page, index) => {
        const label = pageNumberText
          .replaceAll('{n}', String(Number(pageNumberStart) + index))
          .replaceAll('{total}', String(pages.length));
        const textWidth = font.widthOfTextAtSize(label, Number(pageNumberSize));
        const pos = pageNumberXY(page, textWidth, pageNumberPosition);
        page.drawText(label, {
          x: pos.x,
          y: pos.y,
          size: Number(pageNumberSize),
          font,
          color: rgb(color.r, color.g, color.b),
        });
      });
      const bytes = await pdf.save();
      pageNumberOutput = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
      pageNumberInfo = `Números agregados a ${pages.length} páginas.`;
    } catch (error) {
      pageNumberInfo = error.message || 'No se pudo numerar el PDF.';
    }
  }

  function watermarkXY(page, textWidth, textHeight, position) {
    const { width, height } = page.getSize();
    const margin = 48;
    if (position === 'top') return { x: (width - textWidth) / 2, y: height - margin - textHeight };
    if (position === 'bottom') return { x: (width - textWidth) / 2, y: margin };
    return { x: (width - textWidth) / 2, y: (height - textHeight) / 2 };
  }

  async function addWatermark() {
    try {
      const { StandardFonts, degrees, rgb } = getPdfLib();
      const pdf = await readPdf(watermarkFile);
      const font = await pdf.embedFont(StandardFonts.HelveticaBold);
      const color = hexToRgb(watermarkColor);
      const pages = pdf.getPages();
      pages.forEach((page) => {
        const size = Number(watermarkSize);
        const textWidth = font.widthOfTextAtSize(watermarkText, size);
        const pos = watermarkXY(page, textWidth, size, watermarkPosition);
        page.drawText(watermarkText, {
          x: pos.x,
          y: pos.y,
          size,
          font,
          rotate: degrees(Number(watermarkRotation)),
          opacity: Number(watermarkOpacity),
          color: rgb(color.r, color.g, color.b),
        });
      });
      const bytes = await pdf.save();
      watermarkOutput = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
      watermarkInfo = `Marca de agua aplicada a ${pages.length} páginas.`;
    } catch (error) {
      watermarkInfo = error.message || 'No se pudo agregar la marca de agua.';
    }
  }

  function targetPages(pdf, mode) {
    const total = pdf.getPageCount();
    if (mode === 'first') return [pdf.getPage(0)];
    if (mode === 'last') return [pdf.getPage(total - 1)];
    return pdf.getPages();
  }

  function placedBox(page, boxWidth, boxHeight, position) {
    const { width, height } = page.getSize();
    const margin = 42;
    const x = position.endsWith('left') ? margin : position.endsWith('right') ? width - margin - boxWidth : (width - boxWidth) / 2;
    const y = position.startsWith('top') ? height - margin - boxHeight : position.startsWith('bottom') ? margin : (height - boxHeight) / 2;
    return { x, y };
  }

  async function setSignatureImage(event) {
    signImageFile = event.currentTarget.files?.[0];
    signImageBytes = signImageFile ? new Uint8Array(await signImageFile.arrayBuffer()) : null;
    signOutput = null;
  }

  async function addSignature() {
    try {
      const { StandardFonts, rgb } = getPdfLib();
      const pdf = await readPdf(signFile);
      const pages = targetPages(pdf, signPage);
      const color = hexToRgb(signColor);
      if (signMode === 'image') {
        if (!signImageBytes) throw new Error('Selecciona una imagen de firma.');
        const image = signImageFile?.type === 'image/jpeg' ? await pdf.embedJpg(signImageBytes) : await pdf.embedPng(signImageBytes);
        const scaled = image.scale(Number(signSize) / image.width);
        pages.forEach((page) => {
          const pos = placedBox(page, scaled.width, scaled.height, signPosition);
          page.drawImage(image, { x: pos.x, y: pos.y, width: scaled.width, height: scaled.height });
        });
      } else {
        const font = await pdf.embedFont(StandardFonts.HelveticaBold);
        const size = Number(signSize) / 3;
        const textWidth = font.widthOfTextAtSize(signText, size);
        pages.forEach((page) => {
          const pos = placedBox(page, textWidth, size, signPosition);
          page.drawText(signText, {
            x: pos.x,
            y: pos.y,
            size,
            font,
            color: rgb(color.r, color.g, color.b),
          });
        });
      }
      const bytes = await pdf.save();
      signOutput = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
      signInfo = `Firma visible aplicada en ${pages.length} página(s).`;
    } catch (error) {
      signInfo = error.message || 'No se pudo firmar el PDF.';
    }
  }

  async function cropPdf() {
    try {
      const pdf = await readPdf(cropFile);
      const pages = pdf.getPages();
      pages.forEach((page) => {
        const { width, height } = page.getSize();
        const left = Number(cropLeft) || 0;
        const right = Number(cropRight) || 0;
        const top = Number(cropTop) || 0;
        const bottom = Number(cropBottom) || 0;
        const cropWidth = width - left - right;
        const cropHeight = height - top - bottom;
        if (cropWidth <= 20 || cropHeight <= 20) throw new Error('Los márgenes son demasiado grandes para el tamaño del PDF.');
        page.setCropBox(left, bottom, cropWidth, cropHeight);
      });
      const bytes = await pdf.save();
      cropOutput = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
      cropInfo = `Recorte aplicado a ${pages.length} páginas.`;
    } catch (error) {
      cropInfo = error.message || 'No se pudo recortar el PDF.';
    }
  }

  async function editMetadata() {
    try {
      const pdf = await readPdf(metadataFile);
      pdf.setTitle(metadataTitle || '');
      pdf.setAuthor(metadataAuthor || '');
      pdf.setSubject(metadataSubject || '');
      pdf.setKeywords(metadataKeywords.split(',').map((keyword) => keyword.trim()).filter(Boolean));
      pdf.setCreator('Miyu Herramientas');
      pdf.setProducer('Miyu Herramientas');
      pdf.setModificationDate(new Date());
      const bytes = await pdf.save();
      metadataOutput = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
      metadataInfo = 'Metadatos actualizados en el PDF.';
    } catch (error) {
      metadataInfo = error.message || 'No se pudieron editar los metadatos.';
    }
  }

  function download(url, name) {
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
  }
</script>

<div class="tool-panel" id="panel-pdf-organize">
  <div class="panel-header">
    <h2><i data-lucide="list-ordered"></i> Ordenar PDF</h2>
    <p>Reordena, invierte o extrae páginas de un PDF sin subirlo a ningún servidor</p>
  </div>
  <label for="pdf-organize-file">Selecciona un PDF</label>
  <input id="pdf-organize-file" type="file" accept=".pdf" onchange={(event) => setFile(event, 'organize')}>
  <label for="pdf-organize-order">Orden de páginas</label>
  <input id="pdf-organize-order" type="text" bind:value={organizeOrder} placeholder="Ej: 1, 3, 2, 5-8, 10">
  <div class="btn-row">
    <button class="btn" type="button" onclick={() => organizePdf('custom')}><i data-lucide="list-ordered"></i> Aplicar orden</button>
    <button class="btn" type="button" onclick={() => organizePdf('reverse')}><i data-lucide="arrow-down-up"></i> Invertir</button>
    <button class="btn" type="button" onclick={() => organizePdf('odd')}>Impares</button>
    <button class="btn" type="button" onclick={() => organizePdf('even')}>Pares</button>
    {#if organizeOutput}
      <button class="btn btn-green" type="button" onclick={() => download(organizeOutput, organizeDownloadName)}><i data-lucide="download"></i> Descargar</button>
    {/if}
  </div>
  <div class="output">{organizeInfo || 'Puedes repetir páginas y usar rangos ascendentes o descendentes.'}</div>
</div>

<div class="tool-panel" id="panel-pdf-page-numbers">
  <div class="panel-header">
    <h2><i data-lucide="list-plus"></i> Números de página</h2>
    <p>Agrega numeración configurable a todas las páginas del PDF</p>
  </div>
  <label for="pdf-page-number-file">Selecciona un PDF</label>
  <input id="pdf-page-number-file" type="file" accept=".pdf" onchange={(event) => setFile(event, 'numbers')}>
  <div class="pdf-extra-grid">
    <div>
      <label for="pdf-page-number-text">Formato</label>
      <input id="pdf-page-number-text" type="text" bind:value={pageNumberText}>
    </div>
    <div>
      <label for="pdf-page-number-position">Posición</label>
      <select id="pdf-page-number-position" bind:value={pageNumberPosition}>
        {#each pageNumberPositions as position}
          <option value={position.value}>{position.label}</option>
        {/each}
      </select>
    </div>
    <div>
      <label for="pdf-page-number-start">Empezar en</label>
      <input id="pdf-page-number-start" type="number" min="0" bind:value={pageNumberStart}>
    </div>
    <div>
      <label for="pdf-page-number-size">Tamaño</label>
      <input id="pdf-page-number-size" type="number" min="6" max="48" bind:value={pageNumberSize}>
    </div>
    <div>
      <label for="pdf-page-number-color">Color</label>
      <input id="pdf-page-number-color" type="color" bind:value={pageNumberColor}>
    </div>
  </div>
  <div class="btn-row">
    <button class="btn" type="button" onclick={addPageNumbers}><i data-lucide="list-plus"></i> Agregar números</button>
    {#if pageNumberOutput}
      <button class="btn btn-green" type="button" onclick={() => download(pageNumberOutput, pageNumberDownloadName)}><i data-lucide="download"></i> Descargar</button>
    {/if}
  </div>
  <div class="output">{pageNumberInfo || 'Usa {n} para el número actual y {total} para el total de páginas.'}</div>
</div>

<div class="tool-panel" id="panel-pdf-sign">
  <div class="panel-header">
    <h2><i data-lucide="signature"></i> Firmar PDF</h2>
    <p>Agrega una firma visible con texto o imagen; no es una firma digital criptográfica</p>
  </div>
  <label for="pdf-sign-file">Selecciona un PDF</label>
  <input id="pdf-sign-file" type="file" accept=".pdf" onchange={(event) => setFile(event, 'sign')}>
  <div class="pdf-extra-grid">
    <div>
      <label for="pdf-sign-mode">Tipo de firma</label>
      <select id="pdf-sign-mode" bind:value={signMode}>
        <option value="text">Texto</option>
        <option value="image">Imagen PNG/JPG</option>
      </select>
    </div>
    <div>
      <label for="pdf-sign-page">Páginas</label>
      <select id="pdf-sign-page" bind:value={signPage}>
        <option value="last">Última página</option>
        <option value="first">Primera página</option>
        <option value="all">Todas</option>
      </select>
    </div>
    <div>
      <label for="pdf-sign-position">Posición</label>
      <select id="pdf-sign-position" bind:value={signPosition}>
        <option value="bottom-right">Abajo derecha</option>
        <option value="bottom-center">Abajo centro</option>
        <option value="bottom-left">Abajo izquierda</option>
        <option value="center">Centro</option>
        <option value="top-right">Arriba derecha</option>
        <option value="top-center">Arriba centro</option>
        <option value="top-left">Arriba izquierda</option>
      </select>
    </div>
    <div>
      <label for="pdf-sign-size">Tamaño</label>
      <input id="pdf-sign-size" type="number" min="24" max="260" bind:value={signSize}>
    </div>
    {#if signMode === 'text'}
      <div>
        <label for="pdf-sign-text">Texto de firma</label>
        <input id="pdf-sign-text" type="text" bind:value={signText}>
      </div>
      <div>
        <label for="pdf-sign-color">Color</label>
        <input id="pdf-sign-color" type="color" bind:value={signColor}>
      </div>
    {:else}
      <div>
        <label for="pdf-sign-image">Imagen de firma</label>
        <input id="pdf-sign-image" type="file" accept="image/png,image/jpeg" onchange={setSignatureImage}>
      </div>
    {/if}
  </div>
  <div class="btn-row">
    <button class="btn" type="button" onclick={addSignature}><i data-lucide="signature"></i> Aplicar firma</button>
    {#if signOutput}
      <button class="btn btn-green" type="button" onclick={() => download(signOutput, signDownloadName)}><i data-lucide="download"></i> Descargar</button>
    {/if}
  </div>
  <div class="output">{signInfo || 'La firma queda visible sobre el PDF, procesada localmente.'}</div>
</div>

<div class="tool-panel" id="panel-pdf-crop">
  <div class="panel-header">
    <h2><i data-lucide="crop"></i> Recortar PDF</h2>
    <p>Recorta márgenes visuales de todas las páginas modificando el área visible</p>
  </div>
  <label for="pdf-crop-file">Selecciona un PDF</label>
  <input id="pdf-crop-file" type="file" accept=".pdf" onchange={(event) => setFile(event, 'crop')}>
  <div class="pdf-extra-grid">
    <div>
      <label for="pdf-crop-top">Arriba (pt)</label>
      <input id="pdf-crop-top" type="number" min="0" bind:value={cropTop}>
    </div>
    <div>
      <label for="pdf-crop-right">Derecha (pt)</label>
      <input id="pdf-crop-right" type="number" min="0" bind:value={cropRight}>
    </div>
    <div>
      <label for="pdf-crop-bottom">Abajo (pt)</label>
      <input id="pdf-crop-bottom" type="number" min="0" bind:value={cropBottom}>
    </div>
    <div>
      <label for="pdf-crop-left">Izquierda (pt)</label>
      <input id="pdf-crop-left" type="number" min="0" bind:value={cropLeft}>
    </div>
  </div>
  <div class="btn-row">
    <button class="btn" type="button" onclick={cropPdf}><i data-lucide="crop"></i> Recortar</button>
    {#if cropOutput}
      <button class="btn btn-green" type="button" onclick={() => download(cropOutput, cropDownloadName)}><i data-lucide="download"></i> Descargar</button>
    {/if}
  </div>
  <div class="output">{cropInfo || '1 punto equivale a 1/72 de pulgada. El contenido no se sube a internet.'}</div>
</div>

<div class="tool-panel" id="panel-pdf-watermark">
  <div class="panel-header">
    <h2><i data-lucide="stamp"></i> Marca de agua</h2>
    <p>Inserta una marca de agua de texto con posición, color, opacidad y rotación</p>
  </div>
  <label for="pdf-watermark-file">Selecciona un PDF</label>
  <input id="pdf-watermark-file" type="file" accept=".pdf" onchange={(event) => setFile(event, 'watermark')}>
  <div class="pdf-extra-grid">
    <div>
      <label for="pdf-watermark-text">Texto</label>
      <input id="pdf-watermark-text" type="text" bind:value={watermarkText}>
    </div>
    <div>
      <label for="pdf-watermark-position">Posición</label>
      <select id="pdf-watermark-position" bind:value={watermarkPosition}>
        <option value="center">Centro</option>
        <option value="top">Arriba</option>
        <option value="bottom">Abajo</option>
      </select>
    </div>
    <div>
      <label for="pdf-watermark-size">Tamaño</label>
      <input id="pdf-watermark-size" type="number" min="8" max="160" bind:value={watermarkSize}>
    </div>
    <div>
      <label for="pdf-watermark-rotation">Rotación</label>
      <input id="pdf-watermark-rotation" type="number" min="-90" max="90" bind:value={watermarkRotation}>
    </div>
    <div>
      <label for="pdf-watermark-opacity">Opacidad: {Math.round(watermarkOpacity * 100)}%</label>
      <input id="pdf-watermark-opacity" type="range" min="0.05" max="1" step="0.05" bind:value={watermarkOpacity}>
    </div>
    <div>
      <label for="pdf-watermark-color">Color</label>
      <input id="pdf-watermark-color" type="color" bind:value={watermarkColor}>
    </div>
  </div>
  <div class="btn-row">
    <button class="btn" type="button" onclick={addWatermark}><i data-lucide="stamp"></i> Aplicar marca</button>
    {#if watermarkOutput}
      <button class="btn btn-green" type="button" onclick={() => download(watermarkOutput, watermarkDownloadName)}><i data-lucide="download"></i> Descargar</button>
    {/if}
  </div>
  <div class="output">{watermarkInfo || 'La marca se aplica localmente a todas las páginas.'}</div>
</div>

<div class="tool-panel" id="panel-pdf-metadata">
  <div class="panel-header">
    <h2><i data-lucide="info"></i> Metadatos PDF</h2>
    <p>Edita título, autor, asunto y palabras clave del documento</p>
  </div>
  <label for="pdf-metadata-file">Selecciona un PDF</label>
  <input id="pdf-metadata-file" type="file" accept=".pdf" onchange={(event) => setFile(event, 'metadata')}>
  <div class="pdf-extra-grid">
    <div>
      <label for="pdf-metadata-title">Título</label>
      <input id="pdf-metadata-title" type="text" bind:value={metadataTitle} placeholder="Reporte mensual">
    </div>
    <div>
      <label for="pdf-metadata-author">Autor</label>
      <input id="pdf-metadata-author" type="text" bind:value={metadataAuthor} placeholder="Nombre o equipo">
    </div>
    <div>
      <label for="pdf-metadata-subject">Asunto</label>
      <input id="pdf-metadata-subject" type="text" bind:value={metadataSubject} placeholder="Tema del documento">
    </div>
    <div>
      <label for="pdf-metadata-keywords">Palabras clave</label>
      <input id="pdf-metadata-keywords" type="text" bind:value={metadataKeywords} placeholder="factura, contrato, archivo">
    </div>
  </div>
  <div class="btn-row">
    <button class="btn" type="button" onclick={editMetadata}><i data-lucide="save"></i> Guardar metadatos</button>
    {#if metadataOutput}
      <button class="btn btn-green" type="button" onclick={() => download(metadataOutput, metadataDownloadName)}><i data-lucide="download"></i> Descargar</button>
    {/if}
  </div>
  <div class="output">{metadataInfo || 'Los metadatos ayudan a organizar y buscar documentos PDF.'}</div>
</div>
