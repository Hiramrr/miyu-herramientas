import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/svelte';
import { tick } from 'svelte';
import UtilityTools from '../app/UtilityTools.svelte';

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-19T12:00:00Z'));
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('notes and timers', () => {
  it('persists the last typed text before the component is destroyed', async () => {
    const { getByLabelText, unmount } = render(UtilityTools);
    await fireEvent.input(getByLabelText('Contenido'), { target: { value: 'La última palabra' } });
    unmount();
    const { getByLabelText: find } = render(UtilityTools);
    expect(find('Contenido').value).toBe('La última palabra');
  });

  it('resumes the remaining time and uses elapsed wall time after a delayed tick', async () => {
    const { container } = render(UtilityTools);
    const controls = container.querySelectorAll('#panel-timer .timer-controls');
    const countdown = controls[1].querySelectorAll('button');
    await fireEvent.click(countdown[0]);
    await vi.advanceTimersByTimeAsync(2000);
    await fireEvent.click(countdown[1]);
    expect(container.querySelector('#timer-display').textContent).toBe('00:04:58');
    await vi.advanceTimersByTimeAsync(10000);
    await fireEvent.click(countdown[0]);
    await vi.advanceTimersByTimeAsync(1000);
    expect(container.querySelector('#timer-display').textContent).toBe('00:04:57');
    vi.setSystemTime(Date.now() + 60000);
    await vi.advanceTimersByTimeAsync(200);
    await tick();
    expect(container.querySelector('#timer-display').textContent).toBe('00:03:57');
  });

  it('stops the other clock when switching modes and announces countdown completion', async () => {
    const { container } = render(UtilityTools);
    const input = container.querySelector('#timer-min');
    await fireEvent.input(input, { target: { value: '0.01' } });
    await fireEvent.change(input);
    const controls = container.querySelectorAll('#panel-timer .timer-controls');
    await fireEvent.click(controls[1].querySelector('button'));
    await vi.advanceTimersByTimeAsync(1000);
    expect(container.querySelector('#timer-status').textContent).toBe('Temporizador terminado.');
    await fireEvent.click(controls[0].querySelector('button'));
    await vi.advanceTimersByTimeAsync(2000);
    expect(container.querySelector('#timer-display').textContent).toBe('00:00:02');
  });
});
