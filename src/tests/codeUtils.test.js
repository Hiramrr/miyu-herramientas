import { describe, it, expect } from 'vitest';
import { parseInBase, regexMatchesHtml, uuidV4 } from '../tools/codeUtils.js';

describe('code helpers', () => {
  it('rejects digits that do not belong to the base', () => {
    expect(() => parseInBase('102', 2)).toThrow();
    expect(() => parseInBase('12z', 10)).toThrow();
    expect(parseInBase('0xff', 16)).toBe(255n);
    expect(parseInBase('9007199254740993', 10).toString(16)).toBe('20000000000001');
  });

  it('escapes regex matches', () => {
    const html = regexMatchesHtml('<img[^>]*>', 'g', 'a <img src=x onerror=alert(1)>');
    expect(html).not.toContain('<img');
    expect(html).toContain('1 coincidencia');
  });

  it('creates v4 UUIDs', () => {
    expect(uuidV4()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});
