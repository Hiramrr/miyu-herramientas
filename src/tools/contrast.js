function channels(hex) {
  if (!/^#[\da-f]{6}$/i.test(hex)) throw new Error('Escribe un color HEX de seis dígitos.');
  return [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16));
}

function luminance(rgb) {
  const linear = rgb.map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

export function contrastRatio(background, foreground) {
  const a = luminance(channels(background));
  const b = luminance(channels(foreground));
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

export function findContrastColor(background, foreground, target) {
  const source = channels(foreground);
  let best = { color: foreground, ratio: contrastRatio(background, foreground), distance: Infinity };
  if (best.ratio >= target) return { ...best, passes: true };

  for (const end of [0, 255]) {
    for (let step = 1; step <= 255; step += 1) {
      const rgb = source.map((channel) => Math.round(channel + (end - channel) * step / 255));
      const color = '#' + rgb.map((channel) => channel.toString(16).padStart(2, '0')).join('');
      const ratio = contrastRatio(background, color);
      const distance = rgb.reduce((sum, channel, index) => sum + (channel - source[index]) ** 2, 0);
      if (ratio >= target) {
        if (best.ratio < target || distance < best.distance) best = { color, ratio, distance };
        break;
      }
      if (best.ratio < target && ratio > best.ratio) best = { color, ratio, distance };
    }
  }
  return { ...best, passes: best.ratio >= target };
}
