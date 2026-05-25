<script>
  import { activeTool } from '../tools/activeTool.svelte.js';
  import { onDestroy } from 'svelte';

  // --- Unit ---
  let unitValue = '';
  let unitFrom = 'px';
  let unitTo = 'rem';
  let unitOutput = '';

  function convertUnit() {
    var v = parseFloat(unitValue);
    var f = unitFrom;
    var t = unitTo;
    if (isNaN(v)) return;
    var r;
    var c = { px: 1, rem: 16, em: 16, pt: 1.333 };
    var p = { px: 1, rem: 1 / 16, em: 1 / 16, pt: 1 / 1.333 };
    if (c[f] && c[t]) {
      r = v * c[f] * p[t];
    } else if (['kb', 'mb', 'gb'].includes(f) && ['kb', 'mb', 'gb'].includes(t)) {
      var b = { kb: 1024, mb: 1048576, gb: 1073741824 };
      r = v * b[f] / b[t];
    } else if (f === 'celsius' && t === 'fahrenheit') {
      r = v * 9 / 5 + 32;
    } else if (f === 'fahrenheit' && t === 'celsius') {
      r = (v - 32) * 5 / 9;
    } else {
      r = 'Conversión no soportada';
    }
    unitOutput = typeof r === 'number' ? v + ' ' + f + ' = ' + r.toFixed(4) + ' ' + t : r;
  }

  // --- Random ---
  let randMin = 1;
  let randMax = 100;
  let randCount = 5;
  let randOutput = '';

  function generateRandom() {
    var mn = parseInt(randMin) || 0;
    var mx = parseInt(randMax) || 1;
    var ct = parseInt(randCount) || 1;
    if (mn > mx) { var tmp = mn; mn = mx; mx = tmp; }
    var nums = [];
    for (var i = 0; i < ct; i++) {
      nums.push(Math.floor(Math.random() * (mx - mn + 1)) + mn);
    }
    randOutput = nums.join(', ');
  }

  async function copyRandom() {
    if (!randOutput) return;
    await navigator.clipboard.writeText(randOutput);
  }

  // --- Timestamp ---
  let tsInput = '';
  let dateInput = '';
  let tsOutput = '';

  function tsToDate() {
    var t = parseInt(tsInput);
    if (isNaN(t)) return;
    var d = new Date(t * 1000);
    tsOutput = d.toLocaleString('es-ES');
  }

  function dateToTs() {
    var s = dateInput;
    try {
      var d = new Date(s);
      if (isNaN(d.getTime())) throw new Error();
      tsOutput = String(Math.floor(d.getTime() / 1000));
    } catch (e) {
      tsOutput = 'Fecha inválida';
    }
  }

  // --- Timer ---
  let timerDisplay = '00:00:00';
  let timerMin = 5;

  let swI = null;
  let swS = 0;
  let cdI = null;
  let cdS = 0;

  function fmt(s) {
    return String(Math.floor(s / 3600)).padStart(2, '0') + ':' + String(Math.floor((s % 3600) / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  }

  function startStopwatch() {
    if (swI) return;
    swI = setInterval(() => {
      swS++;
      timerDisplay = fmt(swS);
    }, 1000);
  }

  function pauseStopwatch() {
    clearInterval(swI);
    swI = null;
  }

  function resetStopwatch() {
    pauseStopwatch();
    swS = 0;
    timerDisplay = '00:00:00';
  }

  function startCountdown() {
    var m = parseInt(timerMin) || 0;
    cdS = m * 60;
    if (cdI) return;
    cdI = setInterval(() => {
      if (cdS <= 0) {
        clearInterval(cdI);
        cdI = null;
        return;
      }
      cdS--;
      timerDisplay = fmt(cdS);
    }, 1000);
  }

  function pauseCountdown() {
    clearInterval(cdI);
    cdI = null;
  }

  function resetCountdown() {
    pauseCountdown();
    cdS = 0;
    timerDisplay = '00:00:00';
  }

  function setPreset(m) {
    timerMin = m;
    resetCountdown();
    timerDisplay = fmt(m * 60);
  }

  // --- Notes (enhanced manager) ---
  let notesData = [];
  let activeId = null;
  let noteTitle = '';
  let noteBody = '';
  let noteMeta = '';
  let saveTimer = null;

  function readJSON(key, fallback) {
    try {
      var value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function saveJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function currentNote() {
    return notesData.find(function(note) { return note.id === activeId; }) || notesData[0];
  }

  function persistNotes() {
    saveJSON('mh-notes-v2', notesData);
    localStorage.setItem('mh-active-note', activeId || '');
    var note = currentNote();
    if (note) localStorage.setItem('quickNotes', note.body || '');
  }

  function notePreview(note) {
    return (note.body || '').replace(/\s+/g, ' ').trim().slice(0, 90) || 'Sin contenido';
  }

  function loadActiveNote() {
    var note = currentNote();
    if (!note) return;
    noteTitle = note.title || '';
    noteBody = note.body || '';
    noteMeta = 'Guardado · ' + new Date(note.updatedAt || Date.now()).toLocaleString();
    notesData = notesData;
    persistNotes();
  }

  function updateActiveNote() {
    var note = currentNote();
    if (!note) return;
    note.title = noteTitle.trim() || 'Sin título';
    note.body = noteBody;
    note.updatedAt = Date.now();
    noteMeta = 'Guardando...';
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      persistNotes();
      notesData = notesData;
      noteMeta = 'Guardado · ' + new Date(note.updatedAt).toLocaleString();
    }, 180);
  }

  function createNote() {
    var note = { id: 'note-' + Date.now(), title: 'Nueva nota', body: '', updatedAt: Date.now() };
    notesData.unshift(note);
    activeId = note.id;
    persistNotes();
    loadActiveNote();
    setTimeout(() => {
      var el = document.getElementById('note-title');
      if (el) { el.focus(); el.select(); }
    }, 0);
  }

  function deleteNote() {
    if (!notesData.length) return;
    var note = currentNote();
    if (!note || !confirm('¿Eliminar esta nota?')) return;
    notesData = notesData.filter(function(item) { return item.id !== note.id; });
    if (!notesData.length) {
      notesData = [{ id: 'note-' + Date.now(), title: 'Nueva nota', body: '', updatedAt: Date.now() }];
    }
    activeId = notesData[0].id;
    persistNotes();
    loadActiveNote();
  }

  async function copyNote() {
    var note = currentNote();
    if (note && navigator.clipboard) await navigator.clipboard.writeText(note.body || '');
  }

  function downloadNote() {
    var note = currentNote();
    if (!note) return;
    var blob = new Blob([note.body || ''], { type: 'text/plain;charset=utf-8' });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = (note.title || 'nota').replace(/[^a-z0-9-_]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() + '.txt';
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function initNotes() {
    var saved = readJSON('mh-notes-v2', null);
    var legacy = localStorage.getItem('quickNotes') || '';
    notesData = Array.isArray(saved) && saved.length ? saved : [{
      id: 'note-' + Date.now(),
      title: legacy.trim().split('\n')[0].slice(0, 60) || 'Nota rápida',
      body: legacy,
      updatedAt: Date.now()
    }];
    activeId = localStorage.getItem('mh-active-note') || notesData[0].id;
    loadActiveNote();
  }

  initNotes();

  onDestroy(() => {
    if (saveTimer) clearTimeout(saveTimer);
    if (swI) clearInterval(swI);
    if (cdI) clearInterval(cdI);
  });
</script>

{#if activeTool.id === 'unit'}
  <div class="tool-panel" id="panel-unit">
    <div class="panel-header">
      <h2><i data-lucide="ruler"></i> Conversor de Unidades</h2>
      <p>Convierte entre unidades CSS, tamaños de archivo y temperaturas</p>
    </div>
    <label for="unit-value">Valor</label>
    <input type="number" id="unit-value" bind:value={unitValue} placeholder="100">
    <div style="display:flex;gap:10px;align-items:center;margin-top:12px">
      <select id="unit-from" bind:value={unitFrom} style="flex:1">
        <option value="px">px</option>
        <option value="rem">rem</option>
        <option value="em">em</option>
        <option value="pt">pt</option>
        <option value="kb">KB</option>
        <option value="mb">MB</option>
        <option value="gb">GB</option>
        <option value="celsius">°C</option>
        <option value="fahrenheit">°F</option>
      </select>
      <span style="color:var(--arrow-faint)">→</span>
      <select id="unit-to" bind:value={unitTo} style="flex:1">
        <option value="rem">rem</option>
        <option value="px">px</option>
        <option value="em">em</option>
        <option value="pt">pt</option>
        <option value="kb">KB</option>
        <option value="mb">MB</option>
        <option value="gb">GB</option>
        <option value="celsius">°C</option>
        <option value="fahrenheit">°F</option>
      </select>
    </div>
    <button class="btn" onclick={convertUnit}><i data-lucide="arrow-right-left"></i> Convertir</button>
    <div class="output" id="unit-output">{unitOutput}</div>
  </div>
{/if}

{#if activeTool.id === 'random'}
  <div class="tool-panel" id="panel-random">
    <div class="panel-header">
      <h2><i data-lucide="dice"></i> Generador de Números Aleatorios</h2>
      <p>Genera números aleatorios dentro de un rango, ideales para sorteos o decisiones</p>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
      <div><label for="rand-min">Mínimo</label><input type="number" id="rand-min" bind:value={randMin}></div>
      <div><label for="rand-max">Máximo</label><input type="number" id="rand-max" bind:value={randMax}></div>
    </div>
    <label for="rand-count">Cantidad de números</label>
    <input type="number" id="rand-count" bind:value={randCount} min="1" max="50">
    <div class="btn-row">
      <button class="btn" onclick={generateRandom}><i data-lucide="dice"></i> Generar</button>
      <button class="btn btn-green" onclick={copyRandom}><i data-lucide="copy"></i> Copiar</button>
    </div>
    <div class="output" id="rand-output" style="font-size:1.1rem;font-weight:600">{randOutput}</div>
  </div>
{/if}

{#if activeTool.id === 'timestamp'}
  <div class="tool-panel" id="panel-timestamp">
    <div class="panel-header">
      <h2><i data-lucide="clock"></i> Timestamp / Fecha</h2>
      <p>Convierte entre timestamps epoch y fechas legibles</p>
    </div>
    <label for="ts-input">Timestamp (epoch)</label>
    <input type="number" id="ts-input" bind:value={tsInput} placeholder="1700000000">
    <button class="btn" onclick={tsToDate}><i data-lucide="arrow-right"></i> A Fecha</button>
    <label for="date-input" style="margin-top:14px">O escribe fecha</label>
    <input type="text" id="date-input" bind:value={dateInput} placeholder="2024-01-15 10:30:00">
    <button class="btn" onclick={dateToTs}><i data-lucide="arrow-right"></i> A Timestamp</button>
    <div class="output" id="ts-output" style="font-family:monospace">{tsOutput}</div>
  </div>
{/if}

{#if activeTool.id === 'timer'}
  <div class="tool-panel" id="panel-timer">
    <div class="panel-header">
      <h2><i data-lucide="timer"></i> Cronómetro y Temporizador</h2>
      <p>Mide tiempos con el cronómetro o usa la cuenta regresiva</p>
    </div>
    <div class="timer-display" id="timer-display">{timerDisplay}</div>
    <div class="timer-controls">
      <button class="btn" onclick={startStopwatch}><i data-lucide="play"></i> Iniciar</button>
      <button class="btn" onclick={pauseStopwatch}><i data-lucide="pause"></i> Pausar</button>
      <button class="btn" onclick={resetStopwatch}><i data-lucide="rotate-ccw"></i> Reiniciar</button>
    </div>
    <hr>
    <label for="timer-min">Temporizador (minutos)</label>
    <input type="number" id="timer-min" bind:value={timerMin} min="0" max="180">
    <div class="tool-presets" id="timer-presets">
      <button class="btn" type="button" onclick={() => setPreset(5)}><i data-lucide="clock"></i> 5 min</button>
      <button class="btn" type="button" onclick={() => setPreset(15)}><i data-lucide="clock"></i> 15 min</button>
      <button class="btn" type="button" onclick={() => setPreset(25)}><i data-lucide="clock"></i> 25 min</button>
      <button class="btn" type="button" onclick={() => setPreset(45)}><i data-lucide="clock"></i> 45 min</button>
    </div>
    <div class="timer-controls" style="margin-top:12px">
      <button class="btn" onclick={startCountdown}><i data-lucide="play"></i> Iniciar</button>
      <button class="btn" onclick={pauseCountdown}><i data-lucide="pause"></i> Pausar</button>
      <button class="btn" onclick={resetCountdown}><i data-lucide="rotate-ccw"></i> Reiniciar</button>
    </div>
  </div>
{/if}

{#if activeTool.id === 'notes'}
  <div class="tool-panel" id="panel-notes">
    <div class="panel-header">
      <h2><i data-lucide="notebook"></i> Notas Rápidas</h2>
      <p>Guarda notas que se almacenan automáticamente en tu navegador</p>
    </div>
    <div class="notes-manager" id="notes-manager">
      <div class="notes-list-pane">
        <div class="notes-toolbar">
          <button class="btn" type="button" id="notes-new" onclick={createNote}><i data-lucide="plus"></i> Nueva</button>
        </div>
        <div class="notes-list" id="notes-list">
          {#each [...notesData].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)) as note}
            <button class="note-list-item {note.id === activeId ? 'active' : ''}" type="button" onclick={() => { activeId = note.id; loadActiveNote(); }}>
              <strong>{note.title || 'Sin título'}</strong>
              <span>{notePreview(note)}</span>
            </button>
          {/each}
        </div>
      </div>
      <div class="notes-editor-pane">
        <label for="note-title">Título</label>
        <input id="note-title" type="text" placeholder="Título de la nota" bind:value={noteTitle} oninput={updateActiveNote}>
        <label for="note-body">Contenido</label>
        <textarea id="note-body" placeholder="Escribe esta nota..." bind:value={noteBody} oninput={updateActiveNote}></textarea>
        <div class="notes-meta" id="note-meta">{noteMeta}</div>
        <div class="btn-row tool-extra-actions">
          <button class="btn btn-green" type="button" id="notes-copy" onclick={copyNote}><i data-lucide="copy"></i> Copiar</button>
          <button class="btn" type="button" id="notes-download" onclick={downloadNote}><i data-lucide="download"></i> TXT</button>
          <button class="btn btn-quiet" type="button" id="notes-delete" onclick={deleteNote}><i data-lucide="trash-2"></i> Eliminar</button>
        </div>
      </div>
    </div>
  </div>
{/if}
