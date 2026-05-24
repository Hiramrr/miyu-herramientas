export const activeTool = $state({ id: null });

export function setActiveTool(id) {
  activeTool.id = id;
}
