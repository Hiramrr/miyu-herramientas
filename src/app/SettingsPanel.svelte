<script>
  const themes = [
    { id: 'light', name: 'Claro', bg: '#faf9f5', accent: '#b18100' },
    { id: 'dark', name: 'Oscuro', bg: '#1a1917', accent: '#d4a020' },
    { id: 'jazmin', name: 'Jazmín', bg: '#fffdf5', accent: '#6a8a50' },
    { id: 'hacker', name: 'Hacker', bg: '#000000', accent: '#00ff00' },
    { id: 'ocean', name: 'Ocean', bg: '#0f172a', accent: '#38bdf8' },
    { id: 'dracula', name: 'Dracula', bg: '#282a36', accent: '#bd93f9' },
    { id: 'nord', name: 'Nord', bg: '#2E3440', accent: '#88C0D0' },
    { id: 'solarized', name: 'Solarized', bg: '#002b36', accent: '#268bd2' },
    { id: 'solarized-light', name: 'Solarized Light', bg: '#fdf6e3', accent: '#268bd2' },
    { id: 'gruvbox', name: 'Gruvbox', bg: '#282828', accent: '#fabd2f' },
    { id: 'sakura', name: 'Sakura', bg: '#1a1225', accent: '#f8a4c8' },
    { id: 'lavender', name: 'Lavender', bg: '#f5f0fa', accent: '#7c5cbf' },
    { id: 'rosa', name: 'Rosa', bg: '#fff5f7', accent: '#e85080' },
    { id: 'sandia', name: 'Sandía', bg: '#1a3a1a', accent: '#c0392b' },
    { id: 'matcha', name: 'Matcha', bg: '#f4f1e8', accent: '#5a7a4a' },
    { id: 'moka', name: 'Moka', bg: '#3e2723', accent: '#f48fb1' },
    { id: 'candy', name: 'Candy', bg: '#fdf0f8', accent: '#f4a0c8' },
    { id: 'aurora', name: 'Aurora', bg: '#0a0e1a', accent: '#34d399' },
    { id: 'synthwave', name: 'Synthwave', bg: '#1a1b26', accent: '#bb9af7' },
    { id: 'minimal', name: 'Minimal', bg: '#ffffff', accent: '#1a1a1a' },
    { id: 'wispr', name: 'Wispr', bg: '#fbfaf3', accent: '#1a342d' },
    { id: 'solarized-osaka', name: 'Osaka', bg: '#001f27', accent: '#2aa198' },
    { id: 'olivia', name: 'Olivia', bg: '#1c1b1a', accent: '#cba694' },
    { id: 'codex', name: 'Codex', bg: '#0d1117', accent: '#42d392' },
    { id: 'custom', name: 'Personalizado', bg: '#ffffff', accent: '#7c5cbf' },
  ];

  const fontSizes = [
    { id: 'xs', name: 'XS' },
    { id: 'sm', name: 'S' },
    { id: 'md', name: 'M' },
    { id: 'lg', name: 'L' },
    { id: 'xl', name: 'XL' },
  ];

  const gridStyles = [
    { id: 'lines', name: 'Líneas' },
    { id: 'dots', name: 'Puntos' },
    { id: 'checkerboard', name: 'Ajedrez' },
    { id: 'none', name: 'Ninguna' },
  ];

  const densities = [
    { id: 'compact', name: 'Compacto' },
    { id: 'normal', name: 'Normal' },
    { id: 'comfortable', name: 'Cómodo' },
  ];
</script>

