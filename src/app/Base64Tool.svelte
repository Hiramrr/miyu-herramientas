<script>
  let input = $state('');
  let output = $state('');
  let mode = $state('encode');
  let fileName = $state('');
  let error = $state('');

  function encode() {
    error = '';
    if (!input) { error = 'Ingresa texto para codificar'; return; }
    try {
      output = btoa(unescape(encodeURIComponent(input)));
      mode = 'encode';
    } catch (e) {
      error = 'Error al codificar: ' + e.message;
    }
  }

  function decode() {
    error = '';
    if (!input) { error = 'Ingresa Base64 para decodificar'; return; }
    try {
      output = decodeURIComponent(escape(atob(input)));
      mode = 'decode';
    } catch (e) {
      error = 'Base64 inválido: ' + e.message;
    }
  }

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    fileName = file.name;
    error = '';
    const reader = new FileReader();
    reader.onload = (ev) => {
      input = '';
      output = ev.target.result;
      mode = 'encode';
    };
    reader.onerror = () => { error = 'No se pudo leer el archivo'; };
    reader.readAsDataURL(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    fileName = file.name;
    error = '';
    const reader = new FileReader();
    reader.onload = (ev) => {
      input = '';
      output = ev.target.result;
      mode = 'encode';
    };
    reader.onerror = () => { error = 'No se pudo leer el archivo'; };
    reader.readAsDataURL(file);
  }

  function clearAll() {
    input = '';
    output = '';
    error = '';
    fileName = '';
  }

  let copyTimer;
  function copyResult() {
    if (!output) return;
    navigator.clipboard.writeText(output).then(() => {
      clearTimeout(copyTimer);
      const toast = document.getElementById('app-toast');
      if (toast) { toast.classList.add('show'); toast.textContent = 'Copiado al portapapeles'; }
      copyTimer = setTimeout(() => { if (toast) toast.classList.remove('show'); }, 1800);
    });
  }

  function handleDragOver(e) {
    e.preventDefault();
  }
</script>

<div class="panel-header">
  <h2><i data-lucide="file-code"></i> Base64</h2>
  <p>Codifica texto a Base64 o decodifica Base64 a texto. También convierte archivos a Data URL.</p>
</div>

<div class="base64-file-zone"
  role="button"
  tabindex="0"
  class:has-file={!!fileName}
  onclick={() => document.getElementById('base64-file-input')?.click()}
  onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); document.getElementById('base64-file-input')?.click(); } }}
  ondragover={handleDragOver}
  ondrop={handleDrop}
>
  <input type="file" id="base64-file-input" class="base64-file-input" onchange={handleFile}>
  {#if fileName}
    <i data-lucide="file-text"></i>
    <strong>{fileName}</strong>
    <span>Suelta otro archivo o haz clic para cambiar</span>
  {:else}
    <i data-lucide="upload-cloud"></i>
    <strong>Arrastra un archivo aquí</strong>
    <span>o haz clic para seleccionar (se codificará a Base64)</span>
  {/if}
</div>

<label for="base64-input">Texto {mode === 'encode' ? 'a codificar' : 'a decodificar'}</label>
<textarea
  id="base64-input"
  bind:value={input}
  placeholder={mode === 'encode' ? 'Pega aquí el texto para codificar a Base64...' : 'Pega aquí el Base64 para decodificar...'}
></textarea>

<div class="btn-row">
  <button class="btn" onclick={encode}>
    <i data-lucide="arrow-up"></i> Codificar a Base64
  </button>
  <button class="btn" onclick={decode}>
    <i data-lucide="arrow-down"></i> Decodificar a Texto
  </button>
  <button class="btn btn-quiet" onclick={clearAll}>
    <i data-lucide="eraser"></i> Limpiar
  </button>
</div>

{#if error}
  <div class="output base64-error">{error}</div>
{/if}

<label for="base64-output" class="output-label">Resultado</label>
<textarea
  id="base64-output"
  class="output-textarea"
  readonly
  value={output}
  placeholder="El resultado aparecerá aquí..."
  rows="5"
></textarea>

<div class="btn-row">
  <button class="btn btn-green" onclick={copyResult} disabled={!output}>
    <i data-lucide="copy"></i> Copiar resultado
  </button>
</div>
