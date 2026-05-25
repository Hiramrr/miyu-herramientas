<script>
  import { activeTool } from '../tools/activeTool.svelte.js';

  let currentBase = 10;

  // json.js
  function formatJSON(){try{var o=JSON.parse(document.getElementById('json-input').value);document.getElementById('json-output').value=JSON.stringify(o,null,2);}catch(e){document.getElementById('json-output').value='Error: '+e.message;}}

  function minifyJSON(){try{var o=JSON.parse(document.getElementById('json-input').value);document.getElementById('json-output').value=JSON.stringify(o);}catch(e){document.getElementById('json-output').value='Error: '+e.message;}}

  function sortJsonValue(value) {
    if (Array.isArray(value)) return value.map(sortJsonValue);
    if (!value || typeof value !== 'object') return value;
    return Object.keys(value).sort().reduce(function(acc, key) {
      acc[key] = sortJsonValue(value[key]);
      return acc;
    }, {});
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
      var size = Array.isArray(parsed) ? parsed.length + ' elementos' : Object.keys(parsed || {}).length + ' claves';
      setJsonStatus('JSON válido · ' + size, 'success');
    } catch (error) {
      setJsonStatus('Error: ' + error.message, 'error');
    }
  }

  function copyJSON(){var j=document.getElementById('json-output').value;if(j)navigator.clipboard.writeText(j);}

  // enhanceJsonTool.js
  function enhanceJsonTool() {
    var input = document.getElementById('json-input');
    var output = document.getElementById('json-output');
    if (!input || !output || document.getElementById('json-extra-actions')) return;
    var status = document.createElement('div');
    status.id = 'json-status';
    status.className = 'tool-status';
    status.textContent = 'Esperando JSON';
    input.insertAdjacentElement('afterend', status);
    var row = document.createElement('div');
    row.className = 'btn-row tool-extra-actions';
    row.id = 'json-extra-actions';
    row.appendChild(createToolButton('Ordenar claves', 'list-tree', function() {
      try {
        var parsed = JSON.parse(input.value);
        output.value = JSON.stringify(sortJsonValue(parsed), null, 2);
        setJsonStatus('JSON ordenado', 'success');
      } catch (error) {
        output.value = 'Error: ' + error.message;
        setJsonStatus('Error: ' + error.message, 'error');
      }
    }));
    row.appendChild(createToolButton('Copiar entrada formateada', 'copy', function() {
      try {
        navigator.clipboard.writeText(JSON.stringify(JSON.parse(input.value), null, 2));
      } catch (error) {
        setJsonStatus('Error: ' + error.message, 'error');
      }
    }, 'btn-green'));
    row.appendChild(createToolButton('Limpiar', 'eraser', function() {
      input.value = '';
      output.value = '';
      validateJsonInput();
      input.focus();
    }, 'btn-quiet'));
    output.insertAdjacentElement('afterend', row);
    input.addEventListener('input', validateJsonInput);
    validateJsonInput();
  }

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
  function renderHTMLPreview(){var h=document.getElementById('htmlpreview-input').value;document.getElementById('htmlpreview-output').innerHTML=h;}

  // regex.js
  function testRegex(){var p=document.getElementById('regex-pattern').value;var f=document.getElementById('regex-flags').value;var t=document.getElementById('regex-text').value;if(!p||!t)return;try{var r=new RegExp(p,f);var m=t.match(r);if(m){document.getElementById('regex-output').innerHTML='<strong>'+m.length+' coincidencia(s):</strong><br>'+m.map(function(m,i){return (i+1)+'. "'+m+'"';}).join('<br>');}else{document.getElementById('regex-output').textContent='Sin coincidencias';}}catch(e){document.getElementById('regex-output').textContent='Error: '+e.message;}}

  // hash.js
  async function generateHash(){var t=document.getElementById('hash-input').value;if(!t)return;var e=new TextEncoder();var d=e.encode(t);var s1=await crypto.subtle.digest('SHA-1',d);var s2=await crypto.subtle.digest('SHA-256',d);var s5=await crypto.subtle.digest('SHA-512',d);var h=function(b){return Array.from(new Uint8Array(b)).map(function(b){return b.toString(16).padStart(2,'0');}).join('');};document.getElementById('hash-output').innerHTML='<strong>SHA-1:</strong> '+h(s1)+'<br><br><strong>SHA-256:</strong> '+h(s2)+'<br><br><strong>SHA-512:</strong> '+h(s5);}

  // enhanceHashTool.js
  function enhanceHashTool() {
    var output = document.getElementById('hash-output');
    if (!output || document.getElementById('hash-extra-actions')) return;
    var row = document.createElement('div');
    row.className = 'btn-row tool-extra-actions';
    row.id = 'hash-extra-actions';
    row.appendChild(createToolButton('Copiar hashes', 'copy', function() {
      var text = output.textContent.trim();
      if (text && navigator.clipboard) navigator.clipboard.writeText(text);
    }, 'btn-green'));
    output.insertAdjacentElement('afterend', row);
  }

  function copyHashOutput() {
    var output = document.getElementById('hash-output');
    var text = output.textContent.trim();
    if (text && navigator.clipboard) navigator.clipboard.writeText(text);
  }

  // uuid.js
  function generateUUID(){var c=parseInt(document.getElementById('uuid-count').value)||5;var u=[];for(var i=0;i<c;i++){u.push('xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(c){var r=Math.random()*16|0;var v=c==='x'?r:(r&0x3|0x8);return v.toString(16);}));}document.getElementById('uuid-output').innerHTML=u.map(function(u){return '<div style="margin:4px 0">'+u+'</div>';}).join('');}

  function copyUUID(){var u=document.getElementById('uuid-output').textContent;if(u)navigator.clipboard.writeText(u);}

  // bases.js
  function setBase(b){currentBase=b;document.querySelectorAll('.base-btn').forEach(function(btn){btn.classList.remove('active');});document.querySelector('.base-btn[data-base="'+b+'"]').classList.add('active');convertBase();}

  function convertBase(){var v=document.getElementById('base-input').value;if(!v){document.getElementById('base-output').innerHTML='';return;}var dec;try{dec=parseInt(v,currentBase);if(isNaN(dec)){document.getElementById('base-output').textContent='Valor inválido';return;}}catch(e){document.getElementById('base-output').textContent='Valor inválido';return;}document.getElementById('base-output').innerHTML='<div style="display:grid;grid-template-columns:auto 1fr;gap:8px 16px">'+
      '<span style="color:var(--output-code)">Decimal:</span><span><strong>'+dec+'</strong></span>'+
      '<span style="color:var(--output-code)">Binario:</span><span>'+dec.toString(2)+'</span>'+
      '<span style="color:var(--output-code)">Octal:</span><span>'+dec.toString(8)+'</span>'+
      '<span style="color:var(--output-code)">Hexadecimal:</span><span>'+dec.toString(16).toUpperCase()+'</span></div>';}

  // ffmpeg.js
  function updateFFmpegExtra() {
    var preset = document.getElementById('ff-preset');
    var extra = document.getElementById('ff-extra');
    var label = document.getElementById('ff-extra-label');
    var value = document.getElementById('ff-extra-value');
    if (!preset || !extra || !label || !value) return;
    var config = {
      gif: ['FPS (default: 10)', '10'],
      thumbnail: ['Segundo (default: 1)', '1'],
      trim: ['Inicio y duración', '00:00:10 00:00:30'],
      resize: ['Resolución (ej: 1280:720)', '1280:720']
    }[preset.value];
    extra.style.display = config ? 'block' : 'none';
    if (config) {
      label.textContent = config[0];
      value.placeholder = config[1];
    } else {
      label.textContent = 'Parámetro extra';
      value.placeholder = '';
      value.value = '';
    }
  }

  function generateFFmpeg(){var i=document.getElementById('ff-input').value||'input.mp4';var o=document.getElementById('ff-output').value||'output';var p=document.getElementById('ff-preset').value;var e=document.getElementById('ff-extra-value').value;var c='ffmpeg';switch(p){case'mp3':c+=' -i "'+i+'" -vn -acodec libmp3lame -q:a 2 "'+o.replace(/\.\w+$/,'.mp3')+'"';break;case'gif':c+=' -i "'+i+'" -vf "fps='+(e||10)+',scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" -loop 0 "'+o.replace(/\.\w+$/,'.gif')+'"';break;case'webm':c+=' -i "'+i+'" -c:v libvpx-vp9 -crf 30 -b:v 0 -c:a libopus "'+o.replace(/\.\w+$/,'.webm')+'"';break;case'compress':c+=' -i "'+i+'" -vcodec libx265 -crf 28 -preset fast -acodec aac -b:a 128k "'+o+'"';break;case'thumbnail':c+=' -i "'+i+'" -ss '+(e||1)+' -vframes 1 -q:v 2 "'+o.replace(/\.\w+$/,'.jpg')+'"';break;case'trim':var t=(e||'00:00:10 00:00:30').split(' ');c+=' -i "'+i+'" -ss '+t[0]+' -to '+t[1]+' -c copy "'+o+'"';break;case'resize':c+=' -i "'+i+'" -vf "scale='+(e||'1280:720')+'" -c:a copy "'+o+'"';break;case'audio-compress':c+=' -i "'+i+'" -b:a 128k -ar 44100 "'+o.replace(/\.\w+$/,'.mp3')+'"';break;case'custom':c+=' -i "'+i+'" [tus argumentos] "'+o+'"';break;}document.getElementById('ff-result').textContent=c;}

  function copyFFmpeg(){var c=document.getElementById('ff-result').textContent;if(c)navigator.clipboard.writeText(c);}
</script>

{#if activeTool.id === 'json'}
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
{/if}

{#if activeTool.id === 'html'}
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
{/if}

{#if activeTool.id === 'htmlpreview'}
<div class="tool-panel" id="panel-htmlpreview">
  <div class="panel-header">
    <h2><i data-lucide="monitor"></i> Vista Previa HTML</h2>
    <p>Escribe código HTML y ve el resultado renderizado al instante</p>
  </div>
  <textarea id="htmlpreview-input" placeholder="<h1>Hola mundo</h1><p>Esto es un párrafo</p>"></textarea>
  <div class="btn-row"><button class="btn" onclick={renderHTMLPreview}><i data-lucide="eye"></i> Ver resultado</button></div>
  <div class="output" id="htmlpreview-output" style="padding:0;overflow:hidden;min-height:150px"></div>
</div>
{/if}

{#if activeTool.id === 'regex'}
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
{/if}

{#if activeTool.id === 'hash'}
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
{/if}

{#if activeTool.id === 'uuid'}
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
  <div class="output" id="uuid-output" style="font-family:monospace;font-size:0.85rem"></div>
</div>
{/if}

{#if activeTool.id === 'bases'}
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
{/if}

{#if activeTool.id === 'ffmpeg'}
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
  <input type="text" id="ff-output" placeholder="resultado.mp4">
  <div class="btn-row">
    <button class="btn" onclick={generateFFmpeg}><i data-lucide="terminal"></i> Generar</button>
    <button class="btn btn-green" onclick={copyFFmpeg}><i data-lucide="copy"></i> Copiar</button>
  </div>
  <div class="output" id="ff-result" style="font-family:monospace;font-size:0.85rem"></div>
</div>
{/if}