<div class="settings-overlay" id="settings-overlay"></div>
<div class="settings-panel" id="settings-panel">
  <div class="settings-header">
    <h3><i data-lucide="settings"></i> Configuración</h3>
    <button class="settings-close" id="settings-close" aria-label="Cerrar configuración">
      <i data-lucide="x"></i>
    </button>
  </div>

  <div class="settings-body">
    <!-- APARIENCIA -->
    <div class="settings-section">
      <div class="settings-label">Apariencia</div>
      <div class="settings-row">
        <span class="settings-row-label">Tema</span>
      </div>
      <label class="toggle-row theme-system-row">
        <span class="toggle-label">Usar tema del sistema</span>
        <input type="checkbox" class="toggle-input" id="setting-system-theme">
        <span class="toggle-switch"></span>
      </label>
      <div class="theme-chip-grid" id="theme-chip-grid">
        {#each themes as theme}
          <button
            class="theme-chip"
            data-theme={theme.id}
            style="--chip-bg: {theme.bg}; --chip-accent: {theme.accent};"
            title={theme.name}
          >
            <span class="theme-chip-dot" style="background: {theme.accent}"></span>
            <span class="theme-chip-name">{theme.name}</span>
          </button>
        {/each}
      </div>

      <div class="settings-row" style="margin-top:12px">
        <span class="settings-row-label">Tamaño de fuente</span>
      </div>
      <div class="btn-grid settings-btn-grid" id="setting-font-size-grid">
        {#each fontSizes as fs}
          <button class="base-btn" data-font-size={fs.id}>{fs.name}</button>
        {/each}
      </div>

      <div class="settings-row" style="margin-top:12px">
        <span class="settings-row-label">Redondez de esquinas</span>
      </div>
      <div class="range-row">
        <input type="range" id="setting-corner-radius" min="0" max="20" value="8" step="1">
        <span class="range-value" id="setting-corner-radius-val">8px</span>
      </div>

      <div class="settings-row" style="margin-top:12px">
        <span class="settings-row-label">Densidad</span>
      </div>
      <div class="btn-grid settings-btn-grid" id="setting-density-grid">
        {#each densities as d}
          <button class="base-btn" data-density={d.id}>{d.name}</button>
        {/each}
      </div>
    </div>

    <!-- TEMA PERSONALIZADO -->
    <div class="settings-section" id="custom-theme-section" style="display:none">
      <div class="settings-label">Tema personalizado</div>
      <div class="custom-theme-grid">
        <label>Fondo <input type="color" id="ct-bg" value="#faf9f5"></label>
        <label>Superficie <input type="color" id="ct-surface" value="#fffdf8"></label>
        <label>Superficie fuerte <input type="color" id="ct-surface-strong" value="#ffffff"></label>
        <label>Texto <input type="color" id="ct-ink" value="#27211b"></label>
        <label>Texto secundario <input type="color" id="ct-muted" value="#766d62"></label>
        <label>Líneas <input type="color" id="ct-line" value="#dfd7cb"></label>
        <label>Acento <input type="color" id="ct-accent" value="#b18100"></label>
      </div>
      <div class="btn-row" style="margin-top:10px">
        <button class="btn btn-small" id="ct-save" style="flex:1">
          <i data-lucide="save"></i> Guardar tema
        </button>
        <button class="btn btn-small btn-quiet" id="ct-reset" style="flex:1">
          <i data-lucide="rotate-ccw"></i> Restaurar
        </button>
      </div>
    </div>

    <!-- NAVEGACIÓN -->
    <div class="settings-section">
      <div class="settings-label">Navegación</div>
      <label class="toggle-row">
        <span class="toggle-label">Recordar última herramienta</span>
        <input type="checkbox" class="toggle-input" id="setting-remember-tool" checked>
        <span class="toggle-switch"></span>
      </label>
      <label class="toggle-row">
        <span class="toggle-label">Mostrar favoritas y recientes</span>
        <input type="checkbox" class="toggle-input" id="setting-quick-access" checked>
        <span class="toggle-switch"></span>
      </label>
      <label class="toggle-row">
        <span class="toggle-label">Favoritas arriba en el menú</span>
        <input type="checkbox" class="toggle-input" id="setting-sidebar-favorites" checked>
        <span class="toggle-switch"></span>
      </label>
      <label class="toggle-row">
        <span class="toggle-label">Cerrar menú al elegir en celular</span>
        <input type="checkbox" class="toggle-input" id="setting-close-mobile" checked>
        <span class="toggle-switch"></span>
      </label>
      <label class="toggle-row">
        <span class="toggle-label">Enfocar primer campo en computadora</span>
        <input type="checkbox" class="toggle-input" id="setting-autofocus" checked>
        <span class="toggle-switch"></span>
      </label>
      <div class="settings-row" style="margin-top:8px">
        <span class="settings-row-label">Recientes a mostrar</span>
      </div>
      <div class="range-row">
        <input type="range" id="setting-recent-count" min="3" max="10" value="5" step="1">
        <span class="range-value" id="setting-recent-count-val">5</span>
      </div>
    </div>

    <!-- INTERFAZ -->
    <div class="settings-section">
      <div class="settings-label">Interfaz</div>
      <div class="settings-row">
        <span class="settings-row-label">Estilo de cuadrícula</span>
      </div>
      <div class="btn-grid settings-btn-grid" id="setting-grid-style-grid">
        {#each gridStyles as gs}
          <button class="base-btn" data-grid-style={gs.id}>{gs.name}</button>
        {/each}
      </div>

      <label class="toggle-row">
        <span class="toggle-label">Controles grandes</span>
        <input type="checkbox" class="toggle-input" id="setting-large-controls">
        <span class="toggle-switch"></span>
      </label>
      <label class="toggle-row">
        <span class="toggle-label">Contenido amplio</span>
        <input type="checkbox" class="toggle-input" id="setting-wide-content">
        <span class="toggle-switch"></span>
      </label>
      <label class="toggle-row">
        <span class="toggle-label">Mostrar descripciones</span>
        <input type="checkbox" class="toggle-input" id="setting-desc" checked>
        <span class="toggle-switch"></span>
      </label>
      <label class="toggle-row">
        <span class="toggle-label">Contraste alto</span>
        <input type="checkbox" class="toggle-input" id="setting-high-contrast">
        <span class="toggle-switch"></span>
      </label>
      <label class="toggle-row">
        <span class="toggle-label">Reducir movimiento</span>
        <input type="checkbox" class="toggle-input" id="setting-motion">
        <span class="toggle-switch"></span>
      </label>

      <div class="settings-row" style="margin-top:12px">
        <span class="settings-row-label">Altura mínima de textarea</span>
      </div>
      <div class="range-row">
        <input type="range" id="setting-textarea-height" min="60" max="600" value="112" step="8">
        <span class="range-value" id="setting-textarea-height-val">112px</span>
      </div>

      <label class="toggle-row">
        <span class="toggle-label">Resultado pegajoso (sticky)</span>
        <input type="checkbox" class="toggle-input" id="setting-sticky-output">
        <span class="toggle-switch"></span>
      </label>
    </div>

    <!-- COMPORTAMIENTO -->
    <div class="settings-section">
      <div class="settings-label">Comportamiento</div>
      <label class="toggle-row">
        <span class="toggle-label">Confirmar antes de eliminar</span>
        <input type="checkbox" class="toggle-input" id="setting-confirm-delete" checked>
        <span class="toggle-switch"></span>
      </label>
      <label class="toggle-row">
        <span class="toggle-label">Tema automático por horario</span>
        <input type="checkbox" class="toggle-input" id="setting-auto-theme">
        <span class="toggle-switch"></span>
      </label>
      <div class="auto-theme-controls" id="auto-theme-controls" style="display:none">
        <div class="auto-theme-row">
          <label for="setting-day-theme">Día</label>
          <select id="setting-day-theme">
            {#each themes.filter(t => t.id !== 'custom') as theme}
              <option value={theme.id}>{theme.name}</option>
            {/each}
          </select>
        </div>
        <div class="auto-theme-row">
          <label for="setting-night-theme">Noche</label>
          <select id="setting-night-theme">
            {#each themes.filter(t => t.id !== 'custom') as theme}
              <option value={theme.id}>{theme.name}</option>
            {/each}
          </select>
        </div>
        <div class="auto-theme-row">
          <label for="setting-sunset">Cambio día → noche</label>
          <input type="time" id="setting-sunset" value="20:00">
        </div>
        <div class="auto-theme-row">
          <label for="setting-sunrise">Cambio noche → día</label>
          <input type="time" id="setting-sunrise" value="07:00">
        </div>
      </div>
    </div>

    <!-- DATOS -->
    <div class="settings-section">
      <div class="settings-label">Datos</div>
      <button class="btn btn-small" id="setting-export" style="width:100%">
        <i data-lucide="download"></i> Exportar configuración
      </button>
      <button class="btn btn-small" id="setting-import" style="width:100%;margin-top:8px">
        <i data-lucide="upload"></i> Importar configuración
      </button>
      <input type="file" id="setting-import-file" accept=".json" style="display:none">
      <button class="btn btn-small" id="setting-clear" style="width:100%;margin-top:8px">
        <i data-lucide="trash-2"></i> Limpiar datos guardados
      </button>
      <p class="settings-hint">Esto eliminará notas, preferencias y configuraciones locales.</p>
    </div>
  </div>
</div>
