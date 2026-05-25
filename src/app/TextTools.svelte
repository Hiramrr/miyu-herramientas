<script>
  import { activeTool } from '../tools/activeTool.svelte.js';

  let textInput = '';
  let caseInput = '';
  let loremCount = 3;
  let frInput = '';
  let frFind = '';
  let frReplace = '';
  let frCaseSens = false;
  let mdInput = '';
  let diffOrig = '';
  let diffNew = '';

  function textTransform(t) {
    var i = document.getElementById('text-input').value;
    var o = '';
    switch (t) {
      case 'upper': o = i.toUpperCase(); break;
      case 'lower': o = i.toLowerCase(); break;
      case 'title': o = i.replace(/\w\S*/g, function(t) { return t.charAt(0).toUpperCase() + t.substr(1).toLowerCase(); }); break;
      case 'trim': o = i.replace(/\s+/g, ' ').trim(); break;
      case 'base64enc': o = btoa(unescape(encodeURIComponent(i))); break;
      case 'base64dec': o = decodeURIComponent(escape(atob(i))); break;
      case 'urlenc': o = encodeURIComponent(i); break;
      case 'urldec': o = decodeURIComponent(i); break;
      case 'reverse': o = i.split('').reverse().join(''); break;
    }
    document.getElementById('text-output').value = o;
    updateTextStats(i);
  }

  function updateTextStats(value) {
    var stats = document.getElementById('text-stats');
    if (!stats) return;
    var text = value || '';
    var words = wordCount(text);
    var chars = text.length;
    var charsNoSpaces = text.replace(/\s/g, '').length;
    var lines = text ? text.split('\n').length : 0;
    var sentences = sentenceCount(text);
    var paragraphs = text.trim() ? text.trim().split(/\n\s*\n/).filter(Boolean).length : 0;
    var minutes = Math.max(1, Math.ceil(words / 225));
    stats.innerHTML = [
      ['Caracteres', chars],
      ['Sin espacios', charsNoSpaces],
      ['Palabras', words],
      ['Frases', sentences],
      ['Líneas', lines],
      ['Párrafos', paragraphs],
      ['Lectura', words ? minutes + ' min' : '0 min']
    ].map(function(item) {
      return '<div class="text-stat-card"><strong>' + item[1] + '</strong><span>' + item[0] + '</span></div>';
    }).join('');
  }

  function wordCount(value) {
    var matches = (value || '').trim().match(/\S+/g);
    return matches ? matches.length : 0;
  }

  function sentenceCount(value) {
    var clean = (value || '').trim();
    if (!clean) return 0;
    var matches = clean.match(/[^.!?\u3002\uff01\uff1f]+[.!?\u3002\uff01\uff1f]+|[^.!?\u3002\uff01\uff1f]+$/g);
    return matches ? matches.filter(function(item) { return item.trim().length > 0; }).length : 0;
  }

  function createToolButton(label, icon, onClick, extraClass) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn ' + (extraClass || '');
    button.innerHTML = (icon ? '<i data-lucide="' + icon + '"></i> ' : '') + label;
    button.addEventListener('click', onClick);
    return button;
  }

  function enhanceTextTool() {
    var input = document.getElementById('text-input');
    var output = document.getElementById('text-output');
    if (!input || !output || document.getElementById('text-extra-actions')) return;
    var stats = document.getElementById('text-stats');
    if (stats) stats.classList.add('text-stats-grid');
    var row = document.createElement('div');
    row.className = 'btn-row tool-extra-actions';
    row.id = 'text-extra-actions';
    row.appendChild(createToolButton('Copiar resultado', 'copy', function() {
      if (output.value && navigator.clipboard) navigator.clipboard.writeText(output.value);
    }, 'btn-green'));
    row.appendChild(createToolButton('Usar resultado como entrada', 'arrow-up', function() {
      if (!output.value) return;
      input.value = output.value;
      output.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.focus();
    }));
    row.appendChild(createToolButton('Limpiar', 'eraser', function() {
      input.value = '';
      output.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.focus();
    }, 'btn-quiet'));
    output.insertAdjacentElement('afterend', row);
    input.addEventListener('input', function() { updateTextStats(input.value); });
    updateTextStats(input.value);
  }

  function copyTextOutput() {
    var output = document.getElementById('text-output');
    if (output.value && navigator.clipboard) navigator.clipboard.writeText(output.value);
  }

  function useTextOutputAsInput() {
    var input = document.getElementById('text-input');
    var output = document.getElementById('text-output');
    if (!output.value) return;
    input.value = output.value;
    output.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.focus();
  }

  function clearText() {
    var input = document.getElementById('text-input');
    var output = document.getElementById('text-output');
    input.value = '';
    output.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.focus();
  }

  function convertCase(t) {
    var i = document.getElementById('case-input').value;
    var o = '';
    switch (t) {
      case 'camel': o = i.replace(/(?:^\w|[A-Z]|\b\w)/g, function(w, i) { return i === 0 ? w.toLowerCase() : w.toUpperCase(); }).replace(/\s+/g, ''); break;
      case 'snake': o = i.replace(/\s+/g, '_').toLowerCase(); break;
      case 'kebab': o = i.replace(/\s+/g, '-').toLowerCase(); break;
      case 'pascal': o = i.replace(/(?:^\w|[A-Z]|\b\w)/g, function(w) { return w.toUpperCase(); }).replace(/\s+/g, ''); break;
      case 'upper': o = i.replace(/\s+/g, '_').toUpperCase(); break;
      case 'lower': o = i.toLowerCase(); break;
      case 'slug': o = i.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); break;
      case 'title': o = i.replace(/\w\S*/g, function(t) { return t.charAt(0).toUpperCase() + t.substr(1).toLowerCase(); }); break;
    }
    document.getElementById('case-output').value = o;
  }

  var lw = ['lorem','ipsum','dolor','sit','amet','consectetur','adipiscing','elit','sed','do','eiusmod','tempor','incididunt','ut','labore','et','dolore','magna','aliqua','enim','ad','minim','veniam','quis','nostrud','exercitation','ullamco','laboris','nisi','aliquip','ex','ea','commodo','consequat','duis','aute','irure','in','reprehenderit','voluptate','velit','esse','cillum','fugiat','nulla','pariatur','excepteur','sint','occaecat','cupidatat','non','proident','sunt','culpa','qui','officia','deserunt','mollit','anim','id','est','laborum'];

  function generateLorem() {
    var c = parseInt(document.getElementById('lorem-count').value) || 3;
    var p = [];
    for (var i = 0; i < c; i++) {
      var w = [];
      var l = 40 + Math.floor(Math.random() * 30);
      for (var j = 0; j < l; j++) {
        w.push(lw[Math.floor(Math.random() * lw.length)]);
      }
      w[0] = w[0].charAt(0).toUpperCase() + w[0].slice(1);
      p.push(w.join(' ') + '.');
    }
    document.getElementById('lorem-output').textContent = p.join('\n\n');
  }

  function copyLorem() {
    var t = document.getElementById('lorem-output').textContent;
    if (t) navigator.clipboard.writeText(t);
  }

  function findReplace() {
    var t = document.getElementById('fr-input').value;
    var f = document.getElementById('fr-find').value;
    var r = document.getElementById('fr-replace').value;
    if (!f) return;
    var cs = document.getElementById('fr-casesens').checked;
    var flags = 'g';
    if (!cs) flags += 'i';
    var re = new RegExp(f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
    document.getElementById('fr-output').value = t.replace(re, r);
  }

  function copyFR() {
    var t = document.getElementById('fr-output').value;
    if (t) navigator.clipboard.writeText(t);
  }

  function renderMarkdown() {
    var m = document.getElementById('md-input').value;
    var h = m.replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
    document.getElementById('md-output').innerHTML = h;
  }

  function compareText() {
    var o = document.getElementById('diff-orig').value;
    var n = document.getElementById('diff-new').value;
    var ol = o.split('\n');
    var nl = n.split('\n');
    var out = '';
    var len = Math.max(ol.length, nl.length);
    for (var i = 0; i < len; i++) {
      var a = ol[i] || '';
      var b = nl[i] || '';
      if (a === b) {
        out += '  ' + (i + 1) + ': ' + a + '\n';
      } else {
        if (a) out += '- ' + (i + 1) + ': ' + a + '\n';
        if (b) out += '+ ' + (i + 1) + ': ' + b + '\n';
      }
    }
    document.getElementById('diff-output').textContent = out || 'Sin diferencias';
  }

  function buildDiffRows(originalText, nextText) {
    var original = originalText.split('\n');
    var next = nextText.split('\n');
    var max = Math.max(original.length, next.length);
    var rows = [];
    for (var i = 0; i < max; i++) {
      var left = original[i] || '';
      var right = next[i] || '';
      var type = left === right ? 'same' : left && right ? 'changed' : left ? 'removed' : 'added';
      rows.push({ number: i + 1, left: left, right: right, type: type });
    }
    return rows;
  }

  function inlineDiff(left, right) {
    var start = 0;
    while (start < left.length && start < right.length && left[start] === right[start]) start++;
    var leftEnd = left.length - 1;
    var rightEnd = right.length - 1;
    while (leftEnd >= start && rightEnd >= start && left[leftEnd] === right[rightEnd]) {
      leftEnd--;
      rightEnd--;
    }
    return {
      left: escapeHTMLText(left.slice(0, start)) + (leftEnd >= start ? '<mark>' + escapeHTMLText(left.slice(start, leftEnd + 1)) + '</mark>' : '') + escapeHTMLText(left.slice(leftEnd + 1)),
      right: escapeHTMLText(right.slice(0, start)) + (rightEnd >= start ? '<mark>' + escapeHTMLText(right.slice(start, rightEnd + 1)) + '</mark>' : '') + escapeHTMLText(right.slice(rightEnd + 1))
    };
  }

  function renderSideBySideDiff() {
    var original = document.getElementById('diff-orig');
    var next = document.getElementById('diff-new');
    var output = document.getElementById('diff-output');
    var summary = document.getElementById('diff-summary');
    if (!original || !next || !output) return;
    var rows = buildDiffRows(original.value, next.value);
    var changed = rows.filter(function(row) { return row.type !== 'same'; }).length;
    var added = rows.filter(function(row) { return row.type === 'added'; }).length;
    var removed = rows.filter(function(row) { return row.type === 'removed'; }).length;
    var modified = rows.filter(function(row) { return row.type === 'changed'; }).length;
    if (summary) {
      summary.innerHTML = '<span>' + changed + ' diferencias</span><span>' + modified + ' modificadas</span><span>' + added + ' agregadas</span><span>' + removed + ' eliminadas</span>';
    }
    if (!original.value && !next.value) {
      output.innerHTML = '<div class="diff-empty">Pega dos textos y compara para ver cambios lado a lado.</div>';
      return;
    }
    if (!changed) {
      output.innerHTML = '<div class="diff-empty success">Sin diferencias.</div>';
      return;
    }
    output.innerHTML = '<div class="diff-table"><div class="diff-head">Original</div><div class="diff-head">Nuevo</div>' +
      rows.map(function(row) {
        var parts = row.type === 'changed' ? inlineDiff(row.left, row.right) : { left: escapeHTMLText(row.left), right: escapeHTMLText(row.right) };
        return '<div class="diff-cell diff-' + row.type + '"><span class="diff-line">' + row.number + '</span><code>' + (parts.left || '&nbsp;') + '</code></div><div class="diff-cell diff-' + row.type + '"><span class="diff-line">' + row.number + '</span><code>' + (parts.right || '&nbsp;') + '</code></div>';
      }).join('') + '</div>';
  }

  function enhanceDiffTool() {
    var panel = document.getElementById('panel-diff');
    var original = document.getElementById('diff-orig');
    var next = document.getElementById('diff-new');
    var output = document.getElementById('diff-output');
    if (!panel || !original || !next || !output || document.getElementById('diff-summary')) return;
    var labels = panel.querySelectorAll('label');
    labels.forEach(function(label) { label.classList.add('diff-legacy-label'); label.removeAttribute('style'); });
    var fields = document.createElement('div');
    fields.className = 'diff-input-grid';
    var leftField = document.createElement('div');
    var rightField = document.createElement('div');
    leftField.className = 'diff-field';
    rightField.className = 'diff-field';
    original.insertAdjacentElement('beforebegin', fields);
    fields.appendChild(leftField);
    fields.appendChild(rightField);
    leftField.appendChild(labels[0]);
    leftField.appendChild(original);
    rightField.appendChild(labels[1]);
    rightField.appendChild(next);
    var summary = document.createElement('div');
    summary.id = 'diff-summary';
    summary.className = 'diff-summary';
    output.insertAdjacentElement('beforebegin', summary);
    output.className = 'output diff-output';
    output.removeAttribute('style');
    var compareButton = panel.querySelector('button[onclick="compareText()"]');
    if (compareButton) {
      compareButton.removeAttribute('onclick');
      compareButton.addEventListener('click', renderSideBySideDiff);
      if (!compareButton.parentElement.classList.contains('btn-row')) {
        var btnRow = document.createElement('div');
        btnRow.className = 'btn-row';
        compareButton.parentElement.insertBefore(btnRow, compareButton);
        btnRow.appendChild(compareButton);
      }
    }
    original.addEventListener('input', renderSideBySideDiff);
    next.addEventListener('input', renderSideBySideDiff);
    renderSideBySideDiff();
  }

  function escapeHTMLText(value) {
    return (value || '').toString().replace(/[&<>"']/g, function(char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }
</script>

{#if activeTool.id === 'text'}
  <div class="tool-panel" id="panel-text">
    <div class="panel-header">
      <h2><i data-lucide="text"></i> Transformar Texto</h2>
      <p>Convierte texto a mayúsculas, minúsculas, codifica en Base64 y más</p>
    </div>
    <textarea id="text-input" bind:value={textInput} oninput={() => updateTextStats(document.getElementById('text-input').value)} placeholder="Escribe o pega tu texto aquí..."></textarea>
    <div class="btn-grid">
      <button class="btn" onclick={() => textTransform('upper')}>MAYÚSCULAS</button>
      <button class="btn" onclick={() => textTransform('lower')}>minúsculas</button>
      <button class="btn" onclick={() => textTransform('title')}>Título</button>
      <button class="btn" onclick={() => textTransform('trim')}>Limpiar</button>
      <button class="btn" onclick={() => textTransform('base64enc')}>Base64</button>
      <button class="btn" onclick={() => textTransform('base64dec')}>Decode</button>
      <button class="btn" onclick={() => textTransform('urlenc')}>URL Enc</button>
      <button class="btn" onclick={() => textTransform('urldec')}>URL Dec</button>
      <button class="btn" onclick={() => textTransform('reverse')}>Invertir</button>
    </div>
    <div class="output text-stats-grid" id="text-stats"></div>
    <textarea id="text-output" readonly style="margin-top:10px" placeholder="Resultado..."></textarea>
    <div class="btn-row tool-extra-actions" id="text-extra-actions">
      <button class="btn btn-green" onclick={copyTextOutput}><i data-lucide="copy"></i> Copiar resultado</button>
      <button class="btn" onclick={useTextOutputAsInput}><i data-lucide="arrow-up"></i> Usar resultado como entrada</button>
      <button class="btn btn-quiet" onclick={clearText}><i data-lucide="eraser"></i> Limpiar</button>
    </div>
  </div>
{/if}

{#if activeTool.id === 'case'}
  <div class="tool-panel" id="panel-case">
    <div class="panel-header">
      <h2><i data-lucide="case-sensitive"></i> Conversor de Casos</h2>
      <p>Convierte texto entre diferentes formatos de nomenclatura</p>
    </div>
    <textarea id="case-input" bind:value={caseInput} placeholder="Escribe texto aquí..."></textarea>
    <div class="btn-grid" style="grid-template-columns:repeat(4,1fr)">
      <button class="btn" onclick={() => convertCase('camel')}>camelCase</button>
      <button class="btn" onclick={() => convertCase('snake')}>snake_case</button>
      <button class="btn" onclick={() => convertCase('kebab')}>kebab-case</button>
      <button class="btn" onclick={() => convertCase('pascal')}>PascalCase</button>
      <button class="btn" onclick={() => convertCase('upper')}>UPPER_CASE</button>
      <button class="btn" onclick={() => convertCase('lower')}>lower case</button>
      <button class="btn" onclick={() => convertCase('slug')}>slug-url</button>
      <button class="btn" onclick={() => convertCase('title')}>Title Case</button>
    </div>
    <textarea id="case-output" readonly style="margin-top:10px" placeholder="Resultado..."></textarea>
  </div>
{/if}

{#if activeTool.id === 'lorem'}
  <div class="tool-panel" id="panel-lorem">
    <div class="panel-header">
      <h2><i data-lucide="file-text"></i> Lorem Ipsum</h2>
      <p>Genera texto de prueba en español para mockups y diseño</p>
    </div>
    <label for="lorem-count">Número de párrafos</label>
    <input type="number" id="lorem-count" bind:value={loremCount} min="1" max="20">
    <div class="btn-row">
      <button class="btn" onclick={generateLorem}><i data-lucide="refresh-cw"></i> Generar</button>
      <button class="btn btn-green" onclick={copyLorem}><i data-lucide="copy"></i> Copiar</button>
    </div>
    <div class="output" id="lorem-output" style="max-height:300px;overflow-y:auto"></div>
  </div>
{/if}

{#if activeTool.id === 'findreplace'}
  <div class="tool-panel" id="panel-findreplace">
    <div class="panel-header">
      <h2><i data-lucide="search"></i> Buscar y Reemplazar</h2>
      <p>Encuentra palabras o frases en un texto y sustitúyelas fácilmente</p>
    </div>
    <textarea id="fr-input" bind:value={frInput} placeholder="Escribe o pega el texto original aquí..."></textarea>
    <label for="fr-find">Buscar</label>
    <input type="text" id="fr-find" bind:value={frFind} placeholder="Texto a buscar">
    <label for="fr-replace">Reemplazar con</label>
    <input type="text" id="fr-replace" bind:value={frReplace} placeholder="Texto de reemplazo">
    <div class="checkbox-row"><input type="checkbox" id="fr-casesens" bind:checked={frCaseSens}><label for="fr-casesens">Distinguir mayúsculas</label></div>
    <div class="btn-row">
      <button class="btn" onclick={findReplace}><i data-lucide="search"></i> Reemplazar todo</button>
      <button class="btn btn-green" onclick={copyFR}><i data-lucide="copy"></i> Copiar resultado</button>
    </div>
    <textarea id="fr-output" readonly style="margin-top:10px" placeholder="Resultado..."></textarea>
  </div>
{/if}

{#if activeTool.id === 'markdown'}
  <div class="tool-panel" id="panel-markdown">
    <div class="panel-header">
      <h2><i data-lucide="file-text"></i> Vista Previa Markdown</h2>
      <p>Escribe markdown y ve el resultado renderizado al instante</p>
    </div>
    <textarea id="md-input" bind:value={mdInput} placeholder="# Título&#10;**negrita** *cursiva*"></textarea>
    <button class="btn" onclick={renderMarkdown}><i data-lucide="eye"></i> Ver resultado</button>
    <div class="output" id="md-output" style="line-height:1.7"></div>
  </div>
{/if}

{#if activeTool.id === 'diff'}
  <div class="tool-panel" id="panel-diff">
    <div class="panel-header">
      <h2><i data-lucide="git-compare"></i> Comparar Textos</h2>
      <p>Compara dos textos y encuentra las diferencias entre ellos</p>
    </div>
    <div class="diff-input-grid">
      <div class="diff-field">
        <label class="diff-legacy-label" for="diff-orig">Texto Original</label>
        <textarea id="diff-orig" bind:value={diffOrig} oninput={renderSideBySideDiff} placeholder="Texto original..."></textarea>
      </div>
      <div class="diff-field">
        <label class="diff-legacy-label" for="diff-new">Texto Nuevo</label>
        <textarea id="diff-new" bind:value={diffNew} oninput={renderSideBySideDiff} placeholder="Texto modificado..."></textarea>
      </div>
    </div>
    <div class="btn-row">
      <button class="btn" onclick={renderSideBySideDiff}><i data-lucide="git-compare"></i> Comparar</button>
    </div>
    <div class="diff-summary" id="diff-summary"></div>
    <div class="output diff-output" id="diff-output"></div>
  </div>
{/if}
