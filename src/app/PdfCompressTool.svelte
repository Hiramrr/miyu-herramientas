<script>
  import { activeTool } from '../tools/activeTool.svelte.js';

  let pdfFile = null;
  let pdfLevel = 5;
  let _compressedPDF = null;

  function fmtBytes(b) {
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1048576).toFixed(1) + ' MB';
  }

  function pdfSelected() {
    const output = document.getElementById('pdf-output');
    const downloadBtn = document.getElementById('pdf-download');
    if (output) output.innerHTML = '';
    if (downloadBtn) downloadBtn.style.display = 'none';
  }

  async function compressPDF() {
    if (!pdfFile) {
      const output = document.getElementById('pdf-output');
      if (output) output.textContent = 'Selecciona un archivo PDF primero';
      return;
    }

    var l = pdfLevel;
    var quality = [0.92, 0.85, 0.78, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1][l - 1];
    var dpi = [200, 180, 160, 140, 120, 100, 85, 72, 60, 50][l - 1];

    var bar = document.getElementById('pdf-progress-bar');
    var prog = document.getElementById('pdf-progress');
    if (prog) prog.classList.add('active');
    if (bar) bar.style.width = '5%';

    try {
      var buf = await pdfFile.arrayBuffer();
      if (bar) bar.style.width = '10%';

      var pdfjsLib = window.pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      var pdf = await pdfjsLib.getDocument({ data: buf }).promise;
      var n = pdf.numPages;
      if (bar) bar.style.width = '15%';

      var newDoc = await PDFLib.PDFDocument.create();
      for (var i = 1; i <= n; i++) {
        var page = await pdf.getPage(i);
        var origVp = page.getViewport({ scale: 1 });
        var pageW = origVp.width;
        var pageH = origVp.height;
        var targetDPI = dpi;
        var scale = targetDPI / 72;
        var vp = page.getViewport({ scale: scale });
        var canvas = document.createElement('canvas');
        canvas.width = vp.width;
        canvas.height = vp.height;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, vp.width, vp.height);
        await page.render({ canvasContext: ctx, viewport: vp }).promise;
        var jpegData = canvas.toDataURL('image/jpeg', quality);
        var bs = atob(jpegData.split(',')[1]);
        var len = bs.length;
        var bytes = new Uint8Array(len);
        for (var j = 0; j < len; j++) bytes[j] = bs.charCodeAt(j);
        var img = await newDoc.embedJpg(bytes);
        var p = newDoc.addPage([pageW, pageH]);
        p.drawImage(img, { x: 0, y: 0, width: pageW, height: pageH });
        if (bar) bar.style.width = 15 + ((i / n) * 75) + '%';
      }

      var compressed = await newDoc.save({ useObjectStreams: true });
      if (bar) bar.style.width = '100%';
      _compressedPDF = compressed;

      var orig = pdfFile.size;
      var comp = compressed.length;
      var red = ((1 - comp / orig) * 100).toFixed(1);
      var note = red < 0 ? ' <span style="color:var(--error)">(no se pudo reducir, intenta un nivel más alto)</span>' : '';

      var output = document.getElementById('pdf-output');
      if (output) {
        output.innerHTML = '<strong>Original:</strong> ' + fmtBytes(orig) + '<br><strong>Comprimido:</strong> ' + fmtBytes(comp) + '<br><strong>Reducción:</strong> ' + red + '%' + note + '<br><small style="color:var(--muted)">(el PDF se recompone a partir de imágenes para lograr compresión)</small>';
      }

      var downloadBtn = document.getElementById('pdf-download');
      if (downloadBtn) downloadBtn.style.display = 'inline-flex';
    } catch (e) {
      var output = document.getElementById('pdf-output');
      if (output) output.textContent = 'Error: ' + (e.message || 'no se pudo comprimir el PDF');
    }

    if (prog) prog.classList.remove('active');
  }

  function downloadPDF() {
    if (_compressedPDF) {
      var b = new Blob([_compressedPDF], { type: 'application/pdf' });
      var u = URL.createObjectURL(b);
      var a = document.createElement('a');
      a.href = u;
      a.download = 'comprimido.pdf';
      a.click();
      URL.revokeObjectURL(u);
    }
  }

  function handleFileChange(event) {
    pdfFile = event.target.files?.[0] || null;
    pdfSelected();
  }
</script>

{#if activeTool.id === 'pdf'}
  <div class="tool-panel" id="panel-pdf">
    <div class="panel-header">
      <h2><i data-lucide="archive"></i> Compresor PDF</h2>
      <p>Reduce el tamaño de tus archivos PDF manteniendo la calidad</p>
    </div>
    <label for="pdf-file">Selecciona un archivo PDF</label>
    <input type="file" id="pdf-file" accept=".pdf" onchange={handleFileChange}>
    <label for="pdf-level">Nivel de compresión: <span id="pdf-level-val">{pdfLevel}</span></label>
    <input type="range" id="pdf-level" min="1" max="10" bind:value={pdfLevel}>
    <div class="progress" id="pdf-progress"><div class="progress-bar" id="pdf-progress-bar"></div></div>
    <div class="btn-row">
      <button class="btn" type="button" onclick={compressPDF}><i data-lucide="archive"></i> Comprimir</button>
      <button class="btn btn-green" id="pdf-download" style="display:none" onclick={downloadPDF}><i data-lucide="download"></i> Descargar</button>
    </div>
    <div class="output" id="pdf-output"></div>
  </div>
{/if}
