import { escapeHtml } from './codeShell.js';

const BASE_DIGITS = { 2: /^[01]+$/, 8: /^[0-7]+$/, 10: /^[0-9]+$/, 16: /^[0-9a-f]+$/i };
const BASE_PREFIX = { 2: '0b', 8: '0o', 10: '', 16: '0x' };

// BigInt keeps large values exact; parseInt would accept "12z" and lose precision past 2^53.
export function parseInBase(value, base) {
  let text = value.trim().replace(/[\s_]/g, '');
  const negative = text.startsWith('-');
  if (negative) text = text.slice(1);
  if (BASE_PREFIX[base] && text.toLowerCase().startsWith(BASE_PREFIX[base])) text = text.slice(2);
  if (!BASE_DIGITS[base].test(text)) throw new Error('Valor inválido para base ' + base + '.');
  const number = BigInt(BASE_PREFIX[base] + text);
  return negative ? -number : number;
}

export function uuidV4() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export const MAX_REGEX_MATCHES = 500;

// Returns escaped HTML: matches come from pasted text and must never become markup.
export function regexMatchesHtml(pattern, flags, text) {
  const regex = new RegExp(pattern, flags);
  const matches = [];
  if (regex.global) {
    for (const match of text.matchAll(regex)) {
      matches.push(match[0]);
      if (matches.length >= MAX_REGEX_MATCHES) break;
    }
  } else {
    const match = regex.exec(text);
    if (match) matches.push(match[0]);
  }
  if (!matches.length) return 'Sin coincidencias';
  const limit = matches.length >= MAX_REGEX_MATCHES ? ` (se muestran las primeras ${MAX_REGEX_MATCHES})` : '';
  return `<strong>${matches.length} coincidencia(s)${limit}:</strong><br>` + matches.map((match, index) => `${index + 1}. "${escapeHtml(match)}"`).join('<br>');
}
