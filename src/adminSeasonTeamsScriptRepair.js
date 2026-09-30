const OLD_PICKER = "const requested=new URLSearchParams(location.search).get('season');if(requested&&seasons.some(item=>item.id===requested))seasonSelect.value=requested;";
const NEW_PICKER = "const requested=new URLSearchParams(location.search).get('season');if(requested&&seasons.some(item=>item.id===requested))seasonSelect.value=requested;else{const active=seasons.find(item=>item.status==='active');if(active)seasonSelect.value=active.id}";

export function repairAdminSeasonTeamsScript(html) {
  return String(html || '').replace(OLD_PICKER, NEW_PICKER);
}
