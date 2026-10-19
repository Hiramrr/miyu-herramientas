<script>
  import { convertCase as convertTextCase, decodeBase64, encodeBase64, renderMarkdown as markdownToHtml, reverseText, toTitleCase } from '../tools/textUtils.js';
  import { buildDiffRows } from '../tools/textDiff.js';
  import { escapeHtml as escapeHTMLText } from '../tools/codeShell.js';

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
    try {
      switch (t) {
        case 'upper': o = i.toLocaleUpperCase('es'); break;
        case 'lower': o = i.toLocaleLowerCase('es'); break;
        case 'title': o = toTitleCase(i); break;
        case 'trim': o = i.replace(/\s+/g, ' ').trim(); break;
        case 'base64enc': o = encodeBase64(i); break;
        case 'base64dec': o = decodeBase64(i); break;
        case 'urlenc': o = encodeURIComponent(i); break;
        case 'urldec': o = decodeURIComponent(i); break;
        case 'reverse': o = reverseText(i); break;
      }
    } catch (error) {
      o = 'Error: ' + (error instanceof URIError ? 'el texto no es una URL codificada válida.' : error.message);
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
    document.getElementById('case-output').value = convertTextCase(document.getElementById('case-input').value, t);
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
    var re = new RegExp(f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), cs ? 'gu' : 'giu');
    // A function keeps "$&" or "$1" in the replacement literal.
    document.getElementById('fr-output').value = t.replace(re, function() { return r; });
  }

  function copyFR() {
    var t = document.getElementById('fr-output').value;
    if (t) navigator.clipboard.writeText(t);
  }

  function renderMarkdown() {
    document.getElementById('md-output').innerHTML = markdownToHtml(document.getElementById('md-input').value);
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

  function diffCell(row, number, html) {
    return '<div class="diff-cell diff-' + row.type + '"><span class="diff-line">' + (number || '') + '</span><code>' + (html || '&nbsp;') + '</code></div>';
  }

  function renderSideBySideDiff() {
    var original = document.getElementById('diff-orig');
    var next = document.getElementById('diff-new');
    var output = document.getElementById('diff-output');
    var summary = document.getElementById('diff-summary');
    if (!original || !next || !output) return;
    var result = buildDiffRows(original.value, next.value);
    var rows = result.rows;
    var changed = rows.filter(function(row) { return row.type !== 'same'; }).length;
    var added = rows.filter(function(row) { return row.type === 'added'; }).length;
    var removed = rows.filter(function(row) { return row.type === 'removed'; }).length;
    var modified = rows.filter(function(row) { return row.type === 'changed'; }).length;
    if (summary) {
      summary.innerHTML = '<span>' + changed + ' diferencias</span><span>' + modified + ' modificadas</span><span>' + added + ' agregadas</span><span>' + removed + ' eliminadas</span>' +
        (result.truncated ? '<span>Textos muy distintos: el bloque central se muestra como reemplazo completo.</span>' : '');
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
        return diffCell(row, row.leftNumber, parts.left) + diffCell(row, row.rightNumber, parts.right);
      }).join('') + '</div>';
  }
</script>

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

  <div class="tool-panel" id="panel-markdown">
    <div class="panel-header">
      <h2><i data-lucide="file-text"></i> Vista Previa Markdown</h2>
      <p>Escribe markdown y ve el resultado renderizado al instante</p>
    </div>
    <textarea id="md-input" bind:value={mdInput} placeholder="# Título&#10;**negrita** *cursiva*"></textarea>
    <button class="btn" onclick={renderMarkdown}><i data-lucide="eye"></i> Ver resultado</button>
    <div class="output" id="md-output" style="line-height:1.7"></div>
  </div>

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
