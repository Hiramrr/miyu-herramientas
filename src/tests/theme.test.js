import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Lee el CSS real: comprueba los colores que declara cada tema, no una copia de ellos.
const css = fs.readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../styles/main.css'), 'utf8');

function parseVars(block) {
  const vars = {};
  for (const [, name, value] of block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) vars[name] = value.trim();
  return vars;
}

function themeVars() {
  const root = css.match(/:root\s*\{([^}]*)\}/)[1];
  const themes = { light: parseVars(root) };
  for (const [, id, block] of css.matchAll(/body\.theme-([\w-]+)\s*\{([^}]*)\}/g)) {
    themes[id] = { ...themes.light, ...parseVars(block) };
  }
  return themes;
}

function declaration(selector, property) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rule = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
  if (!rule) throw new Error(`no hay regla para ${selector}`);
  const found = rule[1].match(new RegExp(`${property}\\s*:\\s*var\\((--[\\w-]+)\\)`));
  if (!found) throw new Error(`${selector} no declara ${property} como variable`);
  return found[1];
}

function hexToRgb(hex) {
  const value = hex.replace('#', '');
  const full = value.length === 3 ? [...value].map((c) => c + c).join('') : value;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
}

function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe('selected category count in the tool finder', () => {
  const themes = themeVars();
  const textVar = declaration('.tool-finder-tabs button.active span', 'color');
  const backgroundVar = declaration('.tool-finder-tabs button.active span', 'background');

  it('has a color and background declared for every theme', () => {
    expect(Object.keys(themes).length).toBeGreaterThan(5);
    for (const [id, vars] of Object.entries(themes)) {
      expect(vars[textVar], `${id} sin ${textVar}`).toBeDefined();
      expect(vars[backgroundVar], `${id} sin ${backgroundVar}`).toBeDefined();
    }
  });

  it('meets WCAG AA 4.5:1 in every theme', () => {
    const hex = /^#[0-9a-f]{3}([0-9a-f]{3})?$/i;
    const failures = [];
    for (const [id, vars] of Object.entries(themes)) {
      const text = vars[textVar];
      const background = vars[backgroundVar];
      // Un color no hex no se puede medir aquí; falla en vez de saltarse el tema.
      if (!hex.test(text) || !hex.test(background)) {
        failures.push(`${id}: color no hex (${text}, ${background})`);
        continue;
      }
      const ratio = contrast(text, background);
      if (ratio < 4.5) failures.push(`${id}: ${ratio.toFixed(2)}:1`);
    }
    expect(failures).toEqual([]);
  });
});
