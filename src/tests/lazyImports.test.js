import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { toolLoaders } from '../tools/lazyImports.js';
import { tools } from '../tools/registry.js';

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../app');

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

  it('renders a navigable panel for every registered tool', () => {
    const appMarkup = fs
      .readdirSync(appDir)
      .filter((file) => file.endsWith('.svelte'))
      .map((file) => fs.readFileSync(path.join(appDir, file), 'utf8'))
      .join('\n');

    tools.forEach(({ id }) => {
      expect(appMarkup, `missing panel markup for "${id}"`).toContain(`id="panel-${id}"`);
    });
  });
});
