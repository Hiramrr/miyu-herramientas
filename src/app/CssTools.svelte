<script>
  import { activeTool } from '../tools/activeTool.svelte.js';

  // --- Color panel ---
  let colorPicker = '#8bb8d4';
  let colorHex = '#8BB8D4';
  let colorRgb = 'rgb(139, 184, 212)';
  let colorHsl = 'hsl(200, 46%, 69%)';

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
  }

  function convertColor() {
    const hex = colorPicker;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    colorHex = hex.toUpperCase();
    colorRgb = `rgb(${r}, ${g}, ${b})`;
    const [h, s, l] = rgbToHsl(r, g, b);
    colorHsl = `hsl(${h}, ${s}%, ${l}%)`;
  }

  // --- Harmony panel ---
  let harmonyColor = '#8bb8d4';
  let harmonyType = 'complementary';
  let harmonyFormat = 'hex';
  let harmonyResult = [];
  let harmonyCopied = '';

  const HARMONY_STOPS = {
    complementary: [{ n: 'Complementario', o: 180 }],
    analogous: [{ n: 'Análogo 1', o: -30 }, { n: 'Base', o: 0 }, { n: 'Análogo 2', o: 30 }],
    triadic: [{ n: 'Base', o: 0 }, { n: 'Triádico 1', o: 120 }, { n: 'Triádico 2', o: 240 }],
    split: [{ n: 'Base', o: 0 }, { n: 'Split 1', o: -150 }, { n: 'Split 2', o: 150 }],
    square: [{ n: 'Base', o: 0 }, { n: 'Cuadrado 1', o: 90 }, { n: 'Cuadrado 2', o: 180 }, { n: 'Cuadrado 3', o: 270 }],
    monochromatic: [{ n: 'Tono 1', o: 0, s: -30, l: -20 }, { n: 'Tono 2', o: 0, s: -15, l: -10 }, { n: 'Base', o: 0 }, { n: 'Tono 3', o: 0, s: 15, l: 10 }, { n: 'Tono 4', o: 0, s: 30, l: 20 }],
    double: [{ n: 'Base', o: 0 }, { n: 'Doble 1', o: 30 }, { n: 'Complementario', o: 180 }, { n: 'Doble 2', o: 210 }],
    compound: [{ n: 'Base', o: 0 }, { n: 'Compuesto 1', o: -20 }, { n: 'Compuesto 2', o: 160 }, { n: 'Compuesto 3', o: 180 }],
    pentadic: [{ n: 'Base', o: 0 }, { n: 'Péntada 1', o: 72 }, { n: 'Péntada 2', o: 144 }, { n: 'Péntada 3', o: 216 }, { n: 'Péntada 4', o: 288 }],
    accent: [{ n: 'Base', o: 0 }, { n: 'Acento 1', o: 15 }, { n: 'Acento 2', o: 30 }, { n: 'Acento 3', o: 180 }, { n: 'Acento 4', o: 195 }, { n: 'Acento 5', o: 210 }],
    golden: [{ n: 'Base', o: 0 }, { n: 'Áureo 1', o: 137.5 }, { n: 'Áureo 2', o: 222.5 }, { n: 'Áureo 3', o: 275 }],
    near: [{ n: 'Base', o: 0 }, { n: 'Cercano 1', o: -15 }, { n: 'Cercano 2', o: 15 }, { n: 'Lejano 1', o: -50 }, { n: 'Lejano 2', o: 50 }]
  };

  function normHue(h) {
    return ((h % 360) + 360) % 360;
  }

  function clamp(v, min = 0, max = 255) {
    return Math.min(max, Math.max(min, v));
  }

  function hslToHex(h, s, l) {
    s /= 100; l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n) => {
      const k = (n + h / 30) % 12;
      return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    };
    const toHex = (x) => Math.round(clamp(f(x) * 255)).toString(16).padStart(2, '0');
    return `#${toHex(0)}${toHex(8)}${toHex(4)}`;
  }

  function colorFormat(hex, format) {
    if (format === 'hex') return hex.toUpperCase();
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    if (format === 'rgb') return `rgb(${r}, ${g}, ${b})`;
    const [h, s, l] = rgbToHsl(r, g, b);
    return `hsl(${h}, ${s}%, ${l}%)`;
  }

  function rgbToHslObj(r, g, b) {
    const [h, s, l] = rgbToHsl(r, g, b);
    return { h, s, l };
  }

  function hslToRgb(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }

  function hexToRgbObj(hex) {
    return { r: parseInt(hex.slice(1, 3), 16), g: parseInt(hex.slice(3, 5), 16), b: parseInt(hex.slice(5, 7), 16) };
  }

  function rgbToHexStr(r, g, b) {
    return `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`;
  }

  function harmonyStops(type) {
    return HARMONY_STOPS[type] || HARMONY_STOPS.complementary;
  }

  function generateHarmony() {
    const { r, g, b } = hexToRgbObj(harmonyColor);
    const [baseH, baseS, baseL] = rgbToHsl(r, g, b);
    const stops = harmonyStops(harmonyType);
    harmonyResult = stops.map((stop) => {
      const h = normHue(baseH + (stop.o || 0));
      const s = clamp((stop.s || 0) + baseS, 0, 100);
      const l = clamp((stop.l || 0) + baseL, 0, 100);
      const hex = hslToHex(h, s, l);
      return { name: stop.n, value: colorFormat(hex, harmonyFormat), hex };
    });
  }

  function randomHarmonyColor() {
    harmonyColor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    generateHarmony();
  }

  function flashHarmony(label) {
    harmonyCopied = label;
    setTimeout(() => { if (harmonyCopied === label) harmonyCopied = ''; }, 1400);
  }

  async function copyHarmonyColor(value, label) {
    await navigator.clipboard.writeText(value);
    flashHarmony(label);
  }

  async function copyHarmonyPalette() {
    await navigator.clipboard.writeText(harmonyResult.map((c) => c.value).join(', '));
    flashHarmony('palette');
  }

  async function copyHarmonyCSS() {
    const vars = harmonyResult.map((c, i) => `  --harmony-${i + 1}: ${c.value};`).join('\n');
    await navigator.clipboard.writeText(`:root {\n${vars}\n}`);
    flashHarmony('css');
  }

  // --- Contrast panel ---
  let contrastBg = '#000000';
  let contrastFg = '#ffffff';
  let contrastBgHex = '#000000';
  let contrastFgHex = '#ffffff';
  let contrastRatio = 21.00;
  let contrastVerdict = 'Super';
  let contrastBadges = { aaNormal: true, aaLarge: true, aaaNormal: true, aaaLarge: true };

  function contrastLum(hex) {
    const rgb = hexToRgbObj(hex);
    const linear = [rgb.r, rgb.g, rgb.b].map((c) => {
      const v = c / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  }

  function contrastRatioHex(c1, c2) {
    const l1 = contrastLum(c1);
    const l2 = contrastLum(c2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  function updateContrast() {
    contrastBgHex = contrastBg;
    contrastFgHex = contrastFg;
    const ratio = contrastRatioHex(contrastBg, contrastFg);
    contrastRatio = Math.round(ratio * 100) / 100;
    if (ratio >= 12) contrastVerdict = 'Super';
    else if (ratio >= 7) contrastVerdict = 'Excellent';
    else if (ratio >= 4.5) contrastVerdict = 'Good';
    else if (ratio >= 3) contrastVerdict = 'Fair';
    else contrastVerdict = 'Poor';
    contrastBadges = {
      aaNormal: ratio >= 4.5,
      aaLarge: ratio >= 3,
      aaaNormal: ratio >= 7,
      aaaLarge: ratio >= 4.5
    };
  }

  function contrastHexInput(type) {
    const val = type === 'bg' ? contrastBgHex : contrastFgHex;
    const clean = val.replace(/[^0-9a-fA-F#]/g, '');
    const withHash = clean.startsWith('#') ? clean : '#' + clean;
    if (withHash.length === 7) {
      if (type === 'bg') contrastBg = withHash.toLowerCase();
      else contrastFg = withHash.toLowerCase();
      updateContrast();
    }
  }

  function flipContrastColors() {
    const tmp = contrastBg;
    contrastBg = contrastFg;
    contrastFg = tmp;
    updateContrast();
  }

  function fixContrast(target) {
    const minRatio = target === 'aaa' || target === 'AAA' ? 7 : 4.5;
    let fg = contrastFg;
    let bg = contrastBg;
    let tries = 0;
    while (contrastRatioHex(bg, fg) < minRatio && tries < 50) {
      const lumBg = contrastLum(bg);
      const lumFg = contrastLum(fg);
      if (lumBg > lumFg) {
        const obj = hexToRgbObj(bg);
        obj.r = clamp(obj.r - 10);
        obj.g = clamp(obj.g - 10);
        obj.b = clamp(obj.b - 10);
        bg = rgbToHexStr(obj.r, obj.g, obj.b);
      } else {
        const obj = hexToRgbObj(fg);
        obj.r = clamp(obj.r + 10);
        obj.g = clamp(obj.g + 10);
        obj.b = clamp(obj.b + 10);
        fg = rgbToHexStr(obj.r, obj.g, obj.b);
      }
      tries++;
    }
    contrastBg = bg;
    contrastFg = fg;
    updateContrast();
  }

  // --- Gradient panel ---
  let gradColor1 = '#8bb8d4';
  let gradColor2 = '#d8b898';
  let gradAngle = 135;
  let gradCss = '';

  function updateGradient() {
    gradCss = `linear-gradient(${gradAngle}deg, ${gradColor1}, ${gradColor2})`;
  }

  async function copyGradient() {
    await navigator.clipboard.writeText(`background: ${gradCss};`);
  }

  // --- Box Shadow panel ---
  let shadowX = 4;
  let shadowY = 4;
  let shadowBlur = 10;
  let shadowSpread = 0;
  let shadowColor = '#c8b8a8';
  let shadowCss = '';

  function updateShadow() {
    shadowCss = `${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowSpread}px ${shadowColor}`;
  }

  async function copyShadow() {
    await navigator.clipboard.writeText(`box-shadow: ${shadowCss};`);
  }

  // Initialize reactive outputs
  convertColor();
  generateHarmony();
  updateGradient();
  updateShadow();
</script>

{#if activeTool.id === 'color'}
  <div class="tool-panel" id="panel-color">
    <div class="panel-header">
      <h2><i data-lucide="palette"></i> Conversor de Colores</h2>
      <p>Selecciona un color y obtén sus valores en HEX, RGB y HSL</p>
    </div>
    <label for="color-picker">Selecciona un color</label>
    <input type="color" id="color-picker" bind:value={colorPicker} oninput={convertColor} style="width:100%;height:55px;cursor:pointer;border-radius:12px;border:1.5px solid var(--line)">
    <div class="output" id="color-output">
      <strong>HEX:</strong> {colorHex}<br>
      <strong>RGB:</strong> {colorRgb}<br>
      <strong>HSL:</strong> {colorHsl}<br>
      <span style="display:inline-block;width:32px;height:32px;background:{colorPicker};border-radius:8px;vertical-align:middle;border:1px solid var(--line);margin-left:6px"></span>
    </div>
  </div>
{/if}

{#if activeTool.id === 'harmony'}
  <div class="tool-panel" id="panel-harmony">
    <div class="panel-header">
      <h2><i data-lucide="swatch-book"></i> Generador de Armonía</h2>
      <p>Genera paletas armónicas desde un color base con varios esquemas</p>
    </div>
    <label for="harmony-color">Color base</label>
    <input type="color" id="harmony-color" bind:value={harmonyColor} oninput={generateHarmony} style="width:100%;height:55px;cursor:pointer;border-radius:12px;border:1.5px solid var(--line)">
    <div class="color-control-grid">
      <div>
        <label for="harmony-type">Tipo de armonía</label>
        <select id="harmony-type" bind:value={harmonyType} onchange={generateHarmony}>
          <option value="complementary">Complementaria</option>
          <option value="analogous">Análoga</option>
          <option value="triadic">Triádica</option>
          <option value="split">Split-complementaria</option>
          <option value="square">Tetrádica / cuadrada</option>
          <option value="monochromatic">Monocromática</option>
          <option value="double">Doble complementaria</option>
          <option value="compound">Compuesta</option>
          <option value="pentadic">Pentádica</option>
          <option value="accent">Análoga con acento</option>
          <option value="golden">Golden ratio</option>
          <option value="near">Casi complementaria</option>
        </select>
      </div>
      <div>
        <label for="harmony-format">Formato para copiar</label>
        <select id="harmony-format" bind:value={harmonyFormat} onchange={generateHarmony}>
          <option value="hex">HEX</option>
          <option value="rgb">RGB</option>
          <option value="hsl">HSL</option>
        </select>
      </div>
    </div>
    <div class="btn-row">
      <button class="btn" onclick={randomHarmonyColor}><i data-lucide="shuffle"></i> Color aleatorio</button>
      <button class="btn btn-green" onclick={copyHarmonyPalette}><i data-lucide="copy"></i> Copiar paleta</button>
      <button class="btn btn-green" onclick={copyHarmonyCSS}><i data-lucide="copy"></i> Copiar CSS</button>
    </div>
    <div class="harmony-grid" id="harmony-output">
      {#each harmonyResult as c, i}
        <div class="harmony-swatch">
          <div class="harmony-chip" style="background: {c.hex}"></div>
          <div class="harmony-meta">
            <strong>{c.name}</strong>
            <span>{c.value}</span>
            <button type="button" onclick={() => copyHarmonyColor(c.value, `color-${i}`)}>Copiar</button>
          </div>
        </div>
      {/each}
    </div>
  </div>
{/if}

{#if activeTool.id === 'contrast'}
  <div class="tool-panel" id="panel-contrast">
    <div class="panel-header">
      <h2><i data-lucide="contrast"></i> Contrast Checker</h2>
      <p>Verifica la accesibilidad WCAG del contraste entre dos colores</p>
    </div>
    <div class="contrast-color-row">
      <div>
        <label for="contrast-bg">Color de fondo</label>
        <div style="display:flex;gap:8px;align-items:center">
          <input type="color" id="contrast-bg" bind:value={contrastBg} oninput={updateContrast} style="width:48px;height:40px;padding:2px;border-radius:var(--radius)">
          <input type="text" id="contrast-bg-hex" bind:value={contrastBgHex} oninput={() => contrastHexInput('bg')} style="flex:1">
        </div>
      </div>
      <div>
        <label for="contrast-fg">Color de texto</label>
        <div style="display:flex;gap:8px;align-items:center">
          <input type="color" id="contrast-fg" bind:value={contrastFg} oninput={updateContrast} style="width:48px;height:40px;padding:2px;border-radius:var(--radius)">
          <input type="text" id="contrast-fg-hex" bind:value={contrastFgHex} oninput={() => contrastHexInput('fg')} style="flex:1">
        </div>
      </div>
    </div>
    <div class="btn-row" style="margin-top:10px">
      <button class="btn" style="min-height:32px;padding:7px 12px;font-size:0.72rem" onclick={flipContrastColors}><i data-lucide="arrow-up-down"></i> Intercambiar</button>
      <button class="btn" style="min-height:32px;padding:7px 12px;font-size:0.72rem" onclick={() => fixContrast('AA')}><i data-lucide="wand-2"></i> Ajustar a AA</button>
      <button class="btn" style="min-height:32px;padding:7px 12px;font-size:0.72rem" onclick={() => fixContrast('AAA')}><i data-lucide="wand-2"></i> Ajustar a AAA</button>
    </div>
    <div class="contrast-preview-box" id="contrast-preview" style="background-color: {contrastBg}; color: {contrastFg};">
      <div style="font-size:1.5rem;font-weight:700;margin-bottom:6px">Large Text (24px+)</div>
      <div style="font-size:1rem;margin-bottom:6px">Normal text at 16px. The quick brown fox jumps over the lazy dog.</div>
      <div style="font-size:0.78rem">Small text at 14px for fine print and captions.</div>
    </div>
    <div class="contrast-ratio-box">
      <div style="font-size:0.78rem;color:var(--muted);margin-bottom:4px">Contrast Ratio</div>
      <div class="contrast-ratio-val" id="contrast-ratio">{contrastRatio.toFixed(2)}:1</div>
      <div style="font-size:0.85rem;color:var(--muted);margin-top:4px" id="contrast-verdict">{contrastVerdict}</div>
    </div>
    <div class="contrast-wcag-grid">
      <div class="contrast-wcag-col">
        <h4>Level AA</h4>
        <div>
          <span class="contrast-badge {contrastBadges.aaNormal ? 'ok' : 'fail'}" id="contrast-aa-normal">{contrastBadges.aaNormal ? '✓' : '✗'} Normal Text (4.5:1)</span>
          <span class="contrast-badge {contrastBadges.aaLarge ? 'ok' : 'fail'}" id="contrast-aa-large">{contrastBadges.aaLarge ? '✓' : '✗'} Large Text (3:1)</span>
        </div>
      </div>
      <div class="contrast-wcag-col">
        <h4>Level AAA</h4>
        <div>
          <span class="contrast-badge {contrastBadges.aaaNormal ? 'ok' : 'fail'}" id="contrast-aaa-normal">{contrastBadges.aaaNormal ? '✓' : '✗'} Normal Text (7:1)</span>
          <span class="contrast-badge {contrastBadges.aaaLarge ? 'ok' : 'fail'}" id="contrast-aaa-large">{contrastBadges.aaaLarge ? '✓' : '✗'} Large Text (4.5:1)</span>
        </div>
      </div>
    </div>
  </div>
{/if}

{#if activeTool.id === 'gradient'}
  <div class="tool-panel" id="panel-gradient">
    <div class="panel-header">
      <h2><i data-lucide="droplets"></i> Generador de Gradientes</h2>
      <p>Crea gradientes CSS lineales con los colores y ángulo que elijas</p>
    </div>
    <label for="grad-color1">Color 1</label>
    <input type="color" id="grad-color1" bind:value={gradColor1} oninput={updateGradient}>
    <label for="grad-color2" style="margin-top:14px">Color 2</label>
    <input type="color" id="grad-color2" bind:value={gradColor2} oninput={updateGradient}>
    <label for="grad-angle" style="margin-top:14px">Ángulo: {gradAngle}°</label>
    <input type="range" id="grad-angle" min="0" max="360" bind:value={gradAngle} oninput={updateGradient}>
    <div id="grad-preview" style="height:80px;border-radius:12px;margin-top:14px;border:1px solid var(--line); background: {gradCss};"></div>
    <div class="output" id="grad-css" style="font-family:monospace;font-size:0.85rem">background: {gradCss};</div>
    <div class="btn-row"><button class="btn btn-green" onclick={copyGradient}><i data-lucide="copy"></i> Copiar CSS</button></div>
  </div>
{/if}

{#if activeTool.id === 'boxshadow'}
  <div class="tool-panel" id="panel-boxshadow">
    <div class="panel-header">
      <h2><i data-lucide="square"></i> Generador de Box Shadow</h2>
      <p>Crea sombras CSS personalizadas con una vista previa interactiva</p>
    </div>
    <div class="shadow-box" id="shadow-box" style="box-shadow: {shadowCss};"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px">
      <div><label for="sx">X: {shadowX}px</label><input type="range" id="sx" min="-20" max="20" bind:value={shadowX} oninput={updateShadow}></div>
      <div><label for="sy">Y: {shadowY}px</label><input type="range" id="sy" min="-20" max="20" bind:value={shadowY} oninput={updateShadow}></div>
      <div><label for="sblur">Blur: {shadowBlur}px</label><input type="range" id="sblur" min="0" max="40" bind:value={shadowBlur} oninput={updateShadow}></div>
      <div><label for="sspread">Spread: {shadowSpread}px</label><input type="range" id="sspread" min="-10" max="20" bind:value={shadowSpread} oninput={updateShadow}></div>
    </div>
    <label for="scolor" style="margin-top:8px">Color de sombra</label>
    <input type="color" id="scolor" bind:value={shadowColor} oninput={updateShadow}>
    <div class="output" id="shadow-css" style="font-family:monospace;font-size:0.85rem">box-shadow: {shadowCss};</div>
    <button class="btn btn-green" onclick={copyShadow}><i data-lucide="copy"></i> Copiar CSS</button>
  </div>
{/if}
