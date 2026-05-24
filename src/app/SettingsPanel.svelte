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
    </div>

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
    </div>

    <div class="settings-section">
      <div class="settings-label">Interfaz</div>
      <label class="toggle-row">
        <span class="toggle-label">Cuadrícula de fondo</span>
        <input type="checkbox" class="toggle-input" id="setting-grid" checked>
        <span class="toggle-switch"></span>
      </label>
      <label class="toggle-row">
        <span class="toggle-label">Densidad compacta</span>
        <input type="checkbox" class="toggle-input" id="setting-compact">
        <span class="toggle-switch"></span>
      </label>
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
        <span class="toggle-label">Texto más grande</span>
        <input type="checkbox" class="toggle-input" id="setting-large-text">
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
    </div>

    <div class="settings-section">
      <div class="settings-label">Datos</div>
      <button class="btn btn-small" id="setting-clear" style="width:100%">
        <i data-lucide="trash-2"></i> Limpiar datos guardados
      </button>
      <p class="settings-hint">Esto eliminará notas, preferencias y configuraciones locales.</p>
    </div>
  </div>
</div>
