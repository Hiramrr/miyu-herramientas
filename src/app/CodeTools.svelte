<script>
  import { parseInBase, regexMatchesHtml, uuidV4 } from '../tools/codeUtils.js';
  import { buildFfmpegCommand, FFMPEG_PRESETS } from '../tools/ffmpegCommand.js';

  let currentBase = 10;
  let previewHtml = '';

  // json.js
  function formatJSON(){try{var o=JSON.parse(document.getElementById('json-input').value);document.getElementById('json-output').value=JSON.stringify(o,null,2);}catch(e){document.getElementById('json-output').value='Error: '+e.message;}}

  function minifyJSON(){try{var o=JSON.parse(document.getElementById('json-input').value);document.getElementById('json-output').value=JSON.stringify(o);}catch(e){document.getElementById('json-output').value='Error: '+e.message;}}

  function sortJsonValue(value) {
    if (Array.isArray(value)) return value.map(sortJsonValue);
    if (!value || typeof value !== 'object') return value;
    return Object.keys(value).sort().reduce(function(acc, key) {
      acc[key] = sortJsonValue(value[key]);
      return acc;
    }, Object.create(null));
  }

  function setJsonStatus(message, type) {
    var status = document.getElementById('json-status');
    if (!status) return;
    status.textContent = message;
    status.className = 'tool-status ' + (type || '');
  }

  function validateJsonInput() {
    var input = document.getElementById('json-input');
    if (!input) return;
    var value = input.value.trim();
    if (!value) {
      setJsonStatus('Esperando JSON');
      return;
    }
    try {
      var parsed = JSON.parse(value);
      var size = Array.isArray(parsed) ? parsed.length + ' elementos' : parsed && typeof parsed === 'object' ? Object.keys(parsed).length + ' claves' : 'valor ' + (parsed === null ? 'null' : typeof parsed);
      setJsonStatus('JSON válido · ' + size, 'success');
    } catch (error) {
      setJsonStatus('Error: ' + error.message, 'error');
    }
  }

  function copyJSON(){var j=document.getElementById('json-output').value;if(j)navigator.clipboard.writeText(j);}

  function sortJsonKeys() {
    try {
      var input = document.getElementById('json-input');
      var output = document.getElementById('json-output');
      var parsed = JSON.parse(input.value);
      output.value = JSON.stringify(sortJsonValue(parsed), null, 2);
      setJsonStatus('JSON ordenado', 'success');
    } catch (error) {
      document.getElementById('json-output').value = 'Error: ' + error.message;
      setJsonStatus('Error: ' + error.message, 'error');
    }
  }

  function copyFormattedJsonInput() {
    try {
      navigator.clipboard.writeText(JSON.stringify(JSON.parse(document.getElementById('json-input').value), null, 2));
    } catch (error) {
      setJsonStatus('Error: ' + error.message, 'error');
    }
  }

  function clearJsonTool() {
    document.getElementById('json-input').value = '';
    document.getElementById('json-output').value = '';
    validateJsonInput();
    document.getElementById('json-input').focus();
  }

  // html.js
  function escapeHTML(){var i=document.getElementById('html-input').value;var o=i.replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c];});document.getElementById('html-output').value=o;}

  function unescapeHTML(){var i=document.getElementById('html-input').value;var o=i.replace(/&amp;|&lt;|&gt;|&quot;|&#39;/g,function(c){return{'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&#39;':"'"}[c];});document.getElementById('html-output').value=o;}

  function copyHTML(){var h=document.getElementById('html-output').value;if(h)navigator.clipboard.writeText(h);}

  // htmlpreview.js
  // Rendered in a sandboxed iframe without allow-same-origin: its CSS and JS cannot reach the app or its storage.
  function renderHTMLPreview() { previewHtml = document.getElementById('htmlpreview-input').value; }

  // regex.js
  function testRegex() {
    var p = document.getElementById('regex-pattern').value;
    var f = document.getElementById('regex-flags').value;
    var t = document.getElementById('regex-text').value;
    var output = document.getElementById('regex-output');
    if (!p || !t) return;
    try {
      output.innerHTML = regexMatchesHtml(p, f, t);
    } catch (e) {
      output.textContent = 'Error: ' + e.message;
    }
  }

  // hash.js
  async function generateHash(){var t=document.getElementById('hash-input').value;if(!t)return;var e=new TextEncoder();var d=e.encode(t);var s1=await crypto.subtle.digest('SHA-1',d);var s2=await crypto.subtle.digest('SHA-256',d);var s5=await crypto.subtle.digest('SHA-512',d);var h=function(b){return Array.from(new Uint8Array(b)).map(function(b){return b.toString(16).padStart(2,'0');}).join('');};document.getElementById('hash-output').innerHTML='<strong>SHA-1:</strong> '+h(s1)+'<br><br><strong>SHA-256:</strong> '+h(s2)+'<br><br><strong>SHA-512:</strong> '+h(s5);}

  function copyHashOutput() {
    var output = document.getElementById('hash-output');
    var text = output.textContent.trim();
    if (text && navigator.clipboard) navigator.clipboard.writeText(text);
  }

  // uuid.js
  function generateUUID() {
    var c = Math.min(50, Math.max(1, parseInt(document.getElementById('uuid-count').value) || 5));
    document.getElementById('uuid-output').textContent = Array.from({ length: c }, uuidV4).join('\n');
  }

  function copyUUID(){var u=document.getElementById('uuid-output').textContent;if(u)navigator.clipboard.writeText(u);}

  // bases.js
  function setBase(b){currentBase=b;document.querySelectorAll('.base-btn').forEach(function(btn){btn.classList.remove('active');});document.querySelector('.base-btn[data-base="'+b+'"]').classList.add('active');convertBase();}

  function convertBase() {
    var v = document.getElementById('base-input').value;
    var output = document.getElementById('base-output');
    if (!v.trim()) { output.innerHTML = ''; return; }
    var dec;
    try {
      dec = parseInBase(v, currentBase);
    } catch (e) {
      output.textContent = e.message;
      return;
    }
    output.innerHTML = '<div style="display:grid;grid-template-columns:auto 1fr;gap:8px 16px">' +
      '<span style="color:var(--output-code)">Decimal:</span><span><strong>' + dec + '</strong></span>' +
      '<span style="color:var(--output-code)">Binario:</span><span>' + dec.toString(2) + '</span>' +
      '<span style="color:var(--output-code)">Octal:</span><span>' + dec.toString(8) + '</span>' +
      '<span style="color:var(--output-code)">Hexadecimal:</span><span>' + dec.toString(16).toUpperCase() + '</span></div>';
  }

  // ffmpeg.js
  function updateFFmpegExtra() {
    var preset = document.getElementById('ff-preset');
    var extra = document.getElementById('ff-extra');
    var label = document.getElementById('ff-extra-label');
    var value = document.getElementById('ff-extra-value');
    if (!preset || !extra || !label || !value) return;
    var config = FFMPEG_PRESETS[preset.value].extra;
    value.value = '';
    extra.style.display = config ? 'block' : 'none';
    if (config) {
      label.textContent = config[0];
      value.placeholder = config[1];
    } else {
      label.textContent = 'Parámetro extra';
      value.placeholder = '';
    }
  }

  function generateFFmpeg() {
    var result = document.getElementById('ff-result');
    try {
      result.textContent = buildFfmpegCommand({
        input: document.getElementById('ff-input').value,
        output: document.getElementById('ff-output').value,
        preset: document.getElementById('ff-preset').value,
        extra: document.getElementById('ff-extra-value').value
      });
    } catch (e) {
      result.textContent = 'Error: ' + e.message;
    }
  }

  function copyFFmpeg(){var c=document.getElementById('ff-result').textContent;if(c)navigator.clipboard.writeText(c);}
</script>

<div class="tool-panel" id="panel-json">
  <div class="panel-header">
    <h2><i data-lucide="braces"></i> Formateador JSON</h2>
    <p>Da formato legible o minifica datos JSON con un clic</p>
  </div>
  <textarea id="json-input" placeholder="Escribe JSON aquí..." oninput={validateJsonInput}></textarea>
  <div id="json-status" class="tool-status">Esperando JSON</div>
  <div class="btn-row">
    <button class="btn" onclick={formatJSON}><i data-lucide="align-left"></i> Formatear</button>
    <button class="btn" onclick={minifyJSON}><i data-lucide="minimize"></i> Minificar</button>
    <button class="btn btn-green" onclick={copyJSON}><i data-lucide="copy"></i> Copiar</button>
  </div>
  <textarea id="json-output" readonly style="margin-top:10px; font-family:monospace" placeholder="JSON formateado..."></textarea>
  <div class="btn-row tool-extra-actions" id="json-extra-actions">
    <button class="btn" onclick={sortJsonKeys}><i data-lucide="list-tree"></i> Ordenar claves</button>
    <button class="btn btn-green" onclick={copyFormattedJsonInput}><i data-lucide="copy"></i> Copiar entrada formateada</button>
    <button class="btn btn-quiet" onclick={clearJsonTool}><i data-lucide="eraser"></i> Limpiar</button>
  </div>
</div>

<div class="tool-panel" id="panel-html">
  <div class="panel-header">
    <h2><i data-lucide="code"></i> Escapar HTML</h2>
    <p>Escapa o desescapa caracteres especiales HTML</p>
  </div>
  <textarea id="html-input" placeholder="<div class='example'>Hello & goodbye</div>"></textarea>
  <div class="btn-row">
    <button class="btn" onclick={escapeHTML}><i data-lucide="chevrons-right"></i> Escapar</button>
    <button class="btn" onclick={unescapeHTML}><i data-lucide="chevrons-left"></i> Desescapar</button>
    <button class="btn btn-green" onclick={copyHTML}><i data-lucide="copy"></i> Copiar</button>
  </div>
  <textarea id="html-output" readonly style="margin-top:10px;font-family:monospace" placeholder="Resultado..."></textarea>
</div>

<div class="tool-panel" id="panel-htmlpreview">
  <div class="panel-header">
    <h2><i data-lucide="monitor"></i> Vista Previa HTML</h2>
    <p>Escribe código HTML y ve el resultado renderizado al instante</p>
  </div>
  <textarea id="htmlpreview-input" placeholder="<h1>Hola mundo</h1><p>Esto es un párrafo</p>"></textarea>
  <div class="btn-row"><button class="btn" onclick={renderHTMLPreview}><i data-lucide="eye"></i> Ver resultado</button></div>
  <div class="output" id="htmlpreview-output" style="padding:0;overflow:hidden;min-height:150px">
    <iframe title="Vista previa HTML" sandbox="allow-scripts" srcdoc={previewHtml} style="display:block;width:100%;min-height:300px;border:0;background:#fff"></iframe>
  </div>
</div>

<div class="tool-panel" id="panel-regex">
  <div class="panel-header">
    <h2><i data-lucide="search"></i> Probador de Regex</h2>
    <p>Testea patrones de expresiones regulares contra texto real</p>
  </div>
  <label for="regex-pattern">Patrón</label>
  <input type="text" id="regex-pattern" placeholder="[a-z]+">
  <label for="regex-flags">Flags</label>
  <input type="text" id="regex-flags" value="gi" placeholder="gi">
  <label for="regex-text">Texto de prueba</label>
  <textarea id="regex-text" placeholder="Escribe el texto para probar..."></textarea>
  <button class="btn" onclick={testRegex}><i data-lucide="search"></i> Probar patrón</button>
  <div class="output" id="regex-output" style="font-family:monospace;font-size:0.85rem"></div>
</div>

<div class="tool-panel" id="panel-hash">
  <div class="panel-header">
    <h2><i data-lucide="fingerprint"></i> Generador de Hash</h2>
    <p>Calcula hashes SHA-1, SHA-256 y SHA-512 de cualquier texto</p>
  </div>
  <textarea id="hash-input" placeholder="Escribe el texto para generar sus hashes..."></textarea>
  <button class="btn" onclick={generateHash}><i data-lucide="fingerprint"></i> Calcular Hashes</button>
  <div class="output" id="hash-output" style="font-family:monospace;font-size:0.82rem"></div>
  <div class="btn-row tool-extra-actions" id="hash-extra-actions">
    <button class="btn btn-green" onclick={copyHashOutput}><i data-lucide="copy"></i> Copiar hashes</button>
  </div>
</div>

<div class="tool-panel" id="panel-uuid">
  <div class="panel-header">
    <h2><i data-lucide="hash"></i> Generador UUID</h2>
    <p>Crea identificadores únicos universales (UUID v4)</p>
  </div>
  <label for="uuid-count">Cantidad</label>
  <input type="number" id="uuid-count" value="5" min="1" max="50">
  <div class="btn-row">
    <button class="btn" onclick={generateUUID}><i data-lucide="refresh-cw"></i> Generar</button>
    <button class="btn btn-green" onclick={copyUUID}><i data-lucide="copy"></i> Copiar</button>
  </div>
  <div class="output" id="uuid-output" style="font-family:monospace;font-size:0.85rem;white-space:pre-line"></div>
</div>

<div class="tool-panel" id="panel-bases">
  <div class="panel-header">
    <h2><i data-lucide="divide"></i> Conversor de Bases Numéricas</h2>
    <p>Convierte números entre binario, octal, decimal y hexadecimal</p>
  </div>
  <label for="base-input">Valor</label>
  <input type="text" id="base-input" placeholder="Ej: 255" oninput={convertBase}>
  <div class="base-group-label" id="base-group-label">Base de entrada</div>
  <div class="base-group" id="base-group" role="group" aria-labelledby="base-group-label">
    <button class="base-btn active" data-base="10" onclick={() => setBase(10)}>Decimal</button>
    <button class="base-btn" data-base="2" onclick={() => setBase(2)}>Binario</button>
    <button class="base-btn" data-base="8" onclick={() => setBase(8)}>Octal</button>
    <button class="base-btn" data-base="16" onclick={() => setBase(16)}>Hexadecimal</button>
  </div>
  <div class="output" id="base-output" style="font-family:monospace;font-size:0.95rem"></div>
</div>

<div class="tool-panel" id="panel-ffmpeg">
  <div class="panel-header">
    <h2><i data-lucide="video"></i> Comandos FFmpeg</h2>
    <p>Genera comandos para convertir video, audio, crear GIFs y más</p>
  </div>
  <label for="ff-input">Archivo de entrada</label>
  <input type="text" id="ff-input" placeholder="video.mp4">
  <label for="ff-preset">Conversión</label>
  <select id="ff-preset" onchange={updateFFmpegExtra}>
    <option value="mp3">Video a MP3</option><option value="gif">Video a GIF</option>
    <option value="webm">Video a WebM</option><option value="compress">Comprimir video</option>
    <option value="thumbnail">Extraer thumbnail</option><option value="trim">Recortar tiempo</option>
    <option value="resize">Redimensionar</option><option value="audio-compress">Comprimir audio</option>
    <option value="custom">Personalizado</option>
  </select>
  <div id="ff-extra" style="display:none"><label id="ff-extra-label" for="ff-extra-value">Parámetro extra</label><input type="text" id="ff-extra-value" placeholder=""></div>
  <label for="ff-output">Archivo de salida</label>
  <input type="text" id="ff-output" placeholder="output (se añade la extensión)">
  <div class="btn-row">
    <button class="btn" onclick={generateFFmpeg}><i data-lucide="terminal"></i> Generar</button>
    <button class="btn btn-green" onclick={copyFFmpeg}><i data-lucide="copy"></i> Copiar</button>
  </div>
  <div class="output" id="ff-result" style="font-family:monospace;font-size:0.85rem"></div>
</div>
