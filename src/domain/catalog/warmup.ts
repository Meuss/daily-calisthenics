export type WarmupMove = { name: string; seconds: number; cues: string[] };

export const WARMUP: WarmupMove[] = [
  { name: 'Arm circles', seconds: 20, cues: ['Arms out to the sides', 'Small circles growing bigger, switch direction halfway'] },
  { name: 'Hip circles', seconds: 20, cues: ['Hands on your hips, feet hip-width apart', 'Slow big circles, switch direction halfway'] },
  { name: 'Torso twists', seconds: 20, cues: ['Feet planted, arms relaxed', 'Rotate your upper body side to side'] },
  { name: 'Easy squats', seconds: 30, cues: ['Slow, shallow squats', 'Wake the legs up, no effort yet'] },
];
