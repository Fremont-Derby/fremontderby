const OLD_PICKER = "const requestedContext=contexts.find((context)=>context.roundId===requested);if(requestedContext)contextSelect.value=contextKey(requestedContext);else if(remembered&&contexts.some((context)=>contextKey(context)===remembered))contextSelect.value=remembered;";
const NEW_PICKER = "const startOfToday=new Date();startOfToday.setHours(0,0,0,0);const upcoming=contexts.find((context)=>Number.isFinite(Date.parse(context.scheduledOn))&&Date.parse(context.scheduledOn)>=startOfToday.getTime());const requestedContext=contexts.find((context)=>context.roundId===requested);if(requestedContext)contextSelect.value=contextKey(requestedContext);else if(upcoming)contextSelect.value=contextKey(upcoming);else if(remembered&&contexts.some((context)=>contextKey(context)===remembered))contextSelect.value=remembered;";

export function repairAvailabilityScript(html) {
  return String(html || '').replace(OLD_PICKER, NEW_PICKER);
}
