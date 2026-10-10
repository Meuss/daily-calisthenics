import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Polyline, Text as SvgText } from 'react-native-svg';
import type { LocalDate, WeighIn } from '../domain';
import { CHART_DAYS, chartGeometry } from '../progress/chart';
import { colors } from './theme';

const HEIGHT = 160;

export function WeightChart({ weighIns, today }: { weighIns: WeighIn[]; today: LocalDate }) {
  const [width, setWidth] = useState(0);
  const geometry = width > 0 ? chartGeometry(weighIns, today, CHART_DAYS, width, HEIGHT) : null;

  return (
    <View style={{ height: HEIGHT }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {geometry && (
        <Svg width={width} height={HEIGHT}>
          <Polyline points={geometry.average} stroke={colors.accent} strokeWidth={2.5} fill="none" />
          {geometry.raw.map((p) => <Circle key={p.date} cx={p.x} cy={p.y} r={3} fill={colors.textMuted} />)}
          <SvgText x={2} y={12} fill={colors.textMuted} fontSize={11}>{geometry.maxKg.toFixed(1)}</SvgText>
          <SvgText x={2} y={HEIGHT - 2} fill={colors.textMuted} fontSize={11}>{geometry.minKg.toFixed(1)}</SvgText>
        </Svg>
      )}
    </View>
  );
}
