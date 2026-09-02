export const sharedRackLedgerScorecardStyles = `
  *{box-sizing:border-box}
  body{margin:0;min-height:100vh;overflow-x:hidden}
  button{font:inherit;min-height:48px;border:1px solid transparent;border-radius:11px;padding:9px 12px;font-weight:850;cursor:pointer;touch-action:manipulation}
  button:disabled{opacity:.42;cursor:not-allowed}
  .scorecard-app{width:min(760px,100%);margin:auto;padding:10px 8px 20px}
  .scorecard-status{min-height:28px;display:flex;justify-content:flex-end;align-items:center;font-size:.76rem}
  .match-context{position:relative;min-height:42px;display:flex;align-items:center;justify-content:center;gap:8px;font-size:.9rem;font-weight:800;text-align:center}
  .match-context a{position:absolute;right:12px;font-size:.72rem;text-decoration:none}
  .sandbox-banner{margin:0 0 8px;padding:10px 12px;border:1px solid;border-radius:13px;font-size:.75rem;line-height:1.35}
  .sandbox-banner strong{display:block;font-size:.8rem;margin-bottom:2px}
  .perspective{margin:0 0 8px;padding:8px;border:1px solid;border-radius:13px;display:none;gap:7px;align-items:center}
  .perspective[data-open=true]{display:grid;grid-template-columns:auto 1fr 1fr}
  .perspective span{font-size:.72rem;font-weight:800}
  .perspective button{min-height:42px}
  .perspective button[aria-pressed=true]{font-weight:950}
  .opening-setup{margin:0 0 8px;padding:8px;display:grid;grid-template-columns:auto minmax(210px,1fr);gap:10px;align-items:center}
  .opening-copy strong{display:block;font-size:.78rem}.opening-copy span{display:block;margin-top:2px;font-size:.64rem}
  .opening-options{display:grid;grid-template-columns:1fr 1fr;gap:6px}.opening-option{min-height:44px}
  .team-score{border:1px solid;border-radius:16px;padding:12px 14px;display:grid;gap:7px}
  .team-score-label{text-align:center;font-size:.7rem;font-weight:900;letter-spacing:.09em;text-transform:uppercase}
  .team-score-grid{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:12px}
  .team-block{min-width:0;text-align:center}.team-name{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:1rem;font-weight:900}
  .team-points{display:block;margin-top:3px;font-size:clamp(2.3rem,12vw,4.2rem);line-height:.88;font-weight:1000;letter-spacing:-.06em}.team-separator{font-size:2rem;font-weight:700}
  .race{margin-top:8px;border:1px solid;border-radius:16px;overflow:hidden}
  .race-context{position:relative;padding:8px 10px;border-bottom:1px solid;display:flex;justify-content:center;gap:8px;font-size:.7rem;text-transform:uppercase;letter-spacing:.06em}
  .race-context strong{position:absolute;right:18px;text-transform:none;letter-spacing:0}
  .players{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;padding:12px 10px 10px}
  .player{min-width:0}.player:last-child{text-align:right}.player-name{margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:clamp(1.05rem,4.5vw,1.4rem)}
  .player-meta{margin-top:2px;font-size:.66rem}.race-target{margin-top:4px;font-size:.75rem}.race-target b{font-size:.95rem}
  .individual-score{display:flex;align-items:center;gap:9px;padding:0 12px;font-size:clamp(2.8rem,14vw,4.8rem);line-height:.8;font-weight:1000;letter-spacing:-.07em;white-space:nowrap}
  .individual-score span:nth-child(2){font-size:.48em;font-weight:600}
  .ledger-panel{margin:0 8px 8px;border:1px solid;border-radius:13px;overflow:hidden}
  .ledger-head{min-height:40px;padding:7px 9px;display:flex;align-items:center;justify-content:space-between;gap:8px;border-bottom:1px solid}.ledger-head strong{font-size:.8rem}.ledger-state{font-size:.66rem;text-align:right}
  .ledger-scroll{max-width:100%;overflow-x:auto;overscroll-behavior-x:contain;scrollbar-width:thin}
  .ledger{border-collapse:separate;border-spacing:0;min-width:100%;width:max-content}.ledger th,.ledger td{min-width:58px;height:48px;border-right:1px solid;border-bottom:1px solid;text-align:center;padding:4px}
  .ledger tr:last-child th,.ledger tr:last-child td{border-bottom:0}.ledger th:last-child,.ledger td:last-child{border-right:0}
  .ledger .row-label{position:sticky;left:0;z-index:2;width:105px;min-width:105px;max-width:105px;padding:5px 7px;text-align:left;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.72rem}
  .rack-number{display:inline-block;font-size:.72rem;margin-right:3px}.game-chip{display:inline-grid;place-items:center;width:23px;height:23px;border:1px solid;border-radius:50%;font-size:.65rem;font-weight:1000}
  .submission{font-size:1.08rem;font-weight:1000}.submission[data-value=W]{font-weight:1000}.submission[data-value=L]{font-weight:1000}
  .submission[data-state=matched]{box-shadow:inset 0 -3px 0 #18864a}.submission[data-state=pending]{box-shadow:inset 0 -3px 0 #c99d15}.submission[data-state=mismatch]{box-shadow:inset 0 0 0 2px #d84d43}.submission[data-state=unplayed]{opacity:.6}
  .rack-head[data-state=mismatch],.rack-status[data-state=mismatch]{box-shadow:inset 0 0 0 2px #d84d43}.rack-head[data-state=pending],.rack-status[data-state=pending]{box-shadow:inset 0 -3px 0 #c99d15}
  .rack-edit{width:100%;height:100%;min-height:40px;padding:3px;background:transparent;color:inherit;border-color:transparent;border-radius:8px;font-size:1.05rem}.rack-edit::after{content:'\270e';display:block;margin-top:1px;font-size:.48rem}.rack-edit[data-pending=true]::after{content:'answer';font-size:.45rem}
  .rack-status{font-size:.82rem;font-weight:1000}
  .ledger-help{padding:7px 9px;text-align:center;font-size:.68rem;border-top:1px solid}
  .edit-panel{margin-top:8px;padding:10px;border:1px solid;border-radius:14px}.edit-panel[hidden]{display:none}.edit-head{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}.edit-head strong{font-size:.9rem}.edit-head span{display:block;margin-top:2px;font-size:.67rem}.edit-close{min-width:44px;min-height:44px;padding:4px;background:transparent}
  .edit-compare{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px}.edit-value{padding:7px;border:1px solid;border-radius:9px}.edit-value span{display:block;font-size:.61rem}.edit-value strong{display:block;margin-top:2px;font-size:1rem}
  .edit-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:8px}.edit-result{min-height:54px}.edit-note{margin:7px 1px 0;font-size:.64rem;line-height:1.35}
  .next-rack{margin-top:8px}.add-rack{width:100%;min-height:62px;font-size:1.05rem}.winner-picker{display:none;grid-template-columns:1fr 1fr;gap:7px;margin-top:7px;padding:8px;border:1px solid;border-radius:12px}.winner-picker[data-open=true]{display:grid}.winner{min-height:56px;overflow:hidden;text-overflow:ellipsis}
  .reconcile{margin-top:8px;padding:9px 10px;border:1px solid;border-radius:12px;display:flex;justify-content:space-between;align-items:center;gap:8px}.reconcile strong{font-size:.8rem}.reconcile span{font-size:.67rem;text-align:right}
  .quick-actions{display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;padding:8px 0}.quick-actions button,.quick-actions summary{min-height:48px}
  .details{border:1px solid;border-radius:11px;overflow:hidden}.details summary{min-height:48px;padding:13px;cursor:pointer;font-size:.78rem;font-weight:900;list-style:none;text-align:center}.details summary::-webkit-details-marker{display:none}
  .detail-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;padding:9px;border-top:1px solid}.detail span{display:block;font-size:.6rem}.detail strong{display:block;margin-top:2px;overflow-wrap:anywhere;font-size:.72rem}
  .completion-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:7px}.confirm,.finalize{min-height:48px}
  .error-popup{position:fixed;z-index:30;left:50%;bottom:16px;width:min(430px,calc(100% - 24px));transform:translateX(-50%);display:none;padding:11px 13px;border:1px solid;border-radius:12px}.error-popup[data-open=true]{display:block}.error-popup strong{display:block;font-size:.8rem}.error-popup span{display:block;margin-top:2px;font-size:.7rem}
  .sandbox-footer{margin-top:10px;padding:10px;border:1px solid;border-radius:13px}.sandbox-footer textarea{width:100%;min-height:72px;padding:9px}.sandbox-footer-actions{display:flex;flex-wrap:wrap;gap:7px;margin-top:7px}.sandbox-footer a{display:inline-flex;align-items:center;min-height:44px;padding:0 10px}
  @media(max-width:520px){.scorecard-app{padding:8px 6px 18px}.match-context{justify-content:flex-start;padding-right:78px;text-align:left}.match-context a{right:8px}.opening-setup{grid-template-columns:1fr}.players{grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);padding:10px 8px}.individual-score{padding:0 7px;gap:5px}.ledger .row-label{width:94px;min-width:94px;max-width:94px}.ledger th,.ledger td{min-width:53px}.quick-actions{grid-template-columns:1fr 1fr 1fr}.quick-actions button,.details summary{padding:6px 4px;font-size:.69rem}.detail-grid{grid-template-columns:1fr 1fr}}
`;
