import { describe, it, expect } from 'vitest';
import { activeTool, setActiveTool } from '../tools/activeTool.svelte.js';

describe('activeTool store', () => {
  it('should update id and trigger', () => {
    setActiveTool('bgremove');
    expect(activeTool.id).toBe('bgremove');
    expect(activeTool.trigger).toBe(1);

    setActiveTool('palette');
    expect(activeTool.id).toBe('palette');
    expect(activeTool.trigger).toBe(2);
  });

  it('should increment trigger even for same id', () => {
    const before = activeTool.trigger;
    setActiveTool('bgremove');
    expect(activeTool.id).toBe('bgremove');
    expect(activeTool.trigger).toBe(before + 1);
  });
});
