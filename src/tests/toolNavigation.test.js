import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/svelte';
import LazyToolLoader from '../app/LazyToolLoader.svelte';
import { setActiveTool } from '../tools/activeTool.svelte.js';

const { load, retry } = vi.hoisted(() => ({ load: vi.fn(), retry: vi.fn() }));
vi.mock('../tools/lazyImports.js', () => ({ toolLoaders: { first: load, second: load, retry } }));

beforeEach(() => {
  setActiveTool(null);
  load.mockReset().mockImplementation(() => import('./fixtures/ToolPanels.svelte'));
  retry.mockReset();
  vi.stubGlobal('requestAnimationFrame', (fn) => setTimeout(fn, 0));
  vi.stubGlobal('cancelAnimationFrame', clearTimeout);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('tool navigation', () => {
  it('keeps the input and DOM when switching tools from the same module', async () => {
    const { getByLabelText } = render(LazyToolLoader);
    setActiveTool('first');
    await waitFor(() => expect(document.getElementById('panel-first')?.classList.contains('active')).toBe(true));
    const input = getByLabelText('Texto de prueba');
    await fireEvent.input(input, { target: { value: 'trabajo sin guardar' } });
    setActiveTool('second');
    await waitFor(() => expect(document.getElementById('panel-second')?.classList.contains('active')).toBe(true));
    setActiveTool('first');
    await waitFor(() => expect(document.getElementById('panel-first')?.classList.contains('active')).toBe(true));
    expect(getByLabelText('Texto de prueba')).toBe(input);
    expect(input.value).toBe('trabajo sin guardar');
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('runs the loader again after a recoverable import failure', async () => {
    retry.mockRejectedValueOnce(new Error('network')).mockImplementation(() => import('./fixtures/ToolPanels.svelte'));
    const { getByRole } = render(LazyToolLoader);
    setActiveTool('retry');
    await waitFor(() => expect(getByRole('alert')).toBeTruthy());
    await fireEvent.click(getByRole('button', { name: 'Reintentar' }));
    await waitFor(() => expect(document.getElementById('panel-retry')?.classList.contains('active')).toBe(true));
    expect(retry).toHaveBeenCalledTimes(2);
  });
});
