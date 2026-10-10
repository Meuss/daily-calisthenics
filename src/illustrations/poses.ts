export type Point = [number, number];
export type Pose = { head: Point; neck: Point; hip: Point; arms: [Point, Point][]; legs: [Point, Point][] };
export type Prop = { kind: 'wall'; x: number } | { kind: 'chair'; x: number };
export type Illustration = { frames: [Pose, Pose]; prop?: Prop };

export const VIEW_WIDTH = 120;
export const VIEW_HEIGHT = 100;
export const GROUND_Y = 92;
export const CHAIR_SEAT_Y = 66;
export const CHAIR_WIDTH = 24;

const pose = (head: Point, neck: Point, hip: Point, arms: [Point, Point][], legs: [Point, Point][]): Pose => ({ head, neck, hip, arms, legs });

// Standing (facing right)
const STAND = pose([60, 12], [60, 22], [60, 50], [[[60, 36], [60, 50]]], [[[60, 71], [60, 92]]]);
const ARMS_FORWARD = pose([60, 12], [60, 22], [60, 50], [[[70, 24], [80, 24]]], [[[60, 71], [60, 92]]]);
const ARMS_UP = pose([60, 12], [60, 22], [60, 50], [[[62, 10], [64, 0]]], [[[60, 71], [60, 92]]]);
const HIPS_LEFT = pose([60, 12], [60, 22], [55, 50], [[[50, 36], [55, 48]]], [[[57, 71], [60, 92]]]);
const HIPS_RIGHT = pose([60, 12], [60, 22], [65, 50], [[[70, 36], [65, 48]]], [[[63, 71], [60, 92]]]);
const TWIST_LEFT = pose([60, 12], [60, 22], [60, 50], [[[52, 30], [42, 32]]], [[[60, 71], [60, 92]]]);
const TWIST_RIGHT = pose([60, 12], [60, 22], [60, 50], [[[68, 30], [78, 32]]], [[[60, 71], [60, 92]]]);

// Squats and lunges
const SQUAT_HALF = pose([62, 24], [60, 32], [50, 58], [[[68, 36], [78, 38]]], [[[66, 74], [60, 92]]]);
const SQUAT_DEEP = pose([66, 34], [62, 42], [44, 66], [[[72, 46], [84, 46]]], [[[68, 68], [62, 92]]]);
const CHAIR_SQUAT_DOWN = pose([64, 36], [60, 44], [42, 64], [[[70, 48], [82, 48]]], [[[66, 68], [62, 92]]]);
const JUMP = pose([60, 6], [60, 16], [60, 44], [[[62, 8], [64, 0]]], [[[60, 64], [60, 84]]]);
const LUNGE_UP = pose([60, 12], [60, 22], [60, 50], [[[60, 36], [60, 50]]], [[[70, 70], [76, 92]], [[50, 70], [42, 92]]]);
const LUNGE_DOWN = pose([60, 28], [60, 38], [60, 66], [[[60, 52], [60, 66]]], [[[78, 68], [78, 92]], [[48, 90], [34, 92]]]);

// Push-ups (head right)
const PUSH_UP_UP = pose([96, 62], [88, 68], [54, 80], [[[88, 80], [88, 92]]], [[[37, 86], [20, 92]]]);
const PUSH_UP_DOWN = pose([97, 80], [88, 84], [54, 88], [[[78, 86], [88, 92]]], [[[37, 90], [20, 92]]]);
const KNEE_PUSH_UP_UP = pose([96, 64], [88, 70], [64, 84], [[[88, 81], [88, 92]]], [[[46, 92], [28, 84]]]);
const KNEE_PUSH_UP_DOWN = pose([97, 80], [88, 84], [64, 89], [[[78, 86], [88, 92]]], [[[46, 92], [28, 84]]]);
const INCLINE_UP = pose([94, 46], [86, 52], [52, 73], [[[87, 59], [88, 66]]], [[[37, 83], [22, 92]]]);
const INCLINE_DOWN = pose([95, 58], [86, 62], [54, 78], [[[78, 62], [88, 66]]], [[[38, 85], [22, 92]]]);
const WALL_UP = pose([88, 20], [82, 26], [73, 56], [[[89, 27], [98, 28]]], [[[69, 74], [66, 92]]]);
const WALL_DOWN = pose([93, 22], [88, 28], [76, 58], [[[88, 38], [98, 28]]], [[[70, 75], [66, 92]]]);
const SHOULDER_TAP = pose([96, 62], [88, 68], [54, 80], [[[88, 80], [88, 92]], [[94, 76], [90, 70]]], [[[37, 86], [20, 92]]]);

// Planks (head right)
const ALL_FOURS = pose([92, 62], [84, 68], [56, 72], [[[84, 80], [84, 92]]], [[[52, 92], [34, 92]]]);
const KNEE_PLANK = pose([95, 74], [86, 78], [62, 86], [[[84, 92], [96, 92]]], [[[46, 92], [28, 84]]]);
const FOREARM_PLANK = pose([95, 74], [86, 78], [53, 85], [[[84, 92], [96, 92]]], [[[36, 88], [20, 92]]]);

