// Reglas de navegación del menú lateral, separadas de app.js para poder probarlas sin montar la app.

// Las filas de Favoritas usan otro atributo que las de Herramientas; ambas abren la misma herramienta.
export function toolIdFromRow(row) {
  return row.getAttribute('data-tool') || row.getAttribute('data-sidebar-favorite-tool');
}

// Descarta datos guardados a mano o de versiones antiguas: duplicados, tipos inesperados y herramientas borradas.
export function parseFavoriteIds(value, isKnownTool) {
  if (!Array.isArray(value)) return [];
  return value.filter((id, index) => typeof id === 'string' && value.indexOf(id) === index && isKnownTool(id));
}
