import React from 'react';
import Svg, { Path, G, Circle } from 'react-native-svg';
import { palette } from '../../src/theme/palette';

interface IconProps {
  size?: number;
  color?: string;
}

/**
 * Breathwork Protocol Icon
 *
 * Abstract lungs with airflow - represents breathing exercises.
 * Design: Geometric, minimal, 2px stroke weight.
 */
export function BreathworkIcon({
  size = 48,
  color = palette.primary,
}: IconProps): JSX.Element {
  const center = size / 2;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <G stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* Trachea/windpipe */}
        <Path d={`M ${center} ${size * 0.15} L ${center} ${size * 0.35}`} />

        {/* Bronchi split */}
        <Path d={`M ${center} ${size * 0.35} L ${center - size * 0.12} ${size * 0.45}`} />
        <Path d={`M ${center} ${size * 0.35} L ${center + size * 0.12} ${size * 0.45}`} />

        {/* Left lung outline */}
        <Path
          d={`M ${center - size * 0.12} ${size * 0.45}
              Q ${center - size * 0.32} ${size * 0.5}, ${center - size * 0.32} ${size * 0.65}
              Q ${center - size * 0.32} ${size * 0.85}, ${center - size * 0.08} ${size * 0.85}
              Q ${center - size * 0.02} ${size * 0.75}, ${center - size * 0.08} ${size * 0.55}`}
        />

        {/* Right lung outline */}
        <Path
          d={`M ${center + size * 0.12} ${size * 0.45}
              Q ${center + size * 0.32} ${size * 0.5}, ${center + size * 0.32} ${size * 0.65}
              Q ${center + size * 0.32} ${size * 0.85}, ${center + size * 0.08} ${size * 0.85}
              Q ${center + size * 0.02} ${size * 0.75}, ${center + size * 0.08} ${size * 0.55}`}
        />

        {/* Airflow dots going up */}
        <Circle cx={center} cy={size * 0.08} r={1.5} fill={color} />
      </G>
    </Svg>
  );
}

export default BreathworkIcon;
