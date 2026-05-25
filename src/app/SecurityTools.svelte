<script>
  import { activeTool } from '../tools/activeTool.svelte.js';

  function generatePassword() {
    var l = parseInt(document.getElementById('pwd-len').value);
    var c = 'abcdefghijklmnopqrstuvwxyz';
    if (document.getElementById('pwd-upper').checked) c += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (document.getElementById('pwd-numbers').checked) c += '0123456789';
    if (document.getElementById('pwd-symbols').checked) c += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    var avoid = document.getElementById('pwd-ambiguous');
    if (avoid && avoid.checked) c = c.replace(/[0O1lI]/g, '');
    if (!c) {
      document.getElementById('pwd-output').textContent = 'Selecciona al menos un tipo de carácter';
      return;
    }
    var bytes = new Uint32Array(l);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(bytes);
    }
    var p = '';
    for (var i = 0; i < l; i++) {
      var n = bytes[i] || Math.floor(Math.random() * 4294967296);
      p += c[n % c.length];
    }
    document.getElementById('pwd-output').textContent = p;
    var meta = document.getElementById('pwd-meta');
    if (meta) {
      var entropy = Math.round(l * (Math.log(c.length) / Math.log(2)));
      meta.textContent = 'Entropía aproximada: ' + entropy + ' bits · ' + c.length + ' caracteres posibles';
      meta.className = 'tool-status ' + (entropy >= 80 ? 'success' : entropy >= 55 ? '' : 'error');
    }
  }

  function copyPassword() {
    var p = document.getElementById('pwd-output').textContent;
    if (p) navigator.clipboard.writeText(p);
  }

  function enhancePasswordTool() {
    var panel = document.getElementById('panel-password');
    var symbols = document.getElementById('pwd-symbols');
    var output = document.getElementById('pwd-output');
    var len = document.getElementById('pwd-len');
    if (!panel || !symbols || !output || document.getElementById('pwd-ambiguous')) return;
    if (len) len.max = '128';
    var row = document.createElement('div');
    row.className = 'checkbox-row';
    row.innerHTML = '<input type="checkbox" id="pwd-ambiguous" checked><label for="pwd-ambiguous">Evitar caracteres ambiguos (0/O, 1/l/I)</label>';
    symbols.closest('.checkbox-row').insertAdjacentElement('afterend', row);
    var meta = document.createElement('div');
    meta.id = 'pwd-meta';
    meta.className = 'tool-status';
    output.insertAdjacentElement('afterend', meta);
  }

  function checkStrength() {
    var p = document.getElementById('passcheck-input').value;
    var s = 0;
    if (p.length > 4) s++;
    if (p.length > 8) s++;
    if (p.length > 12) s++;
    if (p.match(/[A-Z]/)) s++;
    if (p.match(/[a-z]/)) s++;
    if (p.match(/[0-9]/)) s++;
    if (p.match(/[^a-zA-Z0-9]/)) s++;
    var bar = document.getElementById('str-bar');
    var out = document.getElementById('passcheck-output');
    var labels = ['Muy débil', 'Débil', 'Aceptable', 'Fuerte', 'Muy fuerte'];
    var colors = ['#e8a0a0', '#d8b888', '#b8c888', '#88c8a0', '#80b8d4'];
    var idx = Math.min(s, 4);
    bar.style.width = (s / 7 * 100) + '%';
    bar.style.background = colors[idx];
    if (p.length < 4) {
      out.textContent = 'Muy corta';
      bar.style.width = '10%';
      bar.style.background = '#e0d8d0';
    } else {
      out.textContent = labels[idx];
    }
  }
</script>

{#if activeTool.id === 'password'}
  <div class="tool-panel" id="panel-password">
    <div class="panel-header">
      <h2><i data-lucide="lock"></i> Contraseñas Seguras</h2>
      <p>Genera contraseñas robustas con la longitud y caracteres que necesites</p>
    </div>
    <label for="pwd-len">Longitud: <span id="pwd-len-val">16</span></label>
    <input type="range" id="pwd-len" min="6" max="128" value="16" oninput={() => document.getElementById('pwd-len-val').textContent = document.getElementById('pwd-len').value}>
    <div class="checkbox-row"><input type="checkbox" id="pwd-upper" checked><label for="pwd-upper">Mayúsculas (A-Z)</label></div>
    <div class="checkbox-row"><input type="checkbox" id="pwd-numbers" checked><label for="pwd-numbers">Números (0-9)</label></div>
    <div class="checkbox-row"><input type="checkbox" id="pwd-symbols" checked><label for="pwd-symbols">Símbolos (!@#$%)</label></div>
    <div class="checkbox-row"><input type="checkbox" id="pwd-ambiguous" checked><label for="pwd-ambiguous">Evitar caracteres ambiguos (0/O, 1/l/I)</label></div>
    <div class="btn-row">
      <button class="btn" onclick={generatePassword}><i data-lucide="refresh-cw"></i> Generar</button>
      <button class="btn btn-green" onclick={copyPassword}><i data-lucide="copy"></i> Copiar</button>
    </div>
    <div class="output" id="pwd-output"></div>
    <div id="pwd-meta" class="tool-status"></div>
  </div>
{/if}

{#if activeTool.id === 'passcheck'}
  <div class="tool-panel" id="panel-passcheck">
    <div class="panel-header">
      <h2><i data-lucide="shield"></i> Fortaleza de Contraseña</h2>
      <p>Evalúa qué tan segura es una contraseña en tiempo real</p>
    </div>
    <label for="passcheck-input">Escribe una contraseña</label>
    <input type="password" id="passcheck-input" placeholder="Escribe una contraseña..." oninput={checkStrength}>
    <div class="str-meter"><div class="str-bar" id="str-bar"></div></div>
    <div class="output" id="passcheck-output" style="font-weight:600"></div>
  </div>
{/if}
