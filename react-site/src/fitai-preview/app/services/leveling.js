export { XP_AMOUNTS, addXP, awardDailyBonus, getLevelInfo, getXPData } from './storage.js';

export async function awardMissionXPIfEligible() {
  return false;
}

export async function awardWeeklyWorkoutTargetBonusIfEligible() {
  return false;
}
