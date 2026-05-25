<script>
  import { activeTool } from '../tools/activeTool.svelte.js';

  let qrDataURL = '';
  let imgBase64 = '';

  function generateQR() {
    var t = document.getElementById('qr-text').value;
    var s = parseInt(document.getElementById('qr-size').value);
    if (!t) return;
    var c = document.createElement('canvas');
    window.QRCode.toCanvas(c, t, { width: s }).then(function () {
      qrDataURL = c.toDataURL();
      document.getElementById('qr-output').innerHTML = '<img src="' + qrDataURL + '" alt="QR">';
    });
  }

  function downloadQR() {
    if (qrDataURL) {
      var a = document.createElement('a');
      a.href = qrDataURL;
      a.download = 'qrcode.png';
      a.click();
    }
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
        <p>Crea códigos QR para enlaces, texto o información de contacto</p>
      </div>
      <label for="qr-text">Texto o URL</label>
      <input type="text" id="qr-text" placeholder="https://ejemplo.com">
      <label for="qr-size">Tamaño</label>
      <select id="qr-size"><option value="200">Pequeño (200px)</option><option value="300" selected>Mediano (300px)</option><option value="500">Grande (500px)</option></select>
      <div class="btn-row">
        <button class="btn" onclick={generateQR}><i data-lucide="qr-code"></i> Generar QR</button>
        <button class="btn btn-green" onclick={downloadQR}><i data-lucide="download"></i> Descargar PNG</button>
      </div>
      <div class="output" id="qr-output"></div>
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
