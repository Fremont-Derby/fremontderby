/** Prefer status=active on /admin/season-teams when ?season= is omitted. */
export function preferActiveSeasonDefault(html) {
  const needle =
    "if(requested&&seasons.some(item=>item.id===requested))seasonSelect.value=requested;seasonSelect.disabled=!seasons.length;";
  const replacement =
    "if(requested&&seasons.some(item=>item.id===requested))seasonSelect.value=requested;else{const active=seasons.find(item=>item.status==='active');if(active)seasonSelect.value=active.id}seasonSelect.disabled=!seasons.length;";
  if (!html.includes(needle)) return html;
  return html.replace(needle, replacement);
}
