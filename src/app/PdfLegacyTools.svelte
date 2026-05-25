<script>
  import { activeTool } from '../tools/activeTool.svelte.js';

  var _mergeFiles = [];
  var _mergedPDF;
  var _splitSelected = [];
  var _splitTotalPages = 0;
  var _splitPDF;
  var _img2pdf;

  function fmtBytes(b) {
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1048576).toFixed(1) + ' MB';
  }

  function parsePages(input, max) {
    var out = [];
    if (!input) return out;
    var parts = input.split(',');
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i].trim();
      if (!p) continue;
      var range = p.split('-');
      if (range.length === 1) {
        var n = parseInt(range[0]);
        if (!isNaN(n) && n >= 1 && n <= max) out.push(n);
      } else if (range.length === 2) {
        var start = parseInt(range[0]);
        var end = parseInt(range[1]);
        if (!isNaN(start) && !isNaN(end)) {
          for (var j = start; j <= end; j++) {
            if (j >= 1 && j <= max) out.push(j);
          }
        }
      }
    }
    return out;
  }

  function renderMergeList() {
    var list = document.getElementById('pdf-merge-list');
    list.innerHTML = '';
    for (var i = 0; i < _mergeFiles.length; i++) {
      var li = document.createElement('li');
      li.style.display = 'flex';
      li.style.alignItems = 'center';
      li.style.justifyContent = 'space-between';
      li.style.gap = '8px';
      li.style.padding = '6px 0';
      li.style.borderBottom = '1px solid var(--line)';
      var info = document.createElement('span');
      info.textContent = (i + 1) + '. ' + _mergeFiles[i].name + ' (' + fmtBytes(_mergeFiles[i].size) + ')';
      info.style.overflow = 'hidden';
      info.style.textOverflow = 'ellipsis';
      info.style.whiteSpace = 'nowrap';
      var btn = document.createElement('button');
      btn.textContent = '×';
      btn.style.flexShrink = '0';
      btn.style.width = '24px';
      btn.style.height = '24px';
      btn.style.border = '1px solid var(--line)';
      btn.style.borderRadius = '4px';
      btn.style.background = 'var(--surface)';
      btn.style.color = 'var(--danger)';
      btn.style.cursor = 'pointer';
      btn.style.fontWeight = '700';
      btn.style.lineHeight = '1';
      btn.onclick = function(idx) {
        return function() {
          _mergeFiles.splice(idx, 1);
          renderMergeList();
        };
      }(i);
      li.appendChild(info);
      li.appendChild(btn);
      list.appendChild(li);
    }
  }

  function addMergeFiles() {
    var files = document.getElementById('pdf-merge-files').files;
    for (var i = 0; i < files.length; i++) {
      _mergeFiles.push(files[i]);
    }
    renderMergeList();
    document.getElementById('pdf-merge-files').value = '';
  }

  function clearMergeFiles() {
    _mergeFiles = [];
    renderMergeList();
    document.getElementById('pdf-merge-output').innerHTML = '';
    document.getElementById('pdf-merge-download').style.display = 'none';
  }

  async function mergePDFs() {
    if (_mergeFiles.length < 2) {
      document.getElementById('pdf-merge-output').textContent = 'Agrega al menos 2 PDFs';
      return;
    }
    document.getElementById('pdf-merge-output').textContent = 'Procesando...';
    try {
      var merged = await PDFLib.PDFDocument.create();
      for (var i = 0; i < _mergeFiles.length; i++) {
        var buf = await _mergeFiles[i].arrayBuffer();
        var src = await PDFLib.PDFDocument.load(buf, { ignoreEncryption: true });
        var pages = await merged.copyPages(src, src.getPageIndices());
        for (var j = 0; j < pages.length; j++) {
          merged.addPage(pages[j]);
        }
      }
      var bytes = await merged.save();
      _mergedPDF = bytes;
      document.getElementById('pdf-merge-output').innerHTML = '<strong>Archivos unidos:</strong> ' + _mergeFiles.length + '<br><strong>Tamaño:</strong> ' + fmtBytes(bytes.length);
      document.getElementById('pdf-merge-download').style.display = 'inline-flex';
    } catch (e) {
      document.getElementById('pdf-merge-output').textContent = 'Error: ' + (e.message || 'no se pudieron unir los PDFs');
    }
  }

  function downloadMergedPDF() {
    if (_mergedPDF) {
      var b = new Blob([_mergedPDF], { type: 'application/pdf' });
      var u = URL.createObjectURL(b);
      var a = document.createElement('a');
      a.href = u;
      a.download = 'unido.pdf';
      a.click();
      URL.revokeObjectURL(u);
    }
  }

  async function loadSplitPDF() {
    var f = document.getElementById('pdf-split-file').files[0];
    if (!f) return;
    var wrap = document.getElementById('pdf-split-thumb-wrap');
    var grid = document.getElementById('pdf-split-grid');
    var prog = document.getElementById('pdf-split-progress');
    var bar = document.getElementById('pdf-split-progress-bar');
    prog.classList.add('active');
    bar.style.width = '10%';
    wrap.style.display = 'none';
    grid.innerHTML = '';
    _splitSelected = [];
    _splitTotalPages = 0;
    document.getElementById('pdf-split-output').innerHTML = '';
    document.getElementById('pdf-split-download').style.display = 'none';
    try {
      var buf = await f.arrayBuffer();
      var pdfjsLib = window.pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      var pdf = await pdfjsLib.getDocument({ data: buf }).promise;
      _splitTotalPages = pdf.numPages;
      for (var i = 1; i <= _splitTotalPages; i++) {
        var page = await pdf.getPage(i);
        var scale = 110 / Math.max(page.getViewport({ scale: 1 }).width, page.getViewport({ scale: 1 }).height);
        if (scale > 2) scale = 2;
        var vp = page.getViewport({ scale: scale });
        var canvas = document.createElement('canvas');
        canvas.width = vp.width;
        canvas.height = vp.height;
        canvas.className = 'pdf-thumb-canvas';
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, vp.width, vp.height);
        await page.render({ canvasContext: ctx, viewport: vp }).promise;
        var item = document.createElement('div');
        item.className = 'pdf-thumb-item';
        item.dataset.page = i;
        item.onclick = function(p) {
          return function() {
            toggleSplitPage(p);
          };
        }(i);
        var label = document.createElement('div');
        label.className = 'pdf-thumb-label';
        label.textContent = 'Pág. ' + i;
        item.appendChild(canvas);
        item.appendChild(label);
        grid.appendChild(item);
        bar.style.width = (i / _splitTotalPages * 100) + '%';
      }
      wrap.style.display = 'block';
      prog.classList.remove('active');
      _splitSelected = [];
      for (var i = 1; i <= _splitTotalPages; i++) _splitSelected.push(i);
      updateSplitSelectionUI();
    } catch (e) {
      document.getElementById('pdf-split-output').textContent = 'Error: ' + (e.message || 'no se pudo cargar el PDF');
      prog.classList.remove('active');
    }
  }

  function toggleSplitPage(p) {
    var idx = _splitSelected.indexOf(p);
    if (idx !== -1) {
      _splitSelected.splice(idx, 1);
    } else {
      _splitSelected.push(p);
      _splitSelected.sort(function(a, b) { return a - b; });
    }
    updateSplitSelectionUI();
  }

  function updateSplitSelectionUI() {
    document.querySelectorAll('.pdf-thumb-item').forEach(function(item) {
      var p = parseInt(item.dataset.page);
      if (_splitSelected.indexOf(p) !== -1) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });
    document.getElementById('pdf-split-output').innerHTML = '<strong>Seleccionadas:</strong> ' + _splitSelected.length + ' / ' + _splitTotalPages + ' páginas';
  }

  function selectAllSplit() {
    _splitSelected = [];
    for (var i = 1; i <= _splitTotalPages; i++) _splitSelected.push(i);
    updateSplitSelectionUI();
  }

  function deselectAllSplit() {
    _splitSelected = [];
    updateSplitSelectionUI();
  }

  function applySplitRange() {
    var input = document.getElementById('pdf-split-pages').value;
    if (!input || !_splitTotalPages) return;
    var parsed = parsePages(input, _splitTotalPages);
    for (var i = 0; i < parsed.length; i++) {
      if (_splitSelected.indexOf(parsed[i]) === -1) {
        _splitSelected.push(parsed[i]);
      }
    }
    _splitSelected.sort(function(a, b) { return a - b; });
    updateSplitSelectionUI();
    document.getElementById('pdf-split-pages').value = '';
  }

  async function splitPDF() {
    if (_splitSelected.length === 0) {
      document.getElementById('pdf-split-output').textContent = 'Selecciona al menos una página';
      return;
    }
    document.getElementById('pdf-split-output').textContent = 'Procesando...';
    try {
      var f = document.getElementById('pdf-split-file').files[0];
      var buf = await f.arrayBuffer();
      var src = await PDFLib.PDFDocument.load(buf, { ignoreEncryption: true });
      var out = await PDFLib.PDFDocument.create();
      var copied = await out.copyPages(src, _splitSelected.map(function(p) { return p - 1; }));
      for (var i = 0; i < copied.length; i++) {
        out.addPage(copied[i]);
      }
      var bytes = await out.save();
      _splitPDF = bytes;
      document.getElementById('pdf-split-output').innerHTML = '<strong>Páginas extraídas:</strong> ' + _splitSelected.length + '<br><strong>Tamaño:</strong> ' + fmtBytes(bytes.length);
      document.getElementById('pdf-split-download').style.display = 'inline-flex';
    } catch (e) {
      document.getElementById('pdf-split-output').textContent = 'Error: ' + (e.message || 'no se pudo dividir el PDF');
    }
  }

  function downloadSplitPDF() {
    if (_splitPDF) {
      var b = new Blob([_splitPDF], { type: 'application/pdf' });
      var u = URL.createObjectURL(b);
      var a = document.createElement('a');
      a.href = u;
      a.download = 'extraido.pdf';
      a.click();
      URL.revokeObjectURL(u);
    }
  }

  function img2pdfList() {
    var files = document.getElementById('pdf-img2pdf-files').files;
    var list = document.getElementById('pdf-img2pdf-list');
    list.innerHTML = '';
    for (var i = 0; i < files.length; i++) {
      var li = document.createElement('li');
      li.textContent = (i + 1) + '. ' + files[i].name + ' (' + fmtBytes(files[i].size) + ')';
      li.style.padding = '3px 0';
      li.style.borderBottom = '1px solid var(--line)';
      list.appendChild(li);
    }
  }

  async function imagesToPDF() {
    var files = document.getElementById('pdf-img2pdf-files').files;
    if (files.length === 0) {
      document.getElementById('pdf-img2pdf-output').textContent = 'Selecciona al menos una imagen';
      return;
    }
    document.getElementById('pdf-img2pdf-output').textContent = 'Procesando...';
    try {
      var pdf = await PDFLib.PDFDocument.create();
      for (var i = 0; i < files.length; i++) {
        var buf = await files[i].arrayBuffer();
        var imgBytes = new Uint8Array(buf);
        var img;
        if (files[i].type === 'image/png') {
          img = await pdf.embedPng(imgBytes);
        } else {
          img = await pdf.embedJpg(imgBytes);
        }
        var dims = img.scale(1);
        var page = pdf.addPage([dims.width, dims.height]);
        page.drawImage(img, { x: 0, y: 0, width: dims.width, height: dims.height });
      }
      var bytes = await pdf.save();
      _img2pdf = bytes;
      document.getElementById('pdf-img2pdf-output').innerHTML = '<strong>Imágenes:</strong> ' + files.length + '<br><strong>Tamaño:</strong> ' + fmtBytes(bytes.length);
      document.getElementById('pdf-img2pdf-download').style.display = 'inline-flex';
    } catch (e) {
      document.getElementById('pdf-img2pdf-output').textContent = 'Error: ' + (e.message || 'no se pudo crear el PDF');
    }
  }

  function downloadImg2PDF() {
    if (_img2pdf) {
      var b = new Blob([_img2pdf], { type: 'application/pdf' });
      var u = URL.createObjectURL(b);
      var a = document.createElement('a');
      a.href = u;
      a.download = 'imagenes.pdf';
      a.click();
      URL.revokeObjectURL(u);
    }
  }

  async function pdfToImages() {
    var f = document.getElementById('pdf-pdf2img-file').files[0];
    if (!f) {
      document.getElementById('pdf-pdf2img-output').textContent = 'Selecciona un PDF primero';
      return;
    }
    var scale = parseFloat(document.getElementById('pdf-pdf2img-scale').value) || 1.5;
    document.getElementById('pdf-pdf2img-output').textContent = 'Renderizando páginas...';
    document.getElementById('pdf-pdf2img-grid').innerHTML = '';
    var prog = document.getElementById('pdf-pdf2img-progress');
    var bar = document.getElementById('pdf-pdf2img-progress-bar');
    prog.classList.add('active');
    bar.style.width = '5%';
    try {
      var buf = await f.arrayBuffer();
      var pdfjsLib = window.pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      var pdf = await pdfjsLib.getDocument({ data: buf }).promise;
      var n = pdf.numPages;
      var grid = document.getElementById('pdf-pdf2img-grid');
      for (var i = 1; i <= n; i++) {
        var page = await pdf.getPage(i);
        var vp = page.getViewport({ scale: scale });
        var canvas = document.createElement('canvas');
        canvas.width = vp.width;
        canvas.height = vp.height;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, vp.width, vp.height);
        await page.render({ canvasContext: ctx, viewport: vp }).promise;
        var dataUrl = canvas.toDataURL('image/png');
        var wrapper = document.createElement('div');
        wrapper.style.border = '1px solid var(--line)';
        wrapper.style.borderRadius = 'var(--radius)';
        wrapper.style.padding = '8px';
        wrapper.style.background = 'var(--surface-strong)';
        var img = document.createElement('img');
        img.src = dataUrl;
        img.style.width = '100%';
        img.style.borderRadius = '4px';
        img.style.display = 'block';
        var btn = document.createElement('button');
        btn.className = 'btn';
        btn.style.width = '100%';
        btn.style.marginTop = '8px';
        btn.style.minHeight = '32px';
        btn.style.padding = '6px';
        btn.style.fontSize = '0.72rem';
        btn.innerHTML = '<i data-lucide="download"></i> Página ' + i;
        btn.onclick = function(url, pageNum) {
          return function() {
            var a = document.createElement('a');
            a.href = url;
            a.download = 'pagina_' + pageNum + '.png';
            a.click();
          };
        }(dataUrl, i);
        wrapper.appendChild(img);
        wrapper.appendChild(btn);
        grid.appendChild(wrapper);
        bar.style.width = (i / n * 100) + '%';
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
          window.lucide.createIcons();
        }
      }
      document.getElementById('pdf-pdf2img-output').textContent = 'Se generaron ' + n + ' imagen(es). Haz clic en cada botón para descargar.';
      prog.classList.remove('active');
    } catch (e) {
      document.getElementById('pdf-pdf2img-output').textContent = 'Error: ' + (e.message || 'no se pudo convertir el PDF');
      prog.classList.remove('active');
    }
  }

  async function extractPDFText() {
    var f = document.getElementById('pdf-text-file').files[0];
    if (!f) {
      document.getElementById('pdf-text-output').value = 'Selecciona un PDF primero';
      return;
    }
    var prog = document.getElementById('pdf-text-progress');
    var bar = document.getElementById('pdf-text-progress-bar');
    prog.classList.add('active');
    bar.style.width = '10%';
    document.getElementById('pdf-text-output').value = 'Extrayendo...';
    try {
      var buf = await f.arrayBuffer();
      var pdfjsLib = window.pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      var pdf = await pdfjsLib.getDocument({ data: buf }).promise;
      var n = pdf.numPages;
      var text = '';
      for (var i = 1; i <= n; i++) {
        var page = await pdf.getPage(i);
        var content = await page.getTextContent();
        var items = content.items.map(function(item) { return item.str; });
        text += '--- Página ' + i + ' ---\n' + items.join(' ') + '\n\n';
        bar.style.width = (i / n * 100) + '%';
      }
      document.getElementById('pdf-text-output').value = text.trim();
      document.getElementById('pdf-text-copy').style.display = 'inline-flex';
      prog.classList.remove('active');
    } catch (e) {
      document.getElementById('pdf-text-output').value = 'Error: ' + (e.message || 'no se pudo extraer el texto');
      prog.classList.remove('active');
    }
  }

  function copyExtractedText() {
    var t = document.getElementById('pdf-text-output').value;
    if (t) navigator.clipboard.writeText(t);
  }
