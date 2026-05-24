export const activeTool = $state({ id: null, trigger: 0 });

export function setActiveTool(id) {
  activeTool.id = id;
  activeTool.trigger += 1;
}
