<script>
  import { destroyPdfDocument, loadPdfLib, openPdfDocument } from './pdfRuntime.js';
  import { pickSmallerPdf } from './pdfHelpers.js';

  let pdfFile = null;
  let pdfLevel = 5;
  let pdfMode = 'structure';
  let downloadBytes = null;
  let status = '';
  let progress = 0;
  let busy = false;

  function fmtBytes(b) {
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1048576).toFixed(1) + ' MB';
  }

  function handleFileChange(event) {
    pdfFile = event.target.files?.[0] || null;
    downloadBytes = null;
    status = '';
    progress = 0;
  }

  async function compressStructure(buf) {
    const { PDFDocument } = await loadPdfLib();
    const doc = await PDFDocument.load(buf);
    return doc.save({ useObjectStreams: true });
  }

  async function compressRaster(buf) {
    const quality = [0.92, 0.85, 0.78, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1][pdfLevel - 1];
    const dpi = [200, 180, 160, 140, 120, 100, 85, 72, 60, 50][pdfLevel - 1];
    const [{ PDFDocument }, pdf] = await Promise.all([loadPdfLib(), openPdfDocument(buf.slice(0))]);
    try {
    const newDoc = await PDFDocument.create();
    const total = pdf.numPages;
    for (let i = 1; i <= total; i++) {
      const page = await pdf.getPage(i);
      const origVp = page.getViewport({ scale: 1 });
      const vp = page.getViewport({ scale: dpi / 72 });
      const canvas = document.createElement('canvas');
      canvas.width = vp.width;
      canvas.height = vp.height;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, vp.width, vp.height);
      await page.render({ canvasContext: ctx, viewport: vp }).promise;
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
      const img = await newDoc.embedJpg(new Uint8Array(await blob.arrayBuffer()));
      const newPage = newDoc.addPage([origVp.width, origVp.height]);
      newPage.drawImage(img, { x: 0, y: 0, width: origVp.width, height: origVp.height });
      progress = 15 + (i / total) * 75;
    }
    return await newDoc.save({ useObjectStreams: true });
    } finally {
      await destroyPdfDocument(pdf);
    }
  }

  async function compressPDF() {
    if (!pdfFile) {
      status = 'Selecciona un archivo PDF primero.';
      return;
    }
    busy = true;
    downloadBytes = null;
    progress = 5;
    try {
      const buf = await pdfFile.arrayBuffer();
      const original = new Uint8Array(buf);
      progress = 10;
      const output = pdfMode === 'raster' ? await compressRaster(buf) : await compressStructure(buf);
      progress = 100;
      const picked = pickSmallerPdf(original, output);
      downloadBytes = picked.bytes;
      const red = ((1 - picked.bytes.length / original.length) * 100).toFixed(1);
      status = picked.isOriginal
        ? `No se logró reducir el tamaño (${fmtBytes(original.length)}). La descarga entrega el archivo original, sin cambios.`
        : `Original: ${fmtBytes(original.length)}. Resultado: ${fmtBytes(picked.bytes.length)}. Reducción: ${red}%.`;
    } catch (e) {
      const message = e?.message || '';
      status = /encrypt|password/i.test(message) || e?.name === 'PasswordException'
        ? 'Error: el PDF está protegido con contraseña. Quita la protección y vuelve a intentarlo.'
        : 'Error: ' + (message || 'no se pudo comprimir el PDF');
    }
    busy = false;
  }

  function downloadPDF() {
    if (!downloadBytes) return;
    const url = URL.createObjectURL(new Blob([downloadBytes], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'comprimido.pdf';
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<div class="tool-panel" id="panel-pdf">
  <div class="panel-header">
    <h2><i data-lucide="archive"></i> Compresor PDF</h2>
    <p>Reduce el tamaño de un PDF. El modo recomendado conserva texto, enlaces y formularios</p>
  </div>
  <label for="pdf-file">Selecciona un archivo PDF</label>
  <input type="file" id="pdf-file" accept=".pdf" onchange={handleFileChange}>

  <fieldset>
    <legend>Modo de compresión</legend>
    <div class="checkbox-row">
      <input type="radio" id="pdf-mode-structure" name="pdf-mode" value="structure" bind:group={pdfMode}>
      <label for="pdf-mode-structure">Conservar texto y estructura (recomendado)</label>
    </div>
    <p>Reempaqueta el documento sin convertirlo a imágenes. Conserva texto seleccionable, enlaces y campos de formulario. La reducción puede ser pequeña.</p>
    <div class="checkbox-row">
      <input type="radio" id="pdf-mode-raster" name="pdf-mode" value="raster" bind:group={pdfMode}>
      <label for="pdf-mode-raster">Convertir cada página a imagen JPEG</label>
    </div>
    {#if pdfMode === 'raster'}
      <p role="alert">Aviso: este modo elimina el texto seleccionable, los enlaces y los campos de formulario. Cada página queda como una foto. Úsalo solo si el documento no necesita esas funciones.</p>
    {/if}
  </fieldset>

  {#if pdfMode === 'raster'}
    <label for="pdf-level">Nivel de compresión: <span>{pdfLevel}</span></label>
    <input type="range" id="pdf-level" min="1" max="10" bind:value={pdfLevel}>
  {/if}

  <div class="progress" class:active={busy}><div class="progress-bar" style="width: {progress}%"></div></div>
  <div class="btn-row">
    <button class="btn" type="button" disabled={busy} onclick={compressPDF}><i data-lucide="archive"></i> Comprimir</button>
    {#if downloadBytes}
      <button class="btn btn-green" type="button" onclick={downloadPDF}><i data-lucide="download"></i> Descargar</button>
    {/if}
  </div>
  <div class="output">{status}</div>
</div>
