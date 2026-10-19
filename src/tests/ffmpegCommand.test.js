import { describe, it, expect } from 'vitest';
import { buildFfmpegCommand } from '../tools/ffmpegCommand.js';

describe('buildFfmpegCommand', () => {
  it('adds the format extension with default values', () => {
    expect(buildFfmpegCommand({ preset: 'mp3' })).toBe("ffmpeg -i 'input.mp4' -vn -acodec libmp3lame -q:a 2 'output.mp3'");
    expect(buildFfmpegCommand({ input: 'clip.mov', output: 'final', preset: 'resize' })).toMatch(/'final\.mov'$/);
  });

  it('uses -t for the duration', () => {
    expect(buildFfmpegCommand({ preset: 'trim', extra: '00:01:00 30' })).toContain('-ss 00:01:00 -t 30 -c copy');
    expect(() => buildFfmpegCommand({ preset: 'trim', extra: '10;rm 5' })).toThrow();
  });

  it('quotes shell characters and paths that look like options', () => {
    const command = buildFfmpegCommand({ input: "-mi $(rm) 'video'.mp4", output: 'a b', preset: 'webm' });
    expect(command).toContain("-i './-mi $(rm) '\\''video'\\''.mp4'");
    expect(command).toMatch(/'a b\.webm'$/);
  });
});
