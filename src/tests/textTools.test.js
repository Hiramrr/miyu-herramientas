import { describe, it, expect } from 'vitest';
import { convertCase, toTitleCase, toSlug, decodeBase64, encodeBase64, renderMarkdown, reverseText } from '../tools/textUtils.js';
import { buildDiffRows } from '../tools/textDiff.js';

describe('text conversions', () => {
  it('keeps Spanish letters intact', () => {
    expect(toTitleCase('él ángel ñandú ¿qué')).toBe('Él Ángel Ñandú ¿Qué');
    expect(toSlug('Canción Ñandú Pingüino')).toBe('cancion-nandu-pinguino');
    expect(convertCase('año próximo', 'camel')).toBe('añoPróximo');
    expect(convertCase('miVariable Ñu', 'snake')).toBe('mi_variable_ñu');
  });

  it('round-trips UTF-8 base64 and reports invalid input', () => {
    expect(decodeBase64(encodeBase64('ñandú 🐦'))).toBe('ñandú 🐦');
    expect(() => decodeBase64('%%%')).toThrow('Base64');
  });

  it('reverses graphemes, not code units', () => {
    expect(reverseText('ña🐦')).toBe('🐦añ');
  });

  it('escapes HTML before applying markdown', () => {
    const html = renderMarkdown('# Hola\n<img src=x onerror=alert(1)> **ok**');
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
    expect(html).toContain('<h1>Hola</h1>');
    expect(html).toContain('<strong>ok</strong>');
  });
});

describe('buildDiffRows', () => {
  const types = (a, b) => buildDiffRows(a, b).rows.map((row) => row.type);

  it('reports one insertion instead of shifting every line', () => {
    expect(types('a\nb\nc', 'x\na\nb\nc')).toEqual(['added', 'same', 'same', 'same']);
  });

  it('distinguishes an empty line from a missing one', () => {
    const { rows } = buildDiffRows('a\n\nb', 'a\nb');
    expect(rows).toContainEqual({ type: 'removed', left: '', right: null, leftNumber: 2, rightNumber: null });
  });

  it('pairs replaced lines and keeps numbering per side', () => {
    const { rows } = buildDiffRows('a\nb\nc\nd', 'a\nB\nc\nd\ne');
    expect(rows.map((row) => row.type)).toEqual(['same', 'changed', 'same', 'same', 'added']);
    expect(rows[4]).toMatchObject({ leftNumber: null, rightNumber: 5, right: 'e' });
  });

  it('handles large inputs and falls back when texts are too different', () => {
    const big = Array.from({ length: 20000 }, (_, i) => 'línea ' + i).join('\n');
    expect(buildDiffRows(big, big.replace('línea 10000', 'cambio')).rows.filter((row) => row.type !== 'same')).toHaveLength(1);
    const result = buildDiffRows('a\nb\nc', 'x\ny\nz', 2);
    expect(result.truncated).toBe(true);
    expect(result.rows).toHaveLength(3);
  });
});
