<script>
  import { csvToJson, jsonToCsv } from '../tools/dataConvert.js';

  let mode = 'csvToJson';
  let delimiter = 'auto';
  let hasHeaders = true;
  let input = 'nombre,email\nAna,ana@example.com\nLuis,luis@example.com';
  let output = '';
  let status = 'Pega CSV o JSON para convertirlo localmente.';

  $: outputName = mode === 'csvToJson' ? 'datos.json' : 'datos.csv';

  function convert() {
    try {
      if (mode === 'csvToJson') {
        output = JSON.stringify(csvToJson(input, { delimiter, hasHeaders }), null, 2);
        status = 'CSV convertido a JSON.';
      } else {
        output = jsonToCsv(input);
        status = 'JSON convertido a CSV.';
      }
    } catch (error) {
      output = '';
      status = error.message || 'No se pudo convertir.';
    }
  }

  async function copyOutput() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    status = 'Resultado copiado.';
  }

  function downloadOutput() {
    if (!output) return;
    const blob = new Blob([output], { type: mode === 'csvToJson' ? 'application/json' : 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = outputName;
    link.click();
    URL.revokeObjectURL(url);
  }

  function loadExample() {
    if (mode === 'csvToJson') {
      input = 'producto,precio,stock\nCafé,120,14\nTaza,85,32';
    } else {
      input = '[\n  { "producto": "Café", "precio": 120, "stock": 14 },\n  { "producto": "Taza", "precio": 85, "stock": 32 }\n]';
    }
    output = '';
    status = 'Ejemplo cargado.';
  }
</script>

<div class="tool-panel" id="panel-csv-json">
  <div class="panel-header">
    <h2><i data-lucide="table"></i> CSV ↔ JSON</h2>
    <p>Convierte tablas y datos estructurados sin depender de servicios externos</p>
  </div>

  <div class="data-convert-toolbar">
    <div>
      <label for="data-mode">Conversión</label>
      <select id="data-mode" bind:value={mode}>
        <option value="csvToJson">CSV a JSON</option>
        <option value="jsonToCsv">JSON a CSV</option>
      </select>
    </div>
    {#if mode === 'csvToJson'}
      <div>
        <label for="data-delimiter">Separador</label>
        <select id="data-delimiter" bind:value={delimiter}>
          <option value="auto">Detectar</option>
          <option value="comma">Coma</option>
          <option value="semicolon">Punto y coma</option>
          <option value="tab">Tab</option>
        </select>
      </div>
      <label class="inline-toggle data-convert-check" for="data-headers">
        <input id="data-headers" type="checkbox" bind:checked={hasHeaders}>
        Primera fila como encabezados
      </label>
    {/if}
    <button class="btn" type="button" onclick={loadExample}><i data-lucide="sparkles"></i> Ejemplo</button>
  </div>

  <div class="data-convert-grid">
    <div>
      <label for="data-input">Entrada</label>
      <textarea id="data-input" bind:value={input} spellcheck="false"></textarea>
    </div>
    <div>
      <label for="data-output">Resultado</label>
      <textarea id="data-output" bind:value={output} readonly spellcheck="false" placeholder="El resultado aparecerá aquí"></textarea>
    </div>
  </div>

  <div class="data-convert-actions">
    <button class="btn" type="button" onclick={convert}><i data-lucide="refresh-cw"></i> Convertir</button>
    <button class="btn" type="button" onclick={copyOutput} disabled={!output}><i data-lucide="copy"></i> Copiar</button>
    <button class="btn btn-green" type="button" onclick={downloadOutput} disabled={!output}><i data-lucide="download"></i> Descargar</button>
  </div>

  <div class="output">{status}</div>
</div>
