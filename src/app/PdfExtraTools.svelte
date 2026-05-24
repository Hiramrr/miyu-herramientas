<script>
  import { tick } from 'svelte';

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
  let organizePageCount = 0;

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

  let rotateFile;
  let rotateAngle = 90;
  let rotateAllPages = true;
  let rotatePages = '';
  let rotateOutput = null;
  let rotateInfo = '';

  let removeFile;
  let removePages = '';
  let removeOutput = null;
  let removeInfo = '';

  let signPreviewImg = '';
  let signCanvas;
  let signPreviewPage = 1;
  let signPreviewTotal = 1;
  let signPreviewError = false;

  let watermarkPreviewImg = '';
  let watermarkCanvas;
  let watermarkPreviewError = false;
  let numberPreviewImg = '';
  let numberCanvas;
  let numberPreviewError = false;
  let cropPreviewImg = '';
  let cropCanvas;
  let cropPreviewError = false;

  let rotatePreviewImg = '';
  let rotateCanvas;
  let rotatePreviewError = false;
  let rotatePreviewTotal = 1;
  let rotatePreviewPage = 1;

  let removePreviewImg = '';
  let removeCanvas;
  let removePreviewError = false;
  let removePreviewTotal = 1;
  let removePreviewPage = 1;

  let pdfWorkerReady = false;
  function initPdfWorker() {
    if (pdfWorkerReady || !window.pdfjsLib) return;
    try {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      pdfWorkerReady = true;
    } catch (e) {}
  }

  let signFileInput;
  let cropFileInput;
  let numberFileInput;
  let watermarkFileInput;
  let organizeFileInput;
  let metadataFileInput;
  let rotateFileInput;
  let removeFileInput;

  let cropDragHandle = null;
  let cropDragStart = { x: 0, y: 0, top: 0, right: 0, bottom: 0, left: 0 };
  let cropPdfW = 0;
  let cropPdfH = 0;
  let cropBaseImage = null;
  let cropDrawPending = false;

  $: organizeDownloadName = fileName(organizeFile, 'ordenado.pdf');
  $: pageNumberDownloadName = fileName(pageNumberFile, 'numerado.pdf');
  $: watermarkDownloadName = fileName(watermarkFile, 'marca-de-agua.pdf');
  $: signDownloadName = fileName(signFile, 'firmado.pdf');
  $: cropDownloadName = fileName(cropFile, 'recortado.pdf');
  $: metadataDownloadName = fileName(metadataFile, 'metadatos.pdf');
  $: rotateDownloadName = fileName(rotateFile, 'rotado.pdf');
  $: removeDownloadName = fileName(removeFile, 'sin_paginas.pdf');

  function fileName(file, suffix) {
    if (!file) return suffix;
    return `${file.name.replace(/\.pdf$/i, '')}-${suffix}`;
  }

  function getPdfLib() {
    if (!window.PDFLib) throw new Error('PDFLib no está disponible.');
    return window.PDFLib;
  }

  async function renderPdfPage(file, targetCanvas, pageNum) {
    if (!file || !targetCanvas) return '';
    if (!window.pdfjsLib) return '';
    initPdfWorker();
    try {
      const buf = await file.arrayBuffer();
      const loadingTask = window.pdfjsLib.getDocument({ data: buf, disableAutoFetch: true, disableStream: true });
      const pdf = await Promise.race([
        loadingTask.promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 12000))
      ]);
      const total = pdf.numPages;
      const num = Math.min(Math.max(pageNum, 1), total);
      const page = await pdf.getPage(num);
      const viewport = page.getViewport({ scale: 1 });
      const scale = Math.min(400 / viewport.width, 520 / viewport.height, 1.8);
      const scaled = page.getViewport({ scale });
      targetCanvas.width = scaled.width;
      targetCanvas.height = scaled.height;
      const ctx = targetCanvas.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, scaled.width, scaled.height);
      await page.render({ canvasContext: ctx, viewport: scaled }).promise;
      return { url: targetCanvas.toDataURL('image/png'), total, pdfW: viewport.width, pdfH: viewport.height };
    } catch (e) {
      console.error('Preview error:', e);
      return '';
    }
  }

  async function updateSignPreview() {
    if (!signFile || !signCanvas) return;
    const pageNum = signPage === 'first' ? 1 : signPage === 'last' ? signPreviewTotal || 999 : 1;
    const result = await renderPdfPage(signFile, signCanvas, pageNum);
    if (result) {
      signPreviewError = false;
      signPreviewTotal = result.total;
      signPreviewPage = Math.min(pageNum, result.total);
      signPreviewImg = result.url;
      await tick();
      drawSignOverlay();
    } else {
      signPreviewError = true;
    }
  }

  function drawSignOverlay() {
    if (!signCanvas || !signPreviewImg) return;
    const ctx = signCanvas.getContext('2d');
    const w = signCanvas.width;
    const h = signCanvas.height;
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      const size = Number(signSize);
      const margin = 42;
      const scale = w / (w / (Math.min(400 / (w / (w / 1)), 1)));
      const boxW = signMode === 'image' ? (signImageBytes ? size : 80) : (size / 3) * (signText.length * 0.65);
      const boxH = signMode === 'image' ? (signImageBytes ? size : 50) : size / 3;
      let x, y;
      if (signPosition.endsWith('left')) x = margin;
      else if (signPosition.endsWith('right')) x = w - margin - boxW;
      else x = (w - boxW) / 2;
      if (signPosition.startsWith('top')) y = margin;
      else if (signPosition.startsWith('bottom')) y = h - margin - boxH;
      else y = (h - boxH) / 2;
      ctx.strokeStyle = signColor;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 3]);
      ctx.strokeRect(x, y, boxW, boxH);
      ctx.setLineDash([]);
      ctx.fillStyle = signColor;
      ctx.globalAlpha = 0.14;
      ctx.fillRect(x, y, boxW, boxH);
      ctx.globalAlpha = 1;
      ctx.font = 'bold 11px monospace';
      ctx.fillStyle = signColor;
      ctx.fillText(signMode === 'text' ? signText : 'Firma (img)', x + 4, y + 16);
    };
    img.src = signPreviewImg;
  }

  $: if (signFile && signCanvas) { void signPage, void signPosition, void signSize, void signMode, void signText, void signColor, void signImageBytes; updateSignPreview(); }

  async function updateWatermarkPreview() {
    if (!watermarkFile || !watermarkCanvas) return;
    const result = await renderPdfPage(watermarkFile, watermarkCanvas, 1);
    if (result) {
      watermarkPreviewError = false;
      watermarkPreviewImg = result.url;
      await tick();
      drawWatermarkOverlay();
    } else {
      watermarkPreviewError = true;
    }
  }

  function drawWatermarkOverlay() {
    if (!watermarkCanvas || !watermarkPreviewImg) return;
    const ctx = watermarkCanvas.getContext('2d');
    const w = watermarkCanvas.width;
    const h = watermarkCanvas.height;
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      ctx.save();
      const cx = w / 2;
      const cy = h / 2;
      ctx.translate(cx, cy);
      ctx.rotate((Number(watermarkRotation) * Math.PI) / 180);
      ctx.font = `bold ${Number(watermarkSize) * 0.45}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const color = watermarkColor;
      ctx.fillStyle = color;
      ctx.globalAlpha = Math.max(0.12, Number(watermarkOpacity) * 0.7);
      ctx.fillText(watermarkText, 0, 0);
      ctx.restore();
    };
    img.src = watermarkPreviewImg;
  }

  $: if (watermarkFile && watermarkCanvas) { void watermarkText, void watermarkPosition, void watermarkSize, void watermarkRotation, void watermarkOpacity, void watermarkColor; updateWatermarkPreview(); }

  async function updateNumberPreview() {
    if (!pageNumberFile || !numberCanvas) return;
    const result = await renderPdfPage(pageNumberFile, numberCanvas, 1);
    if (result) {
      numberPreviewError = false;
      numberPreviewImg = result.url;
      await tick();
      drawNumberOverlay();
    } else {
      numberPreviewError = true;
    }
  }

  function drawNumberOverlay() {
    if (!numberCanvas || !numberPreviewImg) return;
    const ctx = numberCanvas.getContext('2d');
    const w = numberCanvas.width;
    const h = numberCanvas.height;
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      const margin = 34;
      const label = pageNumberText.replaceAll('{n}', String(pageNumberStart)).replaceAll('{total}', 'N');
      ctx.font = `bold ${Number(pageNumberSize) * 0.5}px sans-serif`;
      const tw = ctx.measureText(label).width;
      let x, y;
      if (pageNumberPosition.endsWith('left')) x = margin;
      else if (pageNumberPosition.endsWith('right')) x = w - margin - tw;
      else x = (w - tw) / 2;
      if (pageNumberPosition.startsWith('top')) y = margin + Number(pageNumberSize) * 0.5;
      else y = h - margin;
      ctx.fillStyle = pageNumberColor;
      ctx.globalAlpha = 0.8;
      ctx.fillText(label, x, y);
      ctx.globalAlpha = 1;
    };
    img.src = numberPreviewImg;
  }

  $: if (pageNumberFile && numberCanvas) { void pageNumberText, void pageNumberPosition, void pageNumberStart, void pageNumberSize, void pageNumberColor; updateNumberPreview(); }

  async function updateRotatePreview() {
    if (!rotateFile || !rotateCanvas) return;
    const pageNum = rotateAllPages ? 1 : (rotatePreviewPage || 1);
    const result = await renderPdfPage(rotateFile, rotateCanvas, pageNum);
    if (result) {
      rotatePreviewError = false;
      rotatePreviewTotal = result.total;
      rotatePreviewPage = Math.min(pageNum, result.total);
      rotatePreviewImg = result.url;
      await tick();
      drawRotateOverlay();
    } else {
      rotatePreviewError = true;
    }
  }

  function drawRotateOverlay() {
    if (!rotateCanvas || !rotatePreviewImg) return;
    const ctx = rotateCanvas.getContext('2d');
    const w = rotateCanvas.width;
    const h = rotateCanvas.height;
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, w, h);
      const angle = Number(rotateAngle);
      const rad = (angle * Math.PI) / 180;
      const absSin = Math.abs(Math.sin(rad));
      const absCos = Math.abs(Math.cos(rad));
      const rw = w * absCos + h * absSin;
      const rh = w * absSin + h * absCos;
      const scaleX = rw > 0 ? w / rw : 1;
      const scaleY = rh > 0 ? h / rh : 1;
      const scale = Math.min(scaleX, scaleY);
      ctx.save();
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, w, h);
      ctx.translate(w / 2, h / 2);
      ctx.rotate(rad);
      ctx.scale(scale, scale);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.strokeRect(2, 2, w - 4, h - 4);
      ctx.restore();
    };
    img.src = rotatePreviewImg;
  }

  $: if (rotateFile && rotateCanvas) { void rotateAngle, void rotateAllPages, void rotatePreviewPage; updateRotatePreview(); }

  async function updateRemovePreview() {
    if (!removeFile || !removeCanvas) return;
    const result = await renderPdfPage(removeFile, removeCanvas, 1);
    if (result) {
      removePreviewError = false;
      removePreviewTotal = result.total;
      removePreviewPage = 1;
      removePreviewImg = result.url;
      await tick();
      drawRemoveOverlay();
    } else {
      removePreviewError = true;
    }
  }

  function drawRemoveOverlay() {
    if (!removeCanvas || !removePreviewImg) return;
    const ctx = removeCanvas.getContext('2d');
    const w = removeCanvas.width;
    const h = removeCanvas.height;
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      const pages = parsePages(removePages, removePreviewTotal);
      if (pages.length > 0 && pages.includes(1)) {
        ctx.fillStyle = 'rgba(220,50,50,0.28)';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'center';
        const label = `Página 1 — eliminada`;
        ctx.fillText(label, w / 2, h / 2);
      }
    };
    img.src = removePreviewImg;
  }

  $: if (removeFile && removeCanvas) { void removePages; updateRemovePreview(); }

  function parsePages(value, total) {
    const result = new Set();
    const chunks = (value || '').split(',').map((part) => part.trim()).filter(Boolean);
    for (const chunk of chunks) {
      const range = chunk.match(/^(\d+)\s*-\s*(\d+)$/);
      if (range) {
        const start = Number(range[1]);
        const end = Number(range[2]);
        const step = start <= end ? 1 : -1;
        for (let page = start; step > 0 ? page <= end : page >= end; page += step) {
          if (page >= 1 && page <= total) result.add(page);
        }
      } else {
        const page = Number(chunk);
        if (page >= 1 && page <= total) result.add(page);
      }
    }
    return Array.from(result).sort((a, b) => a - b);
  }

  async function rotatePdf() {
    try {
      const { degrees } = getPdfLib();
      const src = await readPdf(rotateFile);
      const total = src.getPageCount();
      const angle = Number(rotateAngle) || 90;
      let pagesToRotate = [];
      if (!rotateAllPages) {
        pagesToRotate = parsePages(rotatePages, total);
        if (!pagesToRotate.length) throw new Error('Especifica al menos una página válida.');
      }

      const { PDFDocument } = getPdfLib();
      const out = await PDFDocument.create();
      const copied = await out.copyPages(src, src.getPageIndices());
      for (let i = 0; i < copied.length; i++) {
        const p = copied[i];
        if (rotateAllPages || pagesToRotate.includes(i + 1)) {
          const curr = p.getRotation().degrees;
          p.setRotation(degrees(curr + angle));
        }
        out.addPage(p);
      }
      const bytes = await out.save();
      rotateOutput = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
      const count = rotateAllPages ? total : pagesToRotate.length;
      rotateInfo = `Páginas rotadas: ${count} / ${total}.`;
    } catch (error) {
      rotateInfo = error.message || 'No se pudo rotar el PDF.';
    }
  }

  async function removePdfPages() {
    try {
      const src = await readPdf(removeFile);
      const total = src.getPageCount();
      const toRemove = parsePages(removePages, total);
      if (!toRemove.length) throw new Error('Especifica al menos una página válida para eliminar.');

      const keep = [];
      for (let i = 1; i <= total; i++) {
        if (!toRemove.includes(i)) keep.push(i - 1);
      }
      if (!keep.length) throw new Error('No puedes eliminar todas las páginas.');

      const { PDFDocument } = getPdfLib();
      const out = await PDFDocument.create();
      const copied = await out.copyPages(src, keep);
      for (const p of copied) out.addPage(p);
      const bytes = await out.save();
      removeOutput = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
      removeInfo = `Páginas eliminadas: ${toRemove.length}. Páginas restantes: ${keep.length}.`;
    } catch (error) {
      removeInfo = error.message || 'No se pudieron eliminar las páginas.';
    }
  }

  async function updateCropPreview() {
    if (!cropFile || !cropCanvas) return;
    const result = await renderPdfPage(cropFile, cropCanvas, 1);
    if (result) {
      cropPreviewError = false;
      cropPreviewImg = result.url;
      cropPdfW = result.pdfW;
      cropPdfH = result.pdfH;
      await tick();
      drawCropOverlay();
    } else {
      cropPreviewError = true;
    }
  }

  function getCropScale() {
    if (!cropCanvas || !cropPdfW) return 1;
    return cropCanvas.width / cropPdfW;
  }

  function drawCropOverlay() {
    if (!cropCanvas || !cropPreviewImg) return;
    if (cropDrawPending) return;
    cropDrawPending = true;
    requestAnimationFrame(() => {
      cropDrawPending = false;
      const ctx = cropCanvas.getContext('2d');
      const w = cropCanvas.width;
      const h = cropCanvas.height;
      const top = Number(cropTop) || 0;
      const right = Number(cropRight) || 0;
      const bottom = Number(cropBottom) || 0;
      const left = Number(cropLeft) || 0;

      function paint() {
        ctx.clearRect(0, 0, w, h);
        if (cropBaseImage) ctx.drawImage(cropBaseImage, 0, 0, w, h);
        ctx.fillStyle = 'rgba(0,0,0,0.32)';
        if (top > 0) ctx.fillRect(0, 0, w, top);
        if (bottom > 0) ctx.fillRect(0, h - bottom, w, bottom);
        if (left > 0) ctx.fillRect(0, 0, left, h);
        if (right > 0) ctx.fillRect(w - right, 0, right, h);
        ctx.strokeStyle = '#e05050';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 4]);
        const cx = left;
        const cy = top;
        const cw = w - left - right;
        const ch = h - top - bottom;
        ctx.strokeRect(cx, cy, Math.max(0, cw), Math.max(0, ch));
        ctx.setLineDash([]);
        const hs = 7;
        const handles = [
          { x: cx, y: cy }, { x: cx + cw / 2, y: cy },
          { x: cx + cw, y: cy }, { x: cx + cw, y: cy + ch / 2 },
          { x: cx + cw, y: cy + ch }, { x: cx + cw / 2, y: cy + ch },
          { x: cx, y: cy + ch }, { x: cx, y: cy + ch / 2 },
        ];
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#e05050';
        ctx.lineWidth = 1.5;
        for (const hnd of handles) {
          ctx.fillRect(hnd.x - hs / 2, hnd.y - hs / 2, hs, hs);
          ctx.strokeRect(hnd.x - hs / 2, hnd.y - hs / 2, hs, hs);
        }
      }

      if (!cropBaseImage || cropBaseImage.src !== cropPreviewImg) {
        cropBaseImage = new Image();
        cropBaseImage.onload = () => { paint(); };
        cropBaseImage.src = cropPreviewImg;
      } else {
        paint();
      }
    });
  }

  function getDragZone(canvasX, canvasY) {
    if (!cropCanvas) return null;
    const w = cropCanvas.width;
    const h = cropCanvas.height;
    const t = Number(cropTop) || 0;
    const r = Number(cropRight) || 0;
    const b = Number(cropBottom) || 0;
    const l = Number(cropLeft) || 0;
    const cx = l, cy = t, cw = w - l - r, ch = h - t - b;
    const near = 14;
    const corners = [
      { id: 'tl', x: cx, y: cy },
      { id: 'tr', x: cx + cw, y: cy },
      { id: 'bl', x: cx, y: cy + ch },
      { id: 'br', x: cx + cw, y: cy + ch },
    ];
    for (const c of corners) {
      if (Math.abs(canvasX - c.x) <= near && Math.abs(canvasY - c.y) <= near) return c.id;
    }
    if (Math.abs(canvasY - cy) <= near && canvasX > cx + near && canvasX < cx + cw - near) return 'top';
    if (Math.abs(canvasY - (cy + ch)) <= near && canvasX > cx + near && canvasX < cx + cw - near) return 'bottom';
    if (Math.abs(canvasX - cx) <= near && canvasY > cy + near && canvasY < cy + ch - near) return 'left';
    if (Math.abs(canvasX - (cx + cw)) <= near && canvasY > cy + near && canvasY < cy + ch - near) return 'right';
    if (canvasX > cx && canvasX < cx + cw && canvasY > cy && canvasY < cy + ch) return 'move';
    if (canvasY < cy + near) return 'top';
    if (canvasY > cy + ch - near) return 'bottom';
    if (canvasX < cx + near) return 'left';
    if (canvasX > cx + cw - near) return 'right';
    return null;
  }

  function onCropPointerDown(e) {
    if (!cropCanvas) return;
    const rect = cropCanvas.getBoundingClientRect();
    const sx = cropCanvas.width / rect.width;
    const sy = cropCanvas.height / rect.height;
    const x = (e.clientX - rect.left) * sx;
    const y = (e.clientY - rect.top) * sy;
    const zone = getDragZone(x, y);
    if (zone) {
      cropDragHandle = zone;
      cropDragStart = { x, y, top: Number(cropTop) || 0, right: Number(cropRight) || 0, bottom: Number(cropBottom) || 0, left: Number(cropLeft) || 0 };
      e.preventDefault();
      cropCanvas.setPointerCapture(e.pointerId);
    }
  }

  function onCropPointerMove(e) {
    if (!cropDragHandle || !cropCanvas) return;
    const rect = cropCanvas.getBoundingClientRect();
    const sx = cropCanvas.width / rect.width;
    const sy = cropCanvas.height / rect.height;
    const x = (e.clientX - rect.left) * sx;
    const y = (e.clientY - rect.top) * sy;
    const dx = x - cropDragStart.x;
    const dy = y - cropDragStart.y;
    const maxW = cropCanvas.width - 40;
    const maxH = cropCanvas.height - 40;
    let nt = cropDragStart.top, nr = cropDragStart.right, nb = cropDragStart.bottom, nl = cropDragStart.left;
    const cap = (v, opp, mx) => Math.max(0, Math.min(v, mx - opp));
    if (cropDragHandle === 'top') nt = cap(cropDragStart.top + dy, nb, maxH);
    else if (cropDragHandle === 'bottom') nb = cap(cropDragStart.bottom - dy, nt, maxH);
    else if (cropDragHandle === 'left') nl = cap(cropDragStart.left + dx, nr, maxW);
    else if (cropDragHandle === 'right') nr = cap(cropDragStart.right - dx, nl, maxW);
    else if (cropDragHandle === 'tl') { nt = cap(cropDragStart.top + dy, nb, maxH); nl = cap(cropDragStart.left + dx, nr, maxW); }
    else if (cropDragHandle === 'tr') { nt = cap(cropDragStart.top + dy, nb, maxH); nr = cap(cropDragStart.right - dx, nl, maxW); }
    else if (cropDragHandle === 'bl') { nb = cap(cropDragStart.bottom - dy, nt, maxH); nl = cap(cropDragStart.left + dx, nr, maxW); }
    else if (cropDragHandle === 'br') { nb = cap(cropDragStart.bottom - dy, nt, maxH); nr = cap(cropDragStart.right - dx, nl, maxW); }
    else if (cropDragHandle === 'move') {
      nt = cap(cropDragStart.top + dy, nb, maxH);
      nb = cap(cropDragStart.bottom - dy, nt, maxH);
      nl = cap(cropDragStart.left + dx, nr, maxW);
      nr = cap(cropDragStart.right - dx, nl, maxW);
    }
    cropTop = Math.round(nt);
    cropRight = Math.round(nr);
    cropBottom = Math.round(nb);
    cropLeft = Math.round(nl);
    drawCropOverlay();
  }

  function onCropPointerUp(e) {
    if (cropDragHandle) {
      cropDragHandle = null;
      cropCanvas?.releasePointerCapture?.(e.pointerId);
    }
  }

  $: if (cropFile && cropCanvas) { void cropFile; updateCropPreview(); }
  $: if (cropPreviewImg && cropCanvas) { void cropTop, void cropRight, void cropBottom, void cropLeft; drawCropOverlay(); }

  function setFile(event, kind) {
    const file = event.currentTarget.files?.[0];
    if (kind === 'organize') {
      organizeFile = file;
      organizeOutput = null;
      organizeInfo = file ? 'PDF cargado. Escribe un orden de páginas o usa una acción rápida.' : '';
      organizeOrder = '';
      organizePageCount = 0;
      if (file) countOrganizePages(file);
    }
    if (kind === 'numbers') {
      pageNumberFile = file;
      pageNumberOutput = null;
      pageNumberInfo = file ? 'PDF listo para numerar.' : '';
      numberPreviewImg = '';
      numberPreviewError = false;
    }
    if (kind === 'watermark') {
      watermarkFile = file;
      watermarkOutput = null;
      watermarkInfo = file ? 'PDF listo para marca de agua.' : '';
      watermarkPreviewImg = '';
      watermarkPreviewError = false;
    }
    if (kind === 'sign') {
      signFile = file;
      signOutput = null;
      signInfo = file ? 'PDF listo para firma visible.' : '';
      signPreviewImg = '';
      signPreviewTotal = 1;
      signPreviewError = false;
    }
    if (kind === 'crop') {
      cropFile = file;
      cropOutput = null;
      cropInfo = file ? 'PDF listo para recortar.' : '';
      cropPreviewImg = '';
      cropPreviewError = false;
      cropPdfW = 0;
      cropPdfH = 0;
      cropBaseImage = null;
    }
    if (kind === 'metadata') {
      metadataFile = file;
      metadataOutput = null;
      metadataInfo = file ? 'PDF listo para editar metadatos.' : '';
    }
    if (kind === 'rotate') {
      rotateFile = file;
      rotateOutput = null;
      rotateInfo = file ? 'PDF listo para rotar.' : '';
      rotatePreviewImg = '';
      rotatePreviewError = false;
      rotatePreviewTotal = 1;
      rotatePreviewPage = 1;
    }
    if (kind === 'remove') {
      removeFile = file;
      removeOutput = null;
      removeInfo = file ? 'PDF listo para eliminar páginas.' : '';
      removePreviewImg = '';
      removePreviewError = false;
      removePreviewTotal = 1;
      removePreviewPage = 1;
    }
  }

  function clearFile(kind, inputRef) {
    if (kind === 'organize') { organizeFile = null; organizeOutput = null; organizeInfo = ''; organizeOrder = ''; organizePageCount = 0; }
    if (kind === 'numbers') { pageNumberFile = null; pageNumberOutput = null; pageNumberInfo = ''; numberPreviewImg = ''; numberPreviewError = false; }
    if (kind === 'watermark') { watermarkFile = null; watermarkOutput = null; watermarkInfo = ''; watermarkPreviewImg = ''; watermarkPreviewError = false; }
    if (kind === 'sign') { signFile = null; signOutput = null; signInfo = ''; signPreviewImg = ''; signPreviewTotal = 1; signPreviewError = false; signImageFile = null; signImageBytes = null; }
    if (kind === 'crop') { cropFile = null; cropOutput = null; cropInfo = ''; cropPreviewImg = ''; cropPreviewError = false; cropPdfW = 0; cropPdfH = 0; cropBaseImage = null; }
    if (kind === 'metadata') { metadataFile = null; metadataOutput = null; metadataInfo = ''; }
    if (kind === 'rotate') { rotateFile = null; rotateOutput = null; rotateInfo = ''; rotatePreviewImg = ''; rotatePreviewError = false; rotatePreviewTotal = 1; rotatePreviewPage = 1; }
    if (kind === 'remove') { removeFile = null; removeOutput = null; removeInfo = ''; removePreviewImg = ''; removePreviewError = false; removePreviewTotal = 1; removePreviewPage = 1; }
    if (inputRef) inputRef.value = '';
  }

  async function countOrganizePages(file) {
    if (!window.pdfjsLib) return;
    try {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      const pdf = await window.pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
      organizePageCount = pdf.numPages;
    } catch (e) {
      organizePageCount = 0;
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
      const srcPdf = await readPdf(cropFile);
      const pages = srcPdf.getPages();
      const { PDFDocument } = getPdfLib();
      const outPdf = await PDFDocument.create();

      for (const page of pages) {
        const { width, height } = page.getSize();
        const left = Number(cropLeft) || 0;
        const right = Number(cropRight) || 0;
        const top = Number(cropTop) || 0;
        const bottom = Number(cropBottom) || 0;
        const cropWidth = width - left - right;
        const cropHeight = height - top - bottom;
        if (cropWidth <= 20 || cropHeight <= 20) throw new Error('Los márgenes son demasiado grandes para el tamaño del PDF.');

        const [embedded] = await outPdf.embedPages([page]);
        const newPage = outPdf.addPage([cropWidth, cropHeight]);
        newPage.drawPage(embedded, {
          x: -left,
          y: -bottom,
          width,
          height,
        });
      }

      const bytes = await outPdf.save();
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
  <input bind:this={organizeFileInput} class="image-convert-file" type="file" accept=".pdf" onchange={(event) => setFile(event, 'organize')}>

  {#if !organizeFile}
    <button class="image-convert-dropzone" type="button" onclick={() => organizeFileInput?.click()}>
      <i data-lucide="upload-cloud"></i>
      <strong>Seleccionar PDF</strong>
      <span>Arrastra o haz clic para cargar un documento</span>
    </button>
  {:else}
    <div class="pdf-file-bar">
      <div class="pdf-file-bar-info">
        <i data-lucide="file-text"></i>
        <span>{organizeFile.name} — {organizePageCount} páginas</span>
      </div>
      <button class="btn btn-quiet" type="button" onclick={() => clearFile('organize', organizeFileInput)}>
        <i data-lucide="x"></i> Limpiar
      </button>
    </div>

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
  {/if}
  <div class="output">{organizeInfo || 'Puedes repetir páginas y usar rangos ascendentes o descendentes.'}</div>
</div>

<div class="tool-panel" id="panel-pdf-page-numbers">
  <div class="panel-header">
    <h2><i data-lucide="list-plus"></i> Números de página</h2>
    <p>Agrega numeración configurable a todas las páginas del PDF</p>
  </div>
  <input bind:this={numberFileInput} class="image-convert-file" type="file" accept=".pdf" onchange={(event) => setFile(event, 'numbers')}>

  {#if !pageNumberFile}
    <button class="image-convert-dropzone" type="button" onclick={() => numberFileInput?.click()}>
      <i data-lucide="upload-cloud"></i>
      <strong>Seleccionar PDF</strong>
      <span>Arrastra o haz clic para cargar un documento</span>
    </button>
  {:else}
    <div class="pdf-file-bar">
      <div class="pdf-file-bar-info">
        <i data-lucide="file-text"></i>
        <span>{pageNumberFile.name}</span>
      </div>
      <button class="btn btn-quiet" type="button" onclick={() => clearFile('numbers', numberFileInput)}>
        <i data-lucide="x"></i> Limpiar
      </button>
    </div>

    <div class="pdf-preview-grid">
      <div class="pdf-preview-stage">
        <canvas bind:this={numberCanvas} class="pdf-preview-canvas" class:hidden={!numberPreviewImg}></canvas>
        {#if numberPreviewError}
          <div class="pdf-preview-empty pdf-preview-error"><i data-lucide="alert-triangle"></i><span>No se pudo generar la vista previa</span></div>
        {:else if !numberPreviewImg && pageNumberFile}
          <div class="pdf-preview-loading">Cargando vista previa...</div>
        {:else if !numberPreviewImg && !pageNumberFile}
          <div class="pdf-preview-empty"><i data-lucide="file-text"></i><span>La vista previa aparecerá aquí</span></div>
        {/if}
      </div>
      <div class="pdf-extra-grid pdf-preview-controls">
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
        <div class="btn-row">
          <button class="btn" type="button" onclick={addPageNumbers}><i data-lucide="list-plus"></i> Agregar números</button>
          {#if pageNumberOutput}
            <button class="btn btn-green" type="button" onclick={() => download(pageNumberOutput, pageNumberDownloadName)}><i data-lucide="download"></i> Descargar</button>
          {/if}
        </div>
      </div>
    </div>
  {/if}
  <div class="output">{pageNumberInfo || 'Usa {n} para el número actual y {total} para el total de páginas.'}</div>
</div>

<div class="tool-panel" id="panel-pdf-sign">
  <div class="panel-header">
    <h2><i data-lucide="signature"></i> Firmar PDF</h2>
    <p>Agrega una firma visible con texto o imagen; no es una firma digital criptográfica</p>
  </div>

  <input bind:this={signFileInput} class="image-convert-file" type="file" accept=".pdf" onchange={(event) => setFile(event, 'sign')}>

  {#if !signFile}
    <button class="image-convert-dropzone" type="button" onclick={() => signFileInput?.click()}>
      <i data-lucide="upload-cloud"></i>
      <strong>Seleccionar PDF</strong>
      <span>Arrastra o haz clic para cargar un documento</span>
    </button>
  {:else}
    <div class="pdf-file-bar">
      <div class="pdf-file-bar-info">
        <i data-lucide="file-text"></i>
        <span>{signFile.name}</span>
      </div>
      <button class="btn btn-quiet" type="button" onclick={() => clearFile('sign', signFileInput)}>
        <i data-lucide="x"></i> Limpiar
      </button>
    </div>

    <div class="pdf-preview-grid">
      <div class="pdf-preview-stage">
        {#if signPreviewImg}
          <div class="pdf-preview-label">Vista previa — {signPage === 'first' ? 'primera' : signPage === 'last' ? 'última' : 'todas'} página ({signPreviewPage} de {signPreviewTotal})</div>
        {/if}
        <canvas bind:this={signCanvas} class="pdf-preview-canvas" class:hidden={!signPreviewImg}></canvas>
        {#if signPreviewError}
          <div class="pdf-preview-empty pdf-preview-error"><i data-lucide="alert-triangle"></i><span>No se pudo generar la vista previa</span></div>
        {:else if !signPreviewImg && signFile}
          <div class="pdf-preview-loading">Cargando vista previa...</div>
        {:else if !signPreviewImg && !signFile}
          <div class="pdf-preview-empty"><i data-lucide="file-text"></i><span>Carga un PDF para ver la vista previa</span></div>
        {/if}
      </div>
      <div class="pdf-extra-grid pdf-preview-controls">
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
        <div class="btn-row">
          <button class="btn" type="button" onclick={addSignature}><i data-lucide="signature"></i> Aplicar firma</button>
          {#if signOutput}
            <button class="btn btn-green" type="button" onclick={() => download(signOutput, signDownloadName)}><i data-lucide="download"></i> Descargar</button>
          {/if}
        </div>
      </div>
    </div>
  {/if}

  <div class="output">{signInfo || 'La firma queda visible sobre el PDF, procesada localmente.'}</div>
</div>

<div class="tool-panel" id="panel-pdf-crop">
  <div class="panel-header">
    <h2><i data-lucide="crop"></i> Recortar PDF</h2>
    <p>Recorta márgenes visuales de todas las páginas modificando el área visible</p>
  </div>
  <input bind:this={cropFileInput} class="image-convert-file" type="file" accept=".pdf" onchange={(event) => setFile(event, 'crop')}>

  {#if !cropFile}
    <button class="image-convert-dropzone" type="button" onclick={() => cropFileInput?.click()}>
      <i data-lucide="upload-cloud"></i>
      <strong>Seleccionar PDF</strong>
      <span>Arrastra o haz clic para cargar un documento</span>
    </button>
  {:else}
    <div class="pdf-file-bar">
      <div class="pdf-file-bar-info">
        <i data-lucide="file-text"></i>
        <span>{cropFile.name}</span>
      </div>
      <button class="btn btn-quiet" type="button" onclick={() => clearFile('crop', cropFileInput)}>
        <i data-lucide="x"></i> Limpiar
      </button>
    </div>

    <div class="pdf-preview-grid">
      <div class="pdf-preview-stage">
        <canvas bind:this={cropCanvas} class="pdf-preview-canvas" class:hidden={!cropPreviewImg} style="touch-action:none" onpointerdown={onCropPointerDown} onpointermove={onCropPointerMove} onpointerup={onCropPointerUp} onpointerleave={onCropPointerUp}></canvas>
        {#if cropPreviewError}
          <div class="pdf-preview-empty pdf-preview-error"><i data-lucide="alert-triangle"></i><span>No se pudo generar la vista previa</span></div>
        {:else if !cropPreviewImg && cropFile}
          <div class="pdf-preview-loading">Cargando vista previa...</div>
        {:else if !cropPreviewImg && !cropFile}
          <div class="pdf-preview-empty"><i data-lucide="file-text"></i><span>Carga un PDF para ver la vista previa</span></div>
        {/if}
      </div>
      <div class="pdf-extra-grid pdf-preview-controls">
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
        <div class="btn-row">
          <button class="btn" type="button" onclick={cropPdf}><i data-lucide="crop"></i> Recortar</button>
          {#if cropOutput}
            <button class="btn btn-green" type="button" onclick={() => download(cropOutput, cropDownloadName)}><i data-lucide="download"></i> Descargar</button>
          {/if}
        </div>
      </div>
    </div>
  {/if}
  <div class="output">{cropInfo || '1 punto equivale a 1/72 de pulgada. El contenido no se sube a internet.'}</div>
</div>

<div class="tool-panel" id="panel-pdf-watermark">
  <div class="panel-header">
    <h2><i data-lucide="stamp"></i> Marca de agua</h2>
    <p>Inserta una marca de agua de texto con posición, color, opacidad y rotación</p>
  </div>
  <input bind:this={watermarkFileInput} class="image-convert-file" type="file" accept=".pdf" onchange={(event) => setFile(event, 'watermark')}>

  {#if !watermarkFile}
    <button class="image-convert-dropzone" type="button" onclick={() => watermarkFileInput?.click()}>
      <i data-lucide="upload-cloud"></i>
      <strong>Seleccionar PDF</strong>
      <span>Arrastra o haz clic para cargar un documento</span>
    </button>
  {:else}
    <div class="pdf-file-bar">
      <div class="pdf-file-bar-info">
        <i data-lucide="file-text"></i>
        <span>{watermarkFile.name}</span>
      </div>
      <button class="btn btn-quiet" type="button" onclick={() => clearFile('watermark', watermarkFileInput)}>
        <i data-lucide="x"></i> Limpiar
      </button>
    </div>

    <div class="pdf-preview-grid">
      <div class="pdf-preview-stage">
        <canvas bind:this={watermarkCanvas} class="pdf-preview-canvas" class:hidden={!watermarkPreviewImg}></canvas>
        {#if watermarkPreviewError}
          <div class="pdf-preview-empty pdf-preview-error"><i data-lucide="alert-triangle"></i><span>No se pudo generar la vista previa</span></div>
        {:else if !watermarkPreviewImg && watermarkFile}
          <div class="pdf-preview-loading">Cargando vista previa...</div>
        {:else if !watermarkPreviewImg && !watermarkFile}
          <div class="pdf-preview-empty"><i data-lucide="file-text"></i><span>Carga un PDF para ver la vista previa</span></div>
        {/if}
      </div>
      <div class="pdf-extra-grid pdf-preview-controls">
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
        <div class="btn-row">
          <button class="btn" type="button" onclick={addWatermark}><i data-lucide="stamp"></i> Aplicar marca</button>
          {#if watermarkOutput}
            <button class="btn btn-green" type="button" onclick={() => download(watermarkOutput, watermarkDownloadName)}><i data-lucide="download"></i> Descargar</button>
          {/if}
        </div>
      </div>
    </div>
  {/if}
  <div class="output">{watermarkInfo || 'La marca se aplica localmente a todas las páginas.'}</div>
</div>

<div class="tool-panel" id="panel-pdf-metadata">
  <div class="panel-header">
    <h2><i data-lucide="info"></i> Metadatos PDF</h2>
    <p>Edita título, autor, asunto y palabras clave del documento</p>
  </div>
  <input bind:this={metadataFileInput} class="image-convert-file" type="file" accept=".pdf" onchange={(event) => setFile(event, 'metadata')}>

  {#if !metadataFile}
    <button class="image-convert-dropzone" type="button" onclick={() => metadataFileInput?.click()}>
      <i data-lucide="upload-cloud"></i>
      <strong>Seleccionar PDF</strong>
      <span>Arrastra o haz clic para cargar un documento</span>
    </button>
  {:else}
    <div class="pdf-file-bar">
      <div class="pdf-file-bar-info">
        <i data-lucide="file-text"></i>
        <span>{metadataFile.name}</span>
      </div>
      <button class="btn btn-quiet" type="button" onclick={() => clearFile('metadata', metadataFileInput)}>
        <i data-lucide="x"></i> Limpiar
      </button>
    </div>

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
  {/if}
  <div class="output">{metadataInfo || 'Los metadatos ayudan a organizar y buscar documentos PDF.'}</div>
</div>

<div class="tool-panel" id="panel-pdf-rotate">
  <div class="panel-header">
    <h2><i data-lucide="rotate-cw"></i> Rotar PDF</h2>
    <p>Gira las páginas de un PDF 90°, 180° o 270°</p>
  </div>
  <input bind:this={rotateFileInput} class="image-convert-file" type="file" accept=".pdf" onchange={(event) => setFile(event, 'rotate')}>

  {#if !rotateFile}
    <button class="image-convert-dropzone" type="button" onclick={() => rotateFileInput?.click()}>
      <i data-lucide="upload-cloud"></i>
      <strong>Seleccionar PDF</strong>
      <span>Arrastra o haz clic para cargar un documento</span>
    </button>
  {:else}
    <div class="pdf-file-bar">
      <div class="pdf-file-bar-info">
        <i data-lucide="file-text"></i>
        <span>{rotateFile.name}</span>
      </div>
      <button class="btn btn-quiet" type="button" onclick={() => clearFile('rotate', rotateFileInput)}>
        <i data-lucide="x"></i> Limpiar
      </button>
    </div>

    <div class="pdf-preview-grid">
      <div class="pdf-preview-stage">
        <canvas bind:this={rotateCanvas} class="pdf-preview-canvas" class:hidden={!rotatePreviewImg}></canvas>
        {#if rotatePreviewError}
          <div class="pdf-preview-empty pdf-preview-error"><i data-lucide="alert-triangle"></i><span>No se pudo generar la vista previa</span></div>
        {:else if !rotatePreviewImg && rotateFile}
          <div class="pdf-preview-loading">Cargando vista previa...</div>
        {:else if !rotatePreviewImg && !rotateFile}
          <div class="pdf-preview-empty"><i data-lucide="file-text"></i><span>Carga un PDF para ver la vista previa</span></div>
        {/if}
      </div>
      <div class="pdf-extra-grid pdf-preview-controls">
        <div>
          <label for="pdf-rotate-angle">Ángulo de rotación</label>
          <select id="pdf-rotate-angle" bind:value={rotateAngle}>
            <option value="90">90° (derecha)</option>
            <option value="180">180° (invertir)</option>
            <option value="270">270° (izquierda)</option>
          </select>
        </div>
        <div class="checkbox-row">
          <input type="checkbox" id="pdf-rotate-all" bind:checked={rotateAllPages}>
          <label for="pdf-rotate-all">Todas las páginas</label>
        </div>
        {#if !rotateAllPages}
          <div>
            <label for="pdf-rotate-pages">Páginas específicas (ej: 1, 3, 5-7)</label>
            <input id="pdf-rotate-pages" type="text" bind:value={rotatePages} placeholder="1, 3, 5-7">
          </div>
        {/if}
        <div class="btn-row">
          <button class="btn" type="button" onclick={rotatePdf}><i data-lucide="rotate-cw"></i> Rotar</button>
          {#if rotateOutput}
            <button class="btn btn-green" type="button" onclick={() => download(rotateOutput, rotateDownloadName)}><i data-lucide="download"></i> Descargar</button>
          {/if}
        </div>
      </div>
    </div>
  {/if}
  <div class="output">{rotateInfo || 'La rotación se aplica localmente sin subir el archivo a internet.'}</div>
</div>

<div class="tool-panel" id="panel-pdf-remove">
  <div class="panel-header">
    <h2><i data-lucide="trash-2"></i> Eliminar Páginas</h2>
    <p>Elimina páginas específicas de un PDF sin subirlo a ningún servidor</p>
  </div>
  <input bind:this={removeFileInput} class="image-convert-file" type="file" accept=".pdf" onchange={(event) => setFile(event, 'remove')}>

  {#if !removeFile}
    <button class="image-convert-dropzone" type="button" onclick={() => removeFileInput?.click()}>
      <i data-lucide="upload-cloud"></i>
      <strong>Seleccionar PDF</strong>
      <span>Arrastra o haz clic para cargar un documento</span>
    </button>
  {:else}
    <div class="pdf-file-bar">
      <div class="pdf-file-bar-info">
        <i data-lucide="file-text"></i>
        <span>{removeFile.name}</span>
      </div>
      <button class="btn btn-quiet" type="button" onclick={() => clearFile('remove', removeFileInput)}>
        <i data-lucide="x"></i> Limpiar
      </button>
    </div>

    <div class="pdf-preview-grid">
      <div class="pdf-preview-stage">
        <canvas bind:this={removeCanvas} class="pdf-preview-canvas" class:hidden={!removePreviewImg}></canvas>
        {#if removePreviewError}
          <div class="pdf-preview-empty pdf-preview-error"><i data-lucide="alert-triangle"></i><span>No se pudo generar la vista previa</span></div>
        {:else if !removePreviewImg && removeFile}
          <div class="pdf-preview-loading">Cargando vista previa...</div>
        {:else if !removePreviewImg && !removeFile}
          <div class="pdf-preview-empty"><i data-lucide="file-text"></i><span>Carga un PDF para ver la vista previa</span></div>
        {/if}
      </div>
      <div class="pdf-extra-grid pdf-preview-controls">
        <div>
          <label for="pdf-remove-pages">Páginas a eliminar</label>
          <input id="pdf-remove-pages" type="text" bind:value={removePages} placeholder="Ej: 1, 3, 5-7">
        </div>
        <div class="btn-row">
          <button class="btn" type="button" onclick={removePdfPages}><i data-lucide="trash-2"></i> Eliminar páginas</button>
          {#if removeOutput}
            <button class="btn btn-green" type="button" onclick={() => download(removeOutput, removeDownloadName)}><i data-lucide="download"></i> Descargar</button>
          {/if}
        </div>
      </div>
    </div>
  {/if}
  <div class="output">{removeInfo || 'Usa comas para separar páginas y guiones para rangos (ej: 1, 3, 5-7).'}</div>
</div>
