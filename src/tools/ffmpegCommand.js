import { shellQuote } from './codeShell.js';

const TIME = /^(\d+(\.\d+)?|\d{1,2}:\d{2}(:\d{2})?(\.\d+)?)$/;

export const FFMPEG_PRESETS = {
  mp3: { ext: 'mp3', forceExt: true },
  gif: { ext: 'gif', forceExt: true, extra: ['FPS (por defecto: 10)', '10'] },
  webm: { ext: 'webm', forceExt: true },
  compress: { ext: 'mp4' },
  thumbnail: { ext: 'jpg', forceExt: true, extra: ['Segundo (por defecto: 1)', '1'] },
  trim: { extra: ['Inicio y duración (ej: 00:00:10 30)', '00:00:10 00:00:30'] },
  resize: { extra: ['Resolución (ej: 1280:720)', '1280:720'] },
  'audio-compress': { ext: 'mp3', forceExt: true },
  custom: {}
};

function extensionOf(name) {
  const match = /\.([a-z0-9]{1,5})$/i.exec(name);
  return match ? match[1] : '';
}

export function outputName(output, input, preset) {
  const config = FFMPEG_PRESETS[preset] || {};
  const base = output.trim() || 'output';
  const ext = config.ext || extensionOf(input) || 'mp4';
  if (config.forceExt) return base.replace(/\.[a-z0-9]{1,5}$/i, '') + '.' + ext;
  return extensionOf(base) ? base : base + '.' + ext;
}

// "-x.mp4" would be read as an option, so relative paths get "./".
function pathArg(path) {
  return shellQuote(path.startsWith('-') ? './' + path : path);
}

function checkTime(value, label) {
  if (!TIME.test(value)) throw new Error(`${label} debe ser segundos (30) o HH:MM:SS (00:00:30).`);
  return value;
}

export function buildFfmpegCommand({ input = '', output = '', preset = 'mp3', extra = '' }) {
  const source = input.trim() || 'input.mp4';
  const target = outputName(output, source, preset);
  const value = extra.trim();
  const args = ['-i', pathArg(source)];
  switch (preset) {
    case 'mp3': args.push('-vn', '-acodec', 'libmp3lame', '-q:a', '2'); break;
    case 'gif': {
      const fps = value || '10';
      if (!/^\d+(\.\d+)?$/.test(fps) || Number(fps) <= 0) throw new Error('FPS debe ser un número mayor que 0.');
      args.push('-vf', shellQuote(`fps=${fps},scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`), '-loop', '0');
      break;
    }
    case 'webm': args.push('-c:v', 'libvpx-vp9', '-crf', '30', '-b:v', '0', '-c:a', 'libopus'); break;
    case 'compress': args.push('-vcodec', 'libx265', '-crf', '28', '-preset', 'fast', '-acodec', 'aac', '-b:a', '128k'); break;
    case 'thumbnail': args.push('-ss', checkTime(value || '1', 'El segundo'), '-vframes', '1', '-q:v', '2'); break;
    case 'trim': {
      const parts = (value || '00:00:10 00:00:30').split(/\s+/);
      if (parts.length !== 2) throw new Error('Escribe inicio y duración separados por un espacio.');
      args.push('-ss', checkTime(parts[0], 'El inicio'), '-t', checkTime(parts[1], 'La duración'), '-c', 'copy');
      break;
    }
    case 'resize': {
      const size = value || '1280:720';
      if (!/^-?\d+:-?\d+$/.test(size)) throw new Error('La resolución debe tener la forma ancho:alto, por ejemplo 1280:720.');
      args.push('-vf', shellQuote('scale=' + size), '-c:a', 'copy');
      break;
    }
    case 'audio-compress': args.push('-b:a', '128k', '-ar', '44100'); break;
    case 'custom': args.push('[tus argumentos]'); break;
    default: throw new Error('Conversión desconocida.');
  }
  return ['ffmpeg', ...args, pathArg(target)].join(' ');
}
