import { AVAILABILITY_PAGE_STYLE } from './availabilityPageStyle.js';
import { AVAILABILITY_PAGE_BODY } from './availabilityPageBody.js';
import { AVAILABILITY_PAGE_SCRIPT_A } from './availabilityPageScriptA.js';
import { AVAILABILITY_PAGE_SCRIPT_B } from './availabilityPageScriptB.js';
import { AVAILABILITY_PAGE_SCRIPT_C } from './availabilityPageScriptC.js';

// Default /availability to earliest scheduledOn >= today unless ?round= is set.
// Keep remembered context only when still onOrAfterToday / future.
const NEXT_NIGHT_PICKER = "const startOfToday=new Date();startOfToday.setHours(0,0,0,0);const onOrAfterToday=(context)=>{const stamp=Date.parse(String(context.scheduledOn||'')+'T12:00:00');return Number.isFinite(stamp)&&stamp>=startOfToday.getTime()};const upcoming=contexts.find((context)=>onOrAfterToday(context));const requestedContext=contexts.find((context)=>context.roundId===requested);const rememberedContext=remembered?contexts.find((context)=>contextKey(context)===remembered):null;if(requestedContext)contextSelect.value=contextKey(requestedContext);else if(rememberedContext&&onOrAfterToday(rememberedContext))contextSelect.value=contextKey(rememberedContext);else if(upcoming)contextSelect.value=contextKey(upcoming);";

export function renderAvailabilityPage() {
  const script = (
    AVAILABILITY_PAGE_SCRIPT_A
    + AVAILABILITY_PAGE_SCRIPT_B
    + AVAILABILITY_PAGE_SCRIPT_C
  ).replace('__NEXT_NIGHT_PICKER__', NEXT_NIGHT_PICKER);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Fremont Derby Availability</title>
  <style>
${AVAILABILITY_PAGE_STYLE}
  </style>
</head>
<body>
${AVAILABILITY_PAGE_BODY}
  <script>
${script}
  </script>
</body>
</html>`;
}
