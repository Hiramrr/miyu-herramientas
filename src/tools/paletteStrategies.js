export const STRATEGY_CATEGORIES = {
  random: 'Aleatorio',
  'color-theory': 'Teoria del color',
  mood: 'Estados',
  era: 'Epocas',
  nature: 'Naturaleza',
  cultural: 'Arte y cultura'
};

export const STRATEGY_INFO = {
  'true-random': { name: 'Caos', description: 'Colores completamente aleatorios.', category: 'random' },
  'random-cohesive': { name: 'Cohesiva', description: 'Elige una regla armonica al azar.', category: 'random' },
  analogous: { name: 'Analoga', description: 'Tonos cercanos dentro del circulo cromatico.', category: 'color-theory' },
  complementary: { name: 'Complementaria', description: 'Contraste entre tonos opuestos.', category: 'color-theory' },
  triadic: { name: 'Triadica', description: 'Tres familias de color separadas por 120 grados.', category: 'color-theory' },
  'split-complementary': { name: 'Split-comp', description: 'Base con dos vecinos del complemento.', category: 'color-theory' },
  tetradic: { name: 'Tetradica', description: 'Cuatro puntos balanceados del circulo.', category: 'color-theory' },
  monochromatic: { name: 'Mono', description: 'Un solo tono con variacion de luminosidad.', category: 'color-theory' },
  thermos: { name: 'Thermos', description: 'Calida, acogedora y retro.', category: 'mood' },
  specimen: { name: 'Specimen', description: 'Fria, limpia y contenida.', category: 'mood' },
  souvenir: { name: 'Souvenir', description: 'Pasteles suaves y deslavados.', category: 'mood' },
  curfew: { name: 'Curfew', description: 'Oscura, profunda y sobria.', category: 'mood' },
  telegraph: { name: 'Telegraph', description: 'Sepias vintage y tonos apagados.', category: 'mood' },
  '70s': { name: '1970s', description: 'Tierra, mostaza, oxido y aguacate.', category: 'era' },
  '80s': { name: '1980s', description: 'Neon, azul electrico y magenta.', category: 'era' },
  '90s': { name: '1990s', description: 'Grunge, bosque, vino y azul marino.', category: 'era' },
  y2k: { name: 'Y2K', description: 'Cromo, cian, magenta y plata.', category: 'era' },
  'ocean-sunset': { name: 'Ocean sunset', description: 'Coral, rosa, oceano y atardecer.', category: 'nature' },
  'forest-morning': { name: 'Forest morning', description: 'Verdes frescos, niebla y luz dorada.', category: 'nature' },
  'desert-dusk': { name: 'Desert dusk', description: 'Terracota, arena, rosa seco y purpura.', category: 'nature' },
  arctic: { name: 'Arctic', description: 'Hielo, blanco, gris y cian claro.', category: 'nature' },
  volcanic: { name: 'Volcanic', description: 'Carbon, rojo profundo, lava y ceniza.', category: 'nature' },
  meadow: { name: 'Meadow', description: 'Pasto, flores, amarillo y cielo.', category: 'nature' },
  bauhaus: { name: 'Bauhaus', description: 'Primarios intensos y neutros fuertes.', category: 'cultural' },
  'art-deco': { name: 'Art Deco', description: 'Oro, negro, crema y tonos joya.', category: 'cultural' },
  japanese: { name: 'Japanese', description: 'Indigo, bermellon, oro y papel.', category: 'cultural' },
  scandinavian: { name: 'Scandinavian', description: 'Blancos, grises y pasteles sobrios.', category: 'cultural' },
  mexican: { name: 'Mexican', description: 'Rosa intenso, naranja, turquesa y amarillo.', category: 'cultural' }
};

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(function(x) {
    return Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0');
  }).join('');
}

function linearToSrgb(c) {
  var v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return Math.max(0, Math.min(255, v * 255));
}

