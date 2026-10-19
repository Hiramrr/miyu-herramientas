<script>
  import { evaluatePassword, randomPassword } from '../tools/passwordTools.js';

  function generatePassword() {
    var l = parseInt(document.getElementById('pwd-len').value);
    var c = 'abcdefghijklmnopqrstuvwxyz';
    if (document.getElementById('pwd-upper').checked) c += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (document.getElementById('pwd-numbers').checked) c += '0123456789';
    if (document.getElementById('pwd-symbols').checked) c += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    var avoid = document.getElementById('pwd-ambiguous');
    if (avoid && avoid.checked) c = c.replace(/[0O1lI]/g, '');
    document.getElementById('pwd-output').textContent = randomPassword(l, c);
    var meta = document.getElementById('pwd-meta');
    if (meta) {
      // Entropy is valid here because every character is drawn uniformly at random.
      var entropy = Math.round(l * Math.log2(c.length));
      meta.textContent = 'Entropía aproximada: ' + entropy + ' bits · ' + c.length + ' caracteres posibles';
      meta.className = 'tool-status ' + (entropy >= 80 ? 'success' : entropy >= 55 ? '' : 'error');
    }
  }

  function copyPassword() {
    var p = document.getElementById('pwd-output').textContent;
    if (p) navigator.clipboard.writeText(p);
  }

  function checkStrength() {
    var p = document.getElementById('passcheck-input').value;
    var bar = document.getElementById('str-bar');
    var out = document.getElementById('passcheck-output');
    var colors = ['#e8a0a0', '#d8b888', '#b8c888', '#88c8a0', '#80b8d4'];
    if (!p) {
      out.textContent = '';
      bar.style.width = '0';
      return;
    }
    var result = evaluatePassword(p);
    bar.style.width = ((result.score + 1) / 5 * 100) + '%';
    bar.style.background = colors[result.score];
    out.textContent = result.label + ' · estimación local de ' + result.bits + ' bits' + (result.issues.length ? '. ' + result.issues.join(' ') : '');
  }
</script>

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
