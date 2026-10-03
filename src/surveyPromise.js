export function surveyPromiseLabel(mission) {
  return mission && mission.complete ? 'Survey is ready' : 'Survey comes after the mission';
}
