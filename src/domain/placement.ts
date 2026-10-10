import type { Levels } from './primitives';

export type PushUpAnswer = '0' | '1-5' | '6-15' | '15+';
export type SquatAnswer = 'under10' | '10-25' | '25+';
export type PlankAnswer = 'under20' | '20-45' | '45+';
export type PlacementAnswers = { pushUps: PushUpAnswer; squats: SquatAnswer; plank: PlankAnswer };

const PUSH: Record<PushUpAnswer, Pick<Levels, 'push'>> = {
  '0': { push: { step: 0, target: 10 } },
  '1-5': { push: { step: 2, target: 8 } },
  '6-15': { push: { step: 3, target: 6 } },
  '15+': { push: { step: 4, target: 6 } },
};

const LEGS: Record<SquatAnswer, Pick<Levels, 'squat' | 'lunge' | 'hinge'>> = {
  under10: { squat: { step: 0, target: 10 }, lunge: { step: 0, target: 6 }, hinge: { step: 0, target: 10 } },
  '10-25': { squat: { step: 1, target: 10 }, lunge: { step: 0, target: 8 }, hinge: { step: 0, target: 12 } },
  '25+': { squat: { step: 2, target: 8 }, lunge: { step: 1, target: 6 }, hinge: { step: 1, target: 6 } },
};

const CORE: Record<PlankAnswer, Pick<Levels, 'coreHold' | 'coreDynamic' | 'back'>> = {
  under20: { coreHold: { step: 0, target: 20 }, coreDynamic: { step: 0, target: 8 }, back: { step: 0, target: 6 } },
  '20-45': { coreHold: { step: 1, target: 20 }, coreDynamic: { step: 0, target: 10 }, back: { step: 0, target: 8 } },
  '45+': { coreHold: { step: 1, target: 45 }, coreDynamic: { step: 1, target: 10 }, back: { step: 1, target: 20 } },
};

export function placementLevels(answers: PlacementAnswers): Levels {
  return { ...PUSH[answers.pushUps], ...LEGS[answers.squats], ...CORE[answers.plank] };
}
