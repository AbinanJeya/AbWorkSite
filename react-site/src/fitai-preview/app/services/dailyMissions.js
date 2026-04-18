export function getDailyMissionPlan(context = {}) {
  const proteinProgress = Math.min((context.intake?.protein || 0) / 130, 1);
  const waterProgress = Math.min((context.water || 0) / 2500, 1);
  const stepProgress = Math.min((context.steps || 0) / (context.stepGoal || 10000), 1);

  return {
    summary: 'Protein and hydration are the two easiest wins left today.',
    missions: [
      {
        id: 'mission-protein',
        tone: 'amber',
        eyebrow: 'Recovery',
        status: proteinProgress >= 1 ? 'Complete' : 'In Progress',
        title: 'Hit 130g protein',
        subtitle: 'Staying ahead here will keep recovery smoother for tomorrow.',
        progressLabel: `${Math.round((context.intake?.protein || 0) || 0)}g of 130g`,
        progress: proteinProgress,
        actionLabel: 'Open coach',
        completed: proteinProgress >= 1,
      },
      {
        id: 'mission-hydration',
        tone: 'blue',
        eyebrow: 'Hydration',
        status: waterProgress >= 1 ? 'Complete' : 'In Progress',
        title: 'Reach 2.5L water',
        subtitle: 'Two more quick logs would get this back on track.',
        progressLabel: `${context.water || 0}ml of 2500ml`,
        progress: waterProgress,
        actionLabel: 'Log water',
        completed: waterProgress >= 1,
      },
      {
        id: 'mission-steps',
        tone: 'primary',
        eyebrow: 'Movement',
        status: stepProgress >= 1 ? 'Complete' : 'In Progress',
        title: 'Finish your step ring',
        subtitle: 'A short walk later would meaningfully tighten the day.',
        progressLabel: `${context.steps || 0} of ${context.stepGoal || 10000} steps`,
        progress: stepProgress,
        actionLabel: 'Open activity',
        completed: stepProgress >= 1,
      },
    ],
  };
}
