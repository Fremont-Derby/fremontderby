export function applyScorecardProgressionRuntime(html) {
  if (typeof html !== 'string') return html;
  return html
    .replace(
      'function reconciledScore(comparison){',
      "function submittedScore(racks){let a=0,b=0;for(const rack of racks||[]){const side=winnerSide(rack);if(side==='A')a+=1;if(side==='B')b+=1}return[a,b]}function raceReached(scorecard,score){const targetA=Number(scorecard&&scorecard.race_to_a);const targetB=Number(scorecard&&scorecard.race_to_b);return(Number.isFinite(targetA)&&score[0]>=targetA)||(Number.isFinite(targetB)&&score[1]>=targetB)}function reconciledScore(comparison){",
    )
    .replace(
      'const score=reconciledScore(comparison);setText(\'[data-score-a]\',score[0]);setText(\'[data-score-b]\',score[1]);renderLedger();const nextRack=own.length+1;setText(\'[data-next-rack]\',nextRack);setText(\'[data-next-discipline]\',gameForRack(nextRack));addRackButton.textContent=\'Add Rack \'+nextRack+' · '+gameForRack(nextRack);',
      'const score=submittedScore(own);const complete=raceReached(currentScorecard,score);setText(\'[data-score-a]\',score[0]);setText(\'[data-score-b]\',score[1]);renderLedger();const nextRack=own.length+1;setText(\'[data-next-rack]\',nextRack);setText(\'[data-next-discipline]\',gameForRack(nextRack));addRackButton.textContent=complete?\'Race complete\':\'Add Rack \'+nextRack+' · '+gameForRack(nextRack);',
    )
    .replace(
      'addRackButton.disabled=locked||Boolean(comparison.own_confirmed_at);',
      'addRackButton.disabled=locked||Boolean(comparison.own_confirmed_at)||complete;',
    )
    .replace(
      "if(error.message.includes('Score changed on another device')){winnerPicker.dataset.open='false';closeRackEditor();await loadAll({quiet:true});setStatus('Score changed on another phone','error');showError('Score changed on another phone. We refreshed it—check the current rack before scoring.');return}setStatus('Action failed','error');showError(error.message)}",
      "const message=error&&error.message?error.message:'Request failed';if(message.includes('Score changed on another device')||message.includes('Refresh the scorecard before changing the score')){winnerPicker.dataset.open='false';closeRackEditor();await loadAll({quiet:true});setStatus('Score changed on another phone','error');showError('Score changed on another phone. We refreshed it—check the current rack before scoring.');return}setStatus(message,'error');showError(message)}",
    );
}
