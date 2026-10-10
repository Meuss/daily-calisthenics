import type { ProgressionId } from '../primitives';

export type ExerciseMode = 'reps' | 'hold';

export type Exercise = {
  id: string;
  name: string;
  progression: ProgressionId;
  mode: ExerciseMode;
  /** Target (reps, or seconds for a Hold) when the user first reaches this step. */
  startTarget: number;
  cues: string[];
};

// Within a Progression, list order is step order.
export const EXERCISE_LIST: Exercise[] = [
  // Push
  { id: 'wall-push-up', name: 'Wall push-up', progression: 'push', mode: 'reps', startTarget: 10, cues: ['Hands on the wall at shoulder height, a bit wider than your shoulders', 'Body straight from head to heels', 'Bend your elbows until your nose nearly touches the wall, then push back'] },
  { id: 'incline-push-up', name: 'Incline push-up', progression: 'push', mode: 'reps', startTarget: 8, cues: ['Hands on the edge of a sofa, bed or sturdy chair', 'Body in one straight line, core tight', 'Lower your chest to the edge, then push away'] },
  { id: 'knee-push-up', name: 'Knee push-up', progression: 'push', mode: 'reps', startTarget: 6, cues: ['Knees on the floor, hands under your shoulders', 'Straight line from knees to head, no sagging hips', "Lower your chest to a fist's height above the floor, then press up"] },
  { id: 'push-up', name: 'Push-up', progression: 'push', mode: 'reps', startTarget: 5, cues: ['Hands under your shoulders, legs straight, on your toes', 'Squeeze glutes and abs so your body stays rigid', 'Lower until your chest nearly touches, elbows at about 45°, then press up'] },
  { id: 'wide-push-up', name: 'Wide push-up', progression: 'push', mode: 'reps', startTarget: 5, cues: ['Hands wider than your shoulders', 'Body straight, core tight', 'Lower your chest between your hands, then press up'] },
  { id: 'diamond-push-up', name: 'Diamond push-up', progression: 'push', mode: 'reps', startTarget: 4, cues: ['Hands together under your chest, thumbs and index fingers forming a diamond', 'Elbows stay close to your sides', 'Lower your chest to your hands, then press up'] },

  // Squat
  { id: 'chair-squat', name: 'Chair squat', progression: 'squat', mode: 'reps', startTarget: 10, cues: ['Stand in front of a chair, feet shoulder-width apart', 'Sit back until you lightly touch the seat', 'Stand up by driving through your heels'] },
  { id: 'squat', name: 'Bodyweight squat', progression: 'squat', mode: 'reps', startTarget: 10, cues: ['Feet shoulder-width apart, toes slightly out', 'Hips back and down until your thighs are parallel to the floor', 'Chest up, knees tracking over your toes'] },
  { id: 'pause-squat', name: 'Pause squat', progression: 'squat', mode: 'reps', startTarget: 8, cues: ['Squat down to parallel', 'Hold the bottom position for 2 seconds', 'Drive up through your heels'] },
  { id: 'split-squat', name: 'Split squat', progression: 'squat', mode: 'reps', startTarget: 6, cues: ['Long stride stance, back heel raised', 'Lower your back knee toward the floor', 'Do all reps on one leg, then switch'] },
  { id: 'jump-squat', name: 'Jump squat', progression: 'squat', mode: 'reps', startTarget: 8, cues: ['Squat down to parallel', 'Jump up explosively', 'Land softly and go straight into the next rep'] },

  // Hinge
  { id: 'glute-bridge', name: 'Glute bridge', progression: 'hinge', mode: 'reps', startTarget: 10, cues: ['Lie on your back, knees bent, feet flat', 'Push through your heels to lift your hips until knees, hips and shoulders line up', 'Squeeze your glutes at the top, lower slowly'] },
  { id: 'single-leg-glute-bridge', name: 'Single-leg glute bridge', progression: 'hinge', mode: 'reps', startTarget: 6, cues: ['Glute bridge with one leg extended', 'Keep your hips level', 'Do all reps on one side, then switch'] },
  { id: 'single-leg-bridge-hold', name: 'Single-leg bridge hold', progression: 'hinge', mode: 'hold', startTarget: 20, cues: ['Lift into a single-leg glute bridge', 'Hold your hips high and level', 'Switch legs halfway through'] },

  // Lunge
  { id: 'reverse-lunge', name: 'Reverse lunge', progression: 'lunge', mode: 'reps', startTarget: 6, cues: ['Step one foot back and lower your back knee toward the floor', 'Front knee stays above the ankle', 'Push through your front heel to return; alternate legs'] },
  { id: 'forward-lunge', name: 'Forward lunge', progression: 'lunge', mode: 'reps', startTarget: 6, cues: ['Step forward and lower until both knees are at about 90°', 'Torso upright', 'Push back to standing; alternate legs'] },
  { id: 'alternating-lunge', name: 'Alternating lunge', progression: 'lunge', mode: 'reps', startTarget: 10, cues: ['Lunge, return, and lunge with the other leg without pausing', 'Torso upright', 'Control the way down'] },

  // Core (hold)
  { id: 'knee-plank', name: 'Knee plank', progression: 'coreHold', mode: 'hold', startTarget: 20, cues: ['Forearms and knees on the floor', 'Straight line from knees to head', "Breathe steadily, don't hold your breath"] },
  { id: 'plank', name: 'Plank', progression: 'coreHold', mode: 'hold', startTarget: 20, cues: ['Forearms on the floor, elbows under your shoulders, on your toes', 'Squeeze glutes and abs, hips level', 'Breathe steadily'] },
  { id: 'plank-shoulder-taps', name: 'Plank shoulder taps', progression: 'coreHold', mode: 'reps', startTarget: 10, cues: ['High plank on your hands, feet wide', 'Tap the opposite shoulder with one hand', 'Keep your hips as still as possible; alternate'] },

  // Core (dynamic)
  { id: 'dead-bug', name: 'Dead bug', progression: 'coreDynamic', mode: 'reps', startTarget: 8, cues: ['Lie on your back, arms up, knees bent at 90° above your hips', 'Lower the opposite arm and leg toward the floor', 'Lower back stays pressed into the floor; alternate'] },
  { id: 'bicycle-crunch', name: 'Bicycle crunch', progression: 'coreDynamic', mode: 'reps', startTarget: 10, cues: ['Hands lightly behind your head, shoulders off the floor', 'Bring one elbow toward the opposite knee while extending the other leg', 'Move slowly; alternate sides'] },
  { id: 'hollow-hold', name: 'Hollow hold', progression: 'coreDynamic', mode: 'hold', startTarget: 15, cues: ['Lie on your back, arms overhead', 'Lift shoulders and legs a few centimetres off the floor', 'Lower back pressed into the floor'] },

  // Back
  { id: 'prone-ytw', name: 'Prone Y-T-W raise', progression: 'back', mode: 'reps', startTarget: 6, cues: ['Lie face down, forehead on a towel', 'Lift your arms into a Y, then a T, then a W: that is one rep', 'Squeeze your shoulder blades together, thumbs up'] },
  { id: 'superman-hold', name: 'Superman hold', progression: 'back', mode: 'hold', startTarget: 15, cues: ['Lie face down, arms extended overhead', 'Lift arms, chest and legs off the floor', 'Hold while looking at the floor'] },
  { id: 'reverse-snow-angel', name: 'Reverse snow angel', progression: 'back', mode: 'reps', startTarget: 8, cues: ['Lie face down, arms by your sides, lifted off the floor', 'Sweep your arms overhead in an arc without touching the floor', 'Sweep back down slowly'] },
];

export const EXERCISES: Record<string, Exercise> = Object.fromEntries(EXERCISE_LIST.map((exercise) => [exercise.id, exercise]));