// Lying on the back (head left)
const BRIDGE_DOWN = pose([22, 84], [30, 88], [60, 88], [[[44, 90], [56, 91]]], [[[76, 74], [84, 92]]]);
const BRIDGE_UP = pose([22, 84], [30, 88], [60, 70], [[[44, 90], [56, 91]]], [[[78, 72], [84, 92]]]);
const SINGLE_BRIDGE_DOWN = pose([22, 84], [30, 88], [60, 88], [[[44, 90], [56, 91]]], [[[76, 74], [84, 92]], [[78, 84], [98, 80]]]);
const SINGLE_BRIDGE_UP = pose([22, 84], [30, 88], [60, 70], [[[44, 90], [56, 91]]], [[[78, 72], [84, 92]], [[78, 64], [98, 58]]]);
const DEAD_BUG_START = pose([22, 84], [30, 88], [60, 88], [[[32, 74], [34, 60]]], [[[60, 70], [76, 70]]]);
const DEAD_BUG_REACH = pose([22, 84], [30, 88], [60, 88], [[[32, 74], [34, 60]], [[20, 86], [10, 88]]], [[[60, 70], [76, 70]], [[78, 88], [98, 88]]]);
const BICYCLE_LEFT = pose([24, 78], [32, 82], [60, 88], [[[38, 74], [30, 72]]], [[[52, 72], [66, 76]], [[78, 84], [98, 82]]]);
const BICYCLE_RIGHT = pose([26, 76], [34, 80], [60, 88], [[[42, 72], [34, 70]]], [[[62, 72], [76, 74]], [[76, 82], [96, 78]]]);
const LYING_FLAT = pose([22, 86], [30, 88], [60, 88], [[[18, 88], [8, 88]]], [[[78, 88], [98, 88]]]);
const HOLLOW = pose([24, 78], [32, 82], [60, 88], [[[20, 78], [10, 74]]], [[[78, 84], [98, 78]]]);

// Lying face down (head right)
const PRONE_ARMS_BACK = pose([94, 86], [86, 88], [54, 88], [[[70, 90], [60, 90]]], [[[36, 90], [20, 90]]]);
const PRONE_ARMS_FORWARD = pose([94, 86], [86, 88], [54, 88], [[[96, 88], [108, 88]]], [[[36, 90], [20, 90]]]);
const PRONE_ARMS_RAISED = pose([94, 82], [86, 86], [54, 88], [[[98, 80], [110, 76]]], [[[36, 90], [20, 90]]]);
const SUPERMAN = pose([94, 78], [86, 82], [54, 88], [[[98, 76], [110, 70]]], [[[36, 86], [20, 82]]]);
const SNOW_ANGEL_LOW = pose([94, 84], [86, 87], [54, 88], [[[72, 84], [60, 84]]], [[[36, 90], [20, 90]]]);
const SNOW_ANGEL_HIGH = pose([94, 84], [86, 87], [54, 88], [[[98, 84], [110, 82]]], [[[36, 90], [20, 90]]]);

const PUSH_UP: Illustration = { frames: [PUSH_UP_UP, PUSH_UP_DOWN] };
const SQUAT: Illustration = { frames: [STAND, SQUAT_DEEP] };
const LUNGE: Illustration = { frames: [LUNGE_UP, LUNGE_DOWN] };

/** Keyed by Exercise id, and by Warm-up move name. */
export const ILLUSTRATIONS: Record<string, Illustration> = {
  'wall-push-up': { frames: [WALL_UP, WALL_DOWN], prop: { kind: 'wall', x: 100 } },
  'incline-push-up': { frames: [INCLINE_UP, INCLINE_DOWN], prop: { kind: 'chair', x: 80 } },
  'knee-push-up': { frames: [KNEE_PUSH_UP_UP, KNEE_PUSH_UP_DOWN] },
  'push-up': PUSH_UP,
  'wide-push-up': PUSH_UP,
  'diamond-push-up': PUSH_UP,
  'chair-squat': { frames: [STAND, CHAIR_SQUAT_DOWN], prop: { kind: 'chair', x: 24 } },
  squat: SQUAT,
  'pause-squat': SQUAT,
  'split-squat': LUNGE,
  'jump-squat': { frames: [SQUAT_DEEP, JUMP] },
  'glute-bridge': { frames: [BRIDGE_DOWN, BRIDGE_UP] },
  'single-leg-glute-bridge': { frames: [SINGLE_BRIDGE_DOWN, SINGLE_BRIDGE_UP] },
  'single-leg-bridge-hold': { frames: [SINGLE_BRIDGE_DOWN, SINGLE_BRIDGE_UP] },
  'reverse-lunge': LUNGE,
  'forward-lunge': LUNGE,
  'alternating-lunge': LUNGE,
  'knee-plank': { frames: [ALL_FOURS, KNEE_PLANK] },
  plank: { frames: [ALL_FOURS, FOREARM_PLANK] },
  'plank-shoulder-taps': { frames: [PUSH_UP_UP, SHOULDER_TAP] },
  'dead-bug': { frames: [DEAD_BUG_START, DEAD_BUG_REACH] },
  'bicycle-crunch': { frames: [BICYCLE_LEFT, BICYCLE_RIGHT] },
  'hollow-hold': { frames: [LYING_FLAT, HOLLOW] },
  'prone-ytw': { frames: [PRONE_ARMS_BACK, PRONE_ARMS_RAISED] },
  'superman-hold': { frames: [PRONE_ARMS_FORWARD, SUPERMAN] },
  'reverse-snow-angel': { frames: [SNOW_ANGEL_LOW, SNOW_ANGEL_HIGH] },
  'Arm circles': { frames: [ARMS_FORWARD, ARMS_UP] },
  'Hip circles': { frames: [HIPS_LEFT, HIPS_RIGHT] },
  'Torso twists': { frames: [TWIST_LEFT, TWIST_RIGHT] },
  'Easy squats': { frames: [STAND, SQUAT_HALF] },
};
