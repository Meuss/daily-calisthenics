import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import {
  CHAIR_SEAT_Y,
  CHAIR_WIDTH,
  GROUND_Y,
  ILLUSTRATIONS,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  type Point,
  type Pose,
  type Prop,
} from '../illustrations/poses';
import { colors, font, space } from './theme';

const points = (list: Point[]) => list.map(([x, y]) => `${x},${y}`).join(' ');
const limb = { stroke: colors.text, strokeWidth: 3.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };

function PropShape({ prop }: { prop: Prop }) {
  if (prop.kind === 'wall') return <Line x1={prop.x} y1={0} x2={prop.x} y2={GROUND_Y} stroke={colors.textMuted} strokeWidth={4} />;
  const { x } = prop;
  return (
    <>
      <Line x1={x} y1={CHAIR_SEAT_Y} x2={x + CHAIR_WIDTH} y2={CHAIR_SEAT_Y} stroke={colors.textMuted} strokeWidth={3} />
      <Line x1={x + 2} y1={CHAIR_SEAT_Y} x2={x + 2} y2={GROUND_Y} stroke={colors.textMuted} strokeWidth={2} />
      <Line x1={x + CHAIR_WIDTH - 2} y1={CHAIR_SEAT_Y} x2={x + CHAIR_WIDTH - 2} y2={GROUND_Y} stroke={colors.textMuted} strokeWidth={2} />
    </>
  );
}

function Figure({ pose }: { pose: Pose }) {
  return (
    <>
      <Polyline points={points([pose.neck, pose.hip])} {...limb} />
      {pose.arms.map(([elbow, hand], i) => (
        <Polyline key={`arm${i}`} points={points([pose.neck, elbow, hand])} {...limb} opacity={i === 0 ? 1 : 0.5} />
      ))}
      {pose.legs.map(([knee, foot], i) => (
        <Polyline key={`leg${i}`} points={points([pose.hip, knee, foot])} {...limb} opacity={i === 0 ? 1 : 0.5} />
      ))}
      <Circle cx={pose.head[0]} cy={pose.head[1]} r={6} stroke={colors.text} strokeWidth={3} fill={colors.surface} />
    </>
  );
}

export function StickFigure({ illustrationKey, size = 150, labels = ['Start', 'End'] }: { illustrationKey: string; size?: number; labels?: [string, string] }) {
  const illustration = ILLUSTRATIONS[illustrationKey];
  if (!illustration) return null;
  const height = (size * VIEW_HEIGHT) / VIEW_WIDTH;

  return (
    <View style={styles.row}>
      {illustration.frames.map((pose, i) => (
        <View key={i} style={styles.frame}>
          <Svg width={size} height={height} viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}>
            <Line x1={0} y1={GROUND_Y} x2={VIEW_WIDTH} y2={GROUND_Y} stroke={colors.border} strokeWidth={2} />
            {illustration.prop && <PropShape prop={illustration.prop} />}
            <Figure pose={pose} />
          </Svg>
          <Text style={styles.label}>{labels[i]}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: space.sm },
  frame: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, padding: space.xs },
  label: { color: colors.textMuted, fontSize: font.small },
});
