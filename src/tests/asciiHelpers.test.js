import { describe, expect, it } from 'vitest';
import { asciiRowsToText } from '../app/asciiHelpers.js';

describe('ascii rows to text', () => {
  it('keeps one line break between rows for copy and TXT export', () => {
    const text = asciiRowsToText(['abc', 'def', 'ghi']);
    expect(text).toBe('abc\ndef\nghi');
    expect(text.split('\n')).toHaveLength(3);
  });

  it('keeps empty rows and handles no rows', () => {
    expect(asciiRowsToText(['a', '', 'b'])).toBe('a\n\nb');
    expect(asciiRowsToText([])).toBe('');
  });
});