function oklchToHex(L, c, h) {
  L = Math.max(0, Math.min(1, L));
  c = Math.max(0, Math.min(0.4, c));
  h = ((h % 360) + 360) % 360;
  var hRad = h * Math.PI / 180;
  var a = c * Math.cos(hRad);
  var b = c * Math.sin(hRad);
  var l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
  var m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
  var s = Math.pow(L - 0.0894841775 * a - 1.2914855480 * b, 3);
  var lr = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  var lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  var lb = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
  return rgbToHex(linearToSrgb(lr), linearToSrgb(lg), linearToSrgb(lb));
}

function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

function generateRandomBase() {
  return [randomInRange(0.4, 0.75), randomInRange(0.08, 0.2), randomInRange(0, 360)];
}

function pickFromHueRanges(ranges, defaultL, defaultC) {
  var totalWeight = ranges.reduce(function(sum, range) { return sum + range.weight; }, 0);
  var roll = Math.random() * totalWeight;
  var selected = ranges[0];
  for (var i = 0; i < ranges.length; i++) {
    roll -= ranges[i].weight;
    if (roll <= 0) {
      selected = ranges[i];
      break;
    }
  }
  var h = selected.h[0] <= selected.h[1]
    ? randomInRange(selected.h[0], selected.h[1])
    : (Math.random() < 0.5 ? randomInRange(selected.h[0], 360) : randomInRange(0, selected.h[1]));
  var L = randomInRange.apply(null, selected.L || defaultL);
  var c = randomInRange.apply(null, selected.c || defaultC);
  return oklchToHex(L, c, h);
}

function fromAngles(count, angles, baseL, baseC, jitter) {
  return Array.from({ length: count }, function(_, i) {
    return oklchToHex(
      baseL + randomInRange(-0.15, 0.15),
      baseC + randomInRange(-0.05, 0.05),
      angles[i % angles.length] + randomInRange(-jitter, jitter)
    );
  });
}

function generateAnalogousPalette(count) {
  var base = generateRandomBase();
  var spread = 40;
  var step = count <= 1 ? 0 : spread / (count - 1);
  return Array.from({ length: count }, function(_, i) {
    return oklchToHex(base[0] + randomInRange(-0.1, 0.1), base[1] + randomInRange(-0.05, 0.05), base[2] - spread / 2 + step * i);
  });
}

function generateComplementaryPalette(count) {
  var base = generateRandomBase();
  return fromAngles(count, [base[2], base[2] + 180], base[0], base[1], 15);
}

function generateTriadicPalette(count) {
  var base = generateRandomBase();
  return fromAngles(count, [base[2], base[2] + 120, base[2] + 240], base[0], base[1], 10);
}

function generateSplitComplementaryPalette(count) {
  var base = generateRandomBase();
  return fromAngles(count, [base[2], base[2] + 150, base[2] + 210], base[0], base[1], 10);
}

function generateTetradicPalette(count) {
  var base = generateRandomBase();
  return fromAngles(count, [base[2], base[2] + 90, base[2] + 180, base[2] + 270], base[0], base[1], 10);
}

function generateMonochromaticPalette(count) {
  var h = randomInRange(0, 360);
  var baseC = randomInRange(0.1, 0.2);
  return Array.from({ length: count }, function(_, i) {
    var t = count <= 1 ? 0 : i / (count - 1);
    var L = 0.85 - (0.55 * t);
    return oklchToHex(L, baseC * (L < 0.4 || L > 0.75 ? 0.7 : 1), h);
  });
}

function generateTrueRandomPalette(count) {
  return Array.from({ length: count }, function() {
    return rgbToHex(Math.random() * 255, Math.random() * 255, Math.random() * 255);
  });
}

function generateRandomCohesivePalette(count) {
  var strategies = [generateAnalogousPalette, generateComplementaryPalette, generateTriadicPalette, generateSplitComplementaryPalette, generateTetradicPalette, generateMonochromaticPalette];
  return strategies[Math.floor(Math.random() * strategies.length)](count);
}

function simpleRange(count, ranges, L, c) {
  return Array.from({ length: count }, function() { return pickFromHueRanges(ranges, L, c); });
}

function mixedPalette(count, picker) {
  return Array.from({ length: count }, function(_, i) { return picker(i); });
}

