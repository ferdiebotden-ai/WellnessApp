import React from 'react';
import Svg, { Circle, G } from 'react-native-svg';
import { palette } from '../../src/theme/palette';

interface IconProps {
  size?: number;
  color?: string;
}

/**
 * NSDR (Non-Sleep Deep Rest) Protocol Icon
 *
 * Concentric circles - represents breathing/meditation/deep rest.
 * Design: Geometric, minimal, 2px stroke weight.
 */
export function NSDRIcon({
  size = 48,
  color = palette.primary,
}: IconProps): JSX.Element {
  const center = size / 2;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <G stroke={color} strokeWidth={2} fill="none">
        {/* Outer circle */}
        <Circle cx={center} cy={center} r={size * 0.4} />

        {/* Middle circle */}
        <Circle cx={center} cy={center} r={size * 0.27} />

        {/* Inner circle */}
        <Circle cx={center} cy={center} r={size * 0.14} />

        {/* Center dot */}
        <Circle cx={center} cy={center} r={2} fill={color} />
      </G>
    </Svg>
  );
}

export default NSDRIcon;
