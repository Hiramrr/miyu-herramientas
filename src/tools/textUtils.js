import { escapeHtml } from './codeShell.js';

const LOCALE = 'es';

export function toTitleCase(text) {
  return text.replace(/\S+/g, (word) => word.toLocaleLowerCase(LOCALE).replace(/\p{L}/u, (char) => char.toLocaleUpperCase(LOCALE)));
}

function splitWords(text) {
  return text
    .normalize('NFC')
    .replace(/(\p{Ll}|\p{N})(\p{Lu})/gu, '$1 $2')
    .replace(/(\p{Lu})(\p{Lu}\p{Ll})/gu, '$1 $2')
    .split(/[^\p{L}\p{M}\p{N}]+/u)
    .filter(Boolean);
}

function capitalize(word) {
  const lower = word.toLocaleLowerCase(LOCALE);
  return lower.charAt(0).toLocaleUpperCase(LOCALE) + lower.slice(1);
}

export function toSlug(text) {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function convertCase(text, type) {
  const words = splitWords(text);
  switch (type) {
    case 'camel': return words.map((word, index) => index ? capitalize(word) : word.toLocaleLowerCase(LOCALE)).join('');
    case 'pascal': return words.map(capitalize).join('');
    case 'snake': return words.join('_').toLocaleLowerCase(LOCALE);
    case 'kebab': return words.join('-').toLocaleLowerCase(LOCALE);
    case 'upper': return words.join('_').toLocaleUpperCase(LOCALE);
    case 'lower': return text.toLocaleLowerCase(LOCALE);
    case 'slug': return toSlug(text);
    case 'title': return toTitleCase(text);
    default: return text;
  }
}

export function encodeBase64(text) {
  let binary = '';
  for (const byte of new TextEncoder().encode(text)) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function decodeBase64(text) {
  let binary;
  try {
    binary = atob(text.replace(/\s+/g, ''));
  } catch {
    throw new Error('El texto no es Base64 válido.');
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
  } catch {
    throw new Error('El Base64 no contiene texto UTF-8.');
  }
}

export function reverseText(text) {
  // Graphemes keep accents, emoji and ñ written with combining marks intact.
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    return Array.from(new Intl.Segmenter(LOCALE, { granularity: 'grapheme' }).segment(text), (part) => part.segment).reverse().join('');
  }
  return Array.from(text.normalize('NFC')).reverse().join('');
}

export function renderMarkdown(markdown) {
  return escapeHtml(markdown)
    .replace(/^### (.*)$/gm, '<h3>$1</h3>')
    .replace(/^## (.*)$/gm, '<h2>$1</h2>')
    .replace(/^# (.*)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
}
