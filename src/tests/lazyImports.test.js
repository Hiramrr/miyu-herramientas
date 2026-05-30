import { describe, expect, it } from 'vitest';
import { toolLoaders } from '../tools/lazyImports.js';
import { tools } from '../tools/registry.js';

describe('lazy tool imports', () => {
  it('provides a loader for every registered tool', () => {
    tools.forEach(({ id }) => {
      expect(toolLoaders[id], `missing loader for "${id}"`).toBeTypeOf('function');
    });
  });

  it('does not keep loaders for removed tools', () => {
    const registeredIds = tools.map(({ id }) => id).sort();
    const loaderIds = Object.keys(toolLoaders).sort();

    expect(loaderIds).toEqual(registeredIds);
  });
});
