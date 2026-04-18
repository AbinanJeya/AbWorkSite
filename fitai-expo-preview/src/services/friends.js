function normalizeName(name) {
  return name || 'You';
}

export function formatSteps(stepCount) {
  return Number(stepCount || 0).toLocaleString();
}

export async function getLeaderboardData(_window, todaySteps, userName) {
  const youName = normalizeName(userName);
  return [
    { name: 'Kai', steps: 12492, isYou: false },
    { name: 'Noah', steps: 9312, isYou: false },
    { name: youName, steps: todaySteps, isYou: true },
  ];
}
