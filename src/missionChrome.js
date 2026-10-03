export function personaMissionLine(mission = {}) {
  if (!mission.name) return '';
  return `Persona mission: ${mission.name}.`;
}
export function missionChromeLine(chrome = {}) {
  const parts = [chrome.task, chrome.done, chrome.abort].filter(Boolean);
  if (parts.length < 3) return '';
  return `Task ${chrome.task}. Done when ${chrome.done}. Abort: ${chrome.abort}.`;
}
