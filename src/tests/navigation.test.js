import { describe, expect, it } from 'vitest';
import { parseFavoriteIds, toolIdFromRow } from '../scripts/navigation.js';

function rowFrom(html) {
  const host = document.createElement('div');
  host.innerHTML = html;
  return host.firstElementChild;
}

describe('toolIdFromRow', () => {
  it('reads the id of a tool row', () => {
    expect(toolIdFromRow(rowFrom('<div class="tool-item" data-tool="json"></div>'))).toBe('json');
  });

  it('reads the id of a favorite row, which uses a different attribute', () => {
    const row = rowFrom('<div class="tool-item" data-sidebar-favorite-tool="qr"></div>');
    expect(toolIdFromRow(row)).toBe('qr');
  });

  it('returns null for the home row, so search opens the grid', () => {
    expect(toolIdFromRow(rowFrom('<div class="tool-item tool-home-item" data-tool-home></div>'))).toBeNull();
  });
});

describe('parseFavoriteIds', () => {
  const known = new Set(['json', 'qr', 'hash']);
  const isKnown = (id) => known.has(id);

  it('drops tools that no longer exist', () => {
    expect(parseFavoriteIds(['json', 'borrada', 'qr'], isKnown)).toEqual(['json', 'qr']);
  });

  it('keeps only the first copy of a repeated id', () => {
    expect(parseFavoriteIds(['qr', 'json', 'qr'], isKnown)).toEqual(['qr', 'json']);
  });

  it('ignores values that are not strings', () => {
    expect(parseFavoriteIds(['json', 3, null, { id: 'qr' }], isKnown)).toEqual(['json']);
  });

  it('returns an empty list when the stored value is not an array', () => {
    expect(parseFavoriteIds('json', isKnown)).toEqual([]);
    expect(parseFavoriteIds(null, isKnown)).toEqual([]);
  });
});