</script>

{#if activeTool.id === 'pdf-merge'}
<div class="tool-panel" id="panel-pdf-merge">
  <div class="panel-header">
    <h2><i data-lucide="files"></i> Unir PDFs</h2>
    <p>Combina varios archivos PDF en uno solo, en el orden que elijas</p>
  </div>
  <label for="pdf-merge-files">Agregar PDFs</label>
  <input type="file" id="pdf-merge-files" accept=".pdf" multiple onchange={addMergeFiles}>
  <ul id="pdf-merge-list" style="margin-top:10px;font-size:0.85rem;color:var(--muted);list-style:none;padding:0"></ul>
  <div class="btn-row">
    <button class="btn" onclick={mergePDFs}><i data-lucide="files"></i> Unir PDFs</button>
    <button class="btn btn-red" onclick={clearMergeFiles}><i data-lucide="trash"></i> Limpiar lista</button>
    <button class="btn btn-green" id="pdf-merge-download" style="display:none" onclick={downloadMergedPDF}><i data-lucide="download"></i> Descargar</button>
  </div>
  <div class="output" id="pdf-merge-output"></div>
</div>
{/if}

{#if activeTool.id === 'pdf-split'}
<div class="tool-panel" id="panel-pdf-split">
  <div class="panel-header">
    <h2><i data-lucide="scissors"></i> Dividir PDF</h2>
    <p>Selecciona las páginas visualmente o escribe rangos para extraerlas</p>
  </div>
  <label for="pdf-split-file">Selecciona un PDF</label>
  <input type="file" id="pdf-split-file" accept=".pdf" onchange={loadSplitPDF}>
  <div class="progress" id="pdf-split-progress"><div class="progress-bar" id="pdf-split-progress-bar"></div></div>
  <div id="pdf-split-thumb-wrap" style="display:none;margin-top:14px">
    <div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap">
      <button class="btn" style="min-height:32px;padding:7px 12px;font-size:0.72rem" onclick={selectAllSplit}><i data-lucide="check-square"></i> Todas</button>
      <button class="btn" style="min-height:32px;padding:7px 12px;font-size:0.72rem" onclick={deselectAllSplit}><i data-lucide="square"></i> Ninguna</button>
    </div>
    <div class="pdf-thumb-grid" id="pdf-split-grid"></div>
    <label for="pdf-split-pages" style="margin-top:14px">O escribe rangos para añadir a la selección</label>
    <input type="text" id="pdf-split-pages" placeholder="1-3, 5, 8-10" onchange={applySplitRange}>
    <div class="btn-row" style="margin-top:14px">
      <button class="btn" onclick={splitPDF}><i data-lucide="scissors"></i> Extraer páginas</button>
      <button class="btn btn-green" id="pdf-split-download" style="display:none" onclick={downloadSplitPDF}><i data-lucide="download"></i> Descargar</button>
    </div>
    <div class="output" id="pdf-split-output"></div>
  </div>
</div>
{/if}

{#if activeTool.id === 'pdf-img2pdf'}
<div class="tool-panel" id="panel-pdf-img2pdf">
  <div class="panel-header">
    <h2><i data-lucide="image-plus"></i> Imágenes a PDF</h2>
    <p>Crea un PDF a partir de imágenes JPG o PNG</p>
  </div>
  <label for="pdf-img2pdf-files">Selecciona las imágenes</label>
  <input type="file" id="pdf-img2pdf-files" accept="image/*" multiple onchange={img2pdfList}>
  <ul id="pdf-img2pdf-list" style="margin-top:10px;font-size:0.85rem;color:var(--muted);list-style:none;padding:0"></ul>
  <div class="btn-row">
    <button class="btn" onclick={imagesToPDF}><i data-lucide="image-plus"></i> Crear PDF</button>
    <button class="btn btn-green" id="pdf-img2pdf-download" style="display:none" onclick={downloadImg2PDF}><i data-lucide="download"></i> Descargar</button>
  </div>
  <div class="output" id="pdf-img2pdf-output"></div>
</div>
{/if}

{#if activeTool.id === 'pdf-pdf2img'}
<div class="tool-panel" id="panel-pdf-pdf2img">
  <div class="panel-header">
    <h2><i data-lucide="images"></i> PDF a Imágenes</h2>
    <p>Convierte cada página de un PDF a imagen PNG descargable</p>
  </div>
  <label for="pdf-pdf2img-file">Selecciona un PDF</label>
  <input type="file" id="pdf-pdf2img-file" accept=".pdf">
  <label for="pdf-pdf2img-scale">DPI / Escala</label>
  <select id="pdf-pdf2img-scale">
    <option value="1">72 DPI (rápido)</option>
    <option value="1.5" selected>108 DPI (medio)</option>
    <option value="2">144 DPI (alto)</option>
    <option value="3">216 DPI (muy alto)</option>
  </select>
  <div class="progress" id="pdf-pdf2img-progress"><div class="progress-bar" id="pdf-pdf2img-progress-bar"></div></div>
  <div class="btn-row">
    <button class="btn" onclick={pdfToImages}><i data-lucide="images"></i> Convertir</button>
  </div>
  <div class="output" id="pdf-pdf2img-output"></div>
  <div id="pdf-pdf2img-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin-top:14px"></div>
</div>
{/if}

{#if activeTool.id === 'pdf-text'}
<div class="tool-panel" id="panel-pdf-text">
  <div class="panel-header">
    <h2><i data-lucide="type"></i> Extraer Texto</h2>
    <p>Extrae el texto plano de un PDF para copiarlo o editarlo</p>
  </div>
  <label for="pdf-text-file">Selecciona un PDF</label>
  <input type="file" id="pdf-text-file" accept=".pdf">
  <div class="progress" id="pdf-text-progress"><div class="progress-bar" id="pdf-text-progress-bar"></div></div>
  <div class="btn-row">
    <button class="btn" onclick={extractPDFText}><i data-lucide="type"></i> Extraer texto</button>
    <button class="btn btn-green" id="pdf-text-copy" style="display:none" onclick={copyExtractedText}><i data-lucide="copy"></i> Copiar</button>
  </div>
  <textarea id="pdf-text-output" readonly style="margin-top:10px;min-height:200px;font-family:inherit" placeholder="El texto extraído aparecerá aquí..."></textarea>
</div>
{/if}
