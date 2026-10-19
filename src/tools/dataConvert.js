const DELIMITERS = { tab: '\t', semicolon: ';', comma: ',' };

export function detectDelimiter(text, choice = 'auto') {
  if (DELIMITERS[choice]) return DELIMITERS[choice];
  const firstLine = text.split(/\r?\n/).find((line) => line.trim()) || '';
  return [',', ';', '\t']
    .map((item) => ({ item, count: firstLine.split(item).length }))
    .sort((a, b) => b.count - a.count)[0].item;
}

// Returns rows with the source line where each one starts, for precise error messages.
export function parseCsv(text, sep) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  let line = 1;
  let rowLine = 1;
  const pushRow = () => {
    row.push(cell);
    const blank = row.length === 1 && row[0].trim() === '';
    if (!blank) rows.push({ line: rowLine, cells: row });
    row = [];
    cell = '';
  };
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === sep && !quoted) {
      row.push(cell);
      cell = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1;
      pushRow();
      line += 1;
      rowLine = line;
    } else {
      if (char === '\n') line += 1;
      cell += char;
    }
  }
  if (quoted) throw new Error(`Hay comillas sin cerrar desde la fila de la línea ${rowLine}.`);
  pushRow();
  return rows;
}

export function csvToJson(text, { delimiter = 'auto', hasHeaders = true } = {}) {
  const clean = text.replace(/^\uFEFF/, '');
  const rows = parseCsv(clean, detectDelimiter(clean, delimiter));
  if (!rows.length) throw new Error('No hay filas para convertir.');
  if (!hasHeaders) return rows.map((row) => row.cells);

  const headers = rows[0].cells.map((header, index) => header.trim() || `columna_${index + 1}`);
  const seen = new Map();
  headers.forEach((header, index) => {
    if (seen.has(header)) {
      throw new Error(`El encabezado "${header}" se repite en las columnas ${seen.get(header) + 1} y ${index + 1}. Renombra uno o desmarca "Primera fila como encabezados".`);
    }
    seen.set(header, index);
  });

  return rows.slice(1).map(({ line, cells }) => {
    if (cells.length !== headers.length) {
      throw new Error(`La fila de la línea ${line} tiene ${cells.length} columnas y el encabezado tiene ${headers.length}. Revisa el separador o las comillas.`);
    }
    return Object.fromEntries(headers.map((header, index) => [header, cells[index]]));
  });
}

function csvCell(value) {
  const text = value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
  return /[",\n\r;]|^\s|\s$/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function jsonToCsv(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new Error('JSON inválido: ' + error.message, { cause: error });
  }
  const rows = Array.isArray(parsed) ? parsed : [parsed];
  if (!parsed || typeof parsed !== 'object') throw new Error('El JSON debe ser un objeto o una lista de objetos.');
  if (!rows.length) throw new Error('La lista JSON está vacía.');

  if (rows.every(Array.isArray)) return rows.map((row) => row.map(csvCell).join(',')).join('\n');
  rows.forEach((row, index) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      throw new Error(`El elemento ${index + 1} no es un objeto. Usa una lista de objetos o una lista de listas.`);
    }
  });
  const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const body = rows.map((row) => headers.map((header) => csvCell(row[header])).join(','));
  return [headers.map(csvCell).join(','), ...body].join('\n');
}
