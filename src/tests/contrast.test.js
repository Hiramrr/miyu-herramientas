import { describe, expect, it } from 'vitest';
import { contrastRatio, findContrastColor } from '../tools/contrast.js';

describe('contrast adjustment', () => {
  it('uses the WCAG luminance ratio', () => {
    expect(contrastRatio('#ffffff', '#000000')).toBe(21);
    expect(contrastRatio('#ffffff', '#ffffff')).toBe(1);
    expect(contrastRatio('#ffffff', '#777777')).toBeCloseTo(4.478, 3);
  });

  it.each([
    ['#ffffff', '#eeeeee', 4.5],
    ['#000000', '#111111', 7],
    ['#8bb8d4', '#8bb8d4', 4.5],
  ])('adjusts %s with text %s to %s without changing the background', (background, foreground, target) => {
    const adjusted = findContrastColor(background, foreground, target);
    expect(adjusted.passes).toBe(true);
    expect(contrastRatio(background, adjusted.color)).toBeGreaterThanOrEqual(target);
  });

  it('reports when AAA cannot be reached against a fixed midtone background', () => {
    const adjusted = findContrastColor('#777777', '#888888', 7);
    expect(adjusted.passes).toBe(false);
    expect(adjusted.color).toBe('#000000');
    expect(adjusted.ratio).toBeCloseTo(4.689, 3);
  });

  it('keeps a color that already passes', () => {
    expect(findContrastColor('#ffffff', '#222222', 7).color).toBe('#222222');
  });
});