export function generatePalette(count, strategy) {
  switch (strategy) {
    case 'true-random': return generateTrueRandomPalette(count);
    case 'analogous': return generateAnalogousPalette(count);
    case 'complementary': return generateComplementaryPalette(count);
    case 'triadic': return generateTriadicPalette(count);
    case 'split-complementary': return generateSplitComplementaryPalette(count);
    case 'tetradic': return generateTetradicPalette(count);
    case 'monochromatic': return generateMonochromaticPalette(count);
    case 'thermos': return simpleRange(count, [{ h: [15, 55], weight: 1 }], [0.45, 0.75], [0.08, 0.18]);
    case 'specimen': return simpleRange(count, [{ h: [170, 220], weight: 1 }], [0.6, 0.9], [0.03, 0.12]);
    case 'souvenir': return simpleRange(count, [{ h: [0, 360], weight: 1 }], [0.75, 0.92], [0.04, 0.1]);
    case 'curfew': return simpleRange(count, [{ h: [0, 360], weight: 1 }], [0.15, 0.35], [0.05, 0.15]);
    case 'telegraph': return simpleRange(count, [{ h: [30, 60], weight: 1 }], [0.4, 0.7], [0.02, 0.08]);
    case '70s': return simpleRange(count, [{ h: [25, 45], weight: 3 }, { h: [75, 100], weight: 2 }, { h: [15, 30], weight: 2 }, { h: [45, 65], weight: 1 }], [0.35, 0.65], [0.08, 0.18]);
    case '80s': return mixedPalette(count, function() {
      if (Math.random() < 0.2) return oklchToHex(randomInRange(0.12, 0.22), randomInRange(0.02, 0.08), randomInRange(0, 360));
      return pickFromHueRanges([{ h: [320, 350], weight: 3 }, { h: [220, 270], weight: 2 }, { h: [280, 320], weight: 2 }, { h: [170, 200], weight: 1 }], [0.55, 0.75], [0.18, 0.3]);
    });
    case '90s': return simpleRange(count, [{ h: [140, 170], weight: 2 }, { h: [350, 20], weight: 2 }, { h: [220, 250], weight: 2 }, { h: [30, 50], weight: 1 }], [0.3, 0.55], [0.05, 0.14]);
    case 'y2k': return mixedPalette(count, function() {
      if (Math.random() < 0.3) return oklchToHex(randomInRange(0.7, 0.88), randomInRange(0.01, 0.04), randomInRange(200, 280));
      return pickFromHueRanges([{ h: [180, 200], weight: 2 }, { h: [310, 340], weight: 2 }, { h: [260, 290], weight: 1 }, { h: [50, 70], weight: 1 }], [0.55, 0.75], [0.15, 0.28]);
    });
    case 'ocean-sunset': return simpleRange(count, [{ h: [15, 40], weight: 2, L: [0.6, 0.75] }, { h: [340, 360], weight: 2, L: [0.55, 0.7] }, { h: [200, 230], weight: 2, L: [0.35, 0.55] }, { h: [260, 290], weight: 1, L: [0.25, 0.45] }], [0.45, 0.7], [0.1, 0.2]);
    case 'forest-morning': return simpleRange(count, [{ h: [100, 140], weight: 3 }, { h: [75, 100], weight: 2 }, { h: [45, 60], weight: 1 }, { h: [25, 40], weight: 1 }], [0.4, 0.7], [0.08, 0.18]);
    case 'desert-dusk': return simpleRange(count, [{ h: [15, 35], weight: 3, L: [0.45, 0.65] }, { h: [40, 55], weight: 2, L: [0.7, 0.85] }, { h: [350, 15], weight: 2, L: [0.55, 0.7] }, { h: [280, 310], weight: 1, L: [0.25, 0.4] }], [0.45, 0.7], [0.06, 0.16]);
    case 'arctic': return mixedPalette(count, function() {
      if (Math.random() < 0.3) return oklchToHex(randomInRange(0.92, 0.98), randomInRange(0.005, 0.02), randomInRange(200, 220));
      return pickFromHueRanges([{ h: [200, 220], weight: 3 }, { h: [180, 200], weight: 2 }, { h: [220, 250], weight: 1 }], [0.7, 0.9], [0.02, 0.08]);
    });
    case 'volcanic': return mixedPalette(count, function() {
      var roll = Math.random();
      if (roll < 0.25) return oklchToHex(randomInRange(0.12, 0.22), randomInRange(0.01, 0.03), randomInRange(0, 360));
      if (roll < 0.4) return oklchToHex(randomInRange(0.5, 0.65), randomInRange(0.01, 0.03), randomInRange(20, 40));
      return pickFromHueRanges([{ h: [0, 20], weight: 2 }, { h: [20, 45], weight: 2 }, { h: [45, 60], weight: 1 }], [0.4, 0.65], [0.15, 0.25]);
    });
    case 'meadow': return simpleRange(count, [{ h: [100, 135], weight: 3 }, { h: [280, 320], weight: 2 }, { h: [55, 75], weight: 2 }, { h: [200, 220], weight: 1 }], [0.55, 0.75], [0.12, 0.22]);
    case 'bauhaus': return simpleRange(count, [{ h: [15, 35], weight: 3, L: [0.5, 0.62], c: [0.18, 0.26] }, { h: [85, 105], weight: 3, L: [0.8, 0.88], c: [0.14, 0.2] }, { h: [240, 265], weight: 3, L: [0.4, 0.52], c: [0.12, 0.18] }, { h: [0, 15], weight: 1, L: [0.45, 0.55], c: [0.2, 0.26] }], [0.5, 0.7], [0.15, 0.22]);
    case 'art-deco': return mixedPalette(count, function() {
      var roll = Math.random();
      if (roll < 0.25) return oklchToHex(randomInRange(0.7, 0.8), randomInRange(0.12, 0.18), randomInRange(85, 100));
      if (roll < 0.4) return oklchToHex(randomInRange(0.12, 0.2), randomInRange(0.01, 0.03), randomInRange(0, 360));
      if (roll < 0.55) return oklchToHex(randomInRange(0.9, 0.96), randomInRange(0.015, 0.03), randomInRange(80, 100));
      return pickFromHueRanges([{ h: [155, 175], weight: 2 }, { h: [180, 200], weight: 1 }, { h: [0, 15], weight: 1 }], [0.35, 0.55], [0.1, 0.18]);
    });
    case 'japanese': return simpleRange(count, [{ h: [245, 270], weight: 3, L: [0.25, 0.45], c: [0.06, 0.14] }, { h: [18, 35], weight: 2, L: [0.45, 0.58], c: [0.14, 0.22] }, { h: [75, 95], weight: 2, L: [0.7, 0.82], c: [0.1, 0.16] }, { h: [120, 145], weight: 2, L: [0.35, 0.5], c: [0.06, 0.12] }, { h: [340, 360], weight: 1, L: [0.75, 0.88], c: [0.06, 0.12] }], [0.4, 0.6], [0.08, 0.15]);
    case 'scandinavian': return mixedPalette(count, function() {
      var roll = Math.random();
      if (roll < 0.35) return oklchToHex(randomInRange(0.93, 0.98), randomInRange(0.005, 0.015), randomInRange(80, 110));
      if (roll < 0.55) return oklchToHex(randomInRange(0.8, 0.9), randomInRange(0.005, 0.015), randomInRange(200, 260));
      if (roll < 0.75) return oklchToHex(randomInRange(0.8, 0.9), randomInRange(0.02, 0.05), randomInRange(0, 360));
      return oklchToHex(randomInRange(0.55, 0.7), randomInRange(0.04, 0.08), randomInRange(50, 80));
    });
    case 'mexican': return simpleRange(count, [{ h: [330, 350], weight: 2 }, { h: [20, 40], weight: 2 }, { h: [175, 195], weight: 2 }, { h: [55, 70], weight: 2 }, { h: [280, 310], weight: 1 }], [0.55, 0.72], [0.18, 0.28]);
    case 'random-cohesive':
    default: return generateRandomCohesivePalette(count);
  }
}

export function getStrategiesByCategory() {
  return Object.entries(STRATEGY_INFO).reduce(function(groups, entry) {
    var key = entry[0];
    var info = entry[1];
    groups[info.category].push({ key: key, info: info });
    return groups;
  }, { random: [], 'color-theory': [], mood: [], era: [], nature: [], cultural: [] });
}
