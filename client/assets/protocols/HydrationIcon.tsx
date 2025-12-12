import React from 'react';
import Svg, { Path, G, Ellipse } from 'react-native-svg';
import { palette } from '../../src/theme/palette';

interface IconProps {
  size?: number;
  color?: string;
}

/**
 * Hydration Protocol Icon
 *
 * Water droplet with ripples - represents hydration tracking.
 * Design: Geometric, minimal, 2px stroke weight.
 */
export function HydrationIcon({
  size = 48,
  color = palette.primary,
}: IconProps): JSX.Element {
  const center = size / 2;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <G stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* Water droplet */}
        <Path
          d={`M ${center} ${size * 0.12}
              Q ${center + size * 0.25} ${size * 0.45}, ${center} ${size * 0.65}
              Q ${center - size * 0.25} ${size * 0.45}, ${center} ${size * 0.12}`}
        />

        {/* First ripple */}
        <Ellipse
          cx={center}
          cy={size * 0.82}
          rx={size * 0.15}
          ry={size * 0.04}
        />

        {/* Second ripple (larger) */}
        <Ellipse
          cx={center}
          cy={size * 0.88}
          rx={size * 0.28}
          ry={size * 0.06}
        />
      </G>
    </Svg>
  );
}

export default HydrationIcon;
