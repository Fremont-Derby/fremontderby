export function filterQaRuns(runs, lane) {
  return runs.filter(run => run.lane === lane && (run.result === 'pass' || run.result === 'fail') && run.id);
}
