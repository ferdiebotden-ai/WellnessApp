import React from 'react';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { palette } from '../../src/theme/palette';

interface IconProps {
  size?: number;
  color?: string;
}

/**
 * Sleep Hygiene Protocol Icon
 *
 * Crescent moon with stars - represents sleep optimization.
 * Design: Geometric, minimal, 2px stroke weight.
 */
export function SleepHygieneIcon({
  size = 48,
  color = palette.primary,
}: IconProps): JSX.Element {
  const center = size / 2;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <G stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* Crescent moon - two arcs */}
        <Path
          d={`M ${size * 0.35} ${size * 0.2}
              A ${size * 0.3} ${size * 0.3} 0 1 1 ${size * 0.35} ${size * 0.8}
              A ${size * 0.22} ${size * 0.22} 0 1 0 ${size * 0.35} ${size * 0.2}`}
        />

        {/* Star 1 - top right */}
        <Path d={`M ${size * 0.72} ${size * 0.22} L ${size * 0.72} ${size * 0.32}`} />
        <Path d={`M ${size * 0.67} ${size * 0.27} L ${size * 0.77} ${size * 0.27}`} />

        {/* Star 2 - middle right */}
        <Circle cx={size * 0.8} cy={size * 0.5} r={1.5} fill={color} />

        {/* Star 3 - bottom right */}
        <Path d={`M ${size * 0.68} ${size * 0.7} L ${size * 0.68} ${size * 0.78}`} />
        <Path d={`M ${size * 0.64} ${size * 0.74} L ${size * 0.72} ${size * 0.74}`} />
      </G>
    </Svg>
  );
}

export default SleepHygieneIcon;
