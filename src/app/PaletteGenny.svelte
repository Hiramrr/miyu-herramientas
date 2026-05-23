<script>
  import { onMount, tick } from 'svelte';
  import {
    STRATEGY_CATEGORIES,
    STRATEGY_INFO,
    generatePalette,
    getStrategiesByCategory
  } from '../tools/paletteStrategies.js';

  const MIN_COLOURS = 2;
  const MAX_COLOURS = 11;
  const groupedStrategies = getStrategiesByCategory();

  let strategy = 'random-cohesive';
  let copied = '';
  let colours = [];
  let canvas;

  function generateId() {
    return Math.random().toString(36).slice(2, 9);
  }

  function makeColour(hex, locked = false) {
    return { id: generateId(), hex, locked };
  }

  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : null;
  }

  function getLuminance(hex) {
    const rgb = hexToRgb(hex);
    if (!rgb) return 0;
    const linear = rgb.map((channel) => {
      const value = channel / 255;
      return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  }

  function contrastText(hex) {
    return getLuminance(hex) > 0.42 ? '#1f1b18' : '#ffffff';
  }

  function flash(label) {
    copied = label;
    window.setTimeout(() => {
      if (copied === label) copied = '';
    }, 1400);
  }

  async function refreshIcons() {
    await tick();
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  async function copyText(value, label) {
    await navigator.clipboard.writeText(value);
    flash(label);
  }

  function regeneratePalette() {
    const generated = generatePalette(colours.length || 5, strategy);
    colours = colours.map((colour, index) => colour.locked ? colour : makeColour(generated[index] || generated[0]));
    refreshIcons();
  }

  function addColour() {
    if (colours.length >= MAX_COLOURS) return;
    const next = generatePalette(1, strategy)[0];
    colours = [...colours, makeColour(next)];
    refreshIcons();
  }

  function removeColour(id) {
    if (colours.length <= MIN_COLOURS) return;
    colours = colours.filter((colour) => colour.id !== id);
    refreshIcons();
  }

  function toggleLock(id) {
    colours = colours.map((colour) => colour.id === id ? { ...colour, locked: !colour.locked } : colour);
    refreshIcons();
  }

  function updateColour(id, hex) {
    colours = colours.map((colour) => colour.id === id ? { ...colour, hex } : colour);
    refreshIcons();
  }

  function copyPalette() {
    copyText(colours.map((colour) => colour.hex.toUpperCase()).join(', '), 'palette');
  }

  function copyCss() {
    const vars = colours.map((colour, index) => `  --palette-${index + 1}: ${colour.hex.toUpperCase()};`).join('\n');
    copyText(`:root {\n${vars}\n}`, 'css');
  }

  function copyJson() {
    copyText(JSON.stringify(colours.map((colour) => colour.hex.toUpperCase()), null, 2), 'json');
  }

  function downloadImage() {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = 1200;
    const height = 630;
    const padding = 42;
    const gap = 12;
    const labelSpace = 82;
    const swatchWidth = (width - padding * 2 - gap * (colours.length - 1)) / colours.length;
    const swatchHeight = height - padding * 2 - labelSpace;

    canvas.width = width;
    canvas.height = height;
    ctx.fillStyle = '#fffdfb';
    ctx.fillRect(0, 0, width, height);

    colours.forEach((colour, index) => {
      const x = padding + index * (swatchWidth + gap);
      ctx.fillStyle = colour.hex;
      ctx.beginPath();
      ctx.roundRect(x, padding, swatchWidth, swatchHeight, 16);
      ctx.fill();
      ctx.fillStyle = '#3a3a3a';
      ctx.font = '700 20px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(colour.hex.toUpperCase(), x + swatchWidth / 2, height - padding - 24);
    });

    ctx.fillStyle = '#b0a090';
    ctx.font = '16px Inter, system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('miyu-herramientas', width - padding, height - 18);

    const link = document.createElement('a');
    link.download = 'palette.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  onMount(() => {
    colours = generatePalette(5, strategy).map((hex) => makeColour(hex));
    refreshIcons();

    const handleKeydown = (event) => {
      const target = event.target;
      const isInput = target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
      const panelActive = document.getElementById('panel-palette')?.classList.contains('active');
      if (panelActive && event.code === 'Space' && !isInput) {
        event.preventDefault();
        regeneratePalette();
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  });
</script>

<div class="tool-panel" id="panel-palette">
  <div class="panel-header">
    <button class="back-btn" type="button" on:click={() => window.showTool?.(null)}><i data-lucide="arrow-left" style="width:14px;height:14px"></i> Volver</button>
    <h2><i data-lucide="palette"></i> Generación de paletas de colores</h2>
    <p>Genera paletas con estrategias OKLCH, bloquea colores y exporta resultados listos para usar</p>
  </div>

  <div class="palette-stage" style:grid-template-columns={`repeat(${colours.length || 5}, minmax(70px, 1fr))`}>
    {#each colours as colour (colour.id)}
      <section class="palette-swatch" style:background-color={colour.hex} style:color={contrastText(colour.hex)}>
        <div class="palette-swatch-actions">
          <button type="button" class="icon-btn" aria-label="Eliminar color" on:click={() => removeColour(colour.id)} disabled={colours.length <= MIN_COLOURS}>
            <i data-lucide="trash-2"></i>
          </button>
          <button type="button" class:locked={colour.locked} class="icon-btn" aria-label={colour.locked ? 'Desbloquear color' : 'Bloquear color'} on:click={() => toggleLock(colour.id)}>
            <i data-lucide={colour.locked ? 'lock' : 'unlock'}></i>
          </button>
        </div>
        <label class="palette-picker" aria-label="Editar color">
          <input type="color" value={colour.hex} on:input={(event) => updateColour(colour.id, event.currentTarget.value)}>
        </label>
        <button type="button" class="palette-copy" on:click={() => copyText(colour.hex.toUpperCase(), colour.id)}>
          <i data-lucide={copied === colour.id ? 'check' : 'copy'}></i>
          {copied === colour.id ? 'Copiado' : colour.hex.toUpperCase()}
        </button>
      </section>
    {/each}
  </div>

  <div class="palette-controls">
    <button class="btn" type="button" on:click={regeneratePalette}><i data-lucide="shuffle"></i> Generar</button>
    <div class="palette-select-wrap">
      <label for="palette-strategy">Estrategia</label>
      <select id="palette-strategy" bind:value={strategy} on:change={regeneratePalette}>
        {#each Object.entries(STRATEGY_CATEGORIES) as [category, label]}
          <optgroup label={label}>
            {#each groupedStrategies[category] as item}
              <option value={item.key}>{item.info.name}</option>
            {/each}
          </optgroup>
        {/each}
      </select>
    </div>
    <div class="palette-count">
      <button class="base-btn" type="button" on:click={() => removeColour(colours[colours.length - 1]?.id)} disabled={colours.length <= MIN_COLOURS} aria-label="Quitar color"><i data-lucide="minus"></i></button>
      <strong>{colours.length}</strong>
      <button class="base-btn" type="button" on:click={addColour} disabled={colours.length >= MAX_COLOURS} aria-label="Agregar color"><i data-lucide="plus"></i></button>
    </div>
  </div>

  <div class="palette-strategy-note">
    <strong>{STRATEGY_INFO[strategy].name}:</strong> {STRATEGY_INFO[strategy].description}
  </div>

  <div class="btn-row palette-export">
    <button class="btn btn-green" type="button" on:click={copyPalette}><i data-lucide={copied === 'palette' ? 'check' : 'copy'}></i> Colores</button>
    <button class="btn btn-green" type="button" on:click={copyCss}><i data-lucide={copied === 'css' ? 'check' : 'braces'}></i> CSS vars</button>
    <button class="btn btn-green" type="button" on:click={copyJson}><i data-lucide={copied === 'json' ? 'check' : 'brackets'}></i> JSON</button>
    <button class="btn" type="button" on:click={downloadImage}><i data-lucide="download"></i> PNG</button>
  </div>

  <canvas bind:this={canvas} style="display:none"></canvas>
</div>
