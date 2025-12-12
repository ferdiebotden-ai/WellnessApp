import React from 'react';
import Svg, { Circle, Line, G } from 'react-native-svg';
import { palette } from '../../src/theme/palette';

interface IconProps {
  size?: number;
  color?: string;
}

/**
 * Morning Light Protocol Icon
 *
 * Sun with 8 radiating lines - represents light exposure therapy.
 * Design: Geometric, minimal, 2px stroke weight.
 */
export function MorningLightIcon({
  size = 48,
  color = palette.primary,
}: IconProps): JSX.Element {
  const center = size / 2;
  const innerRadius = size * 0.15;
  const rayStart = size * 0.28;
  const rayEnd = size * 0.42;

  // Calculate 8 rays evenly distributed
  const rays = Array.from({ length: 8 }).map((_, i) => {
    const angle = (i * 45 * Math.PI) / 180;
    return {
      x1: center + rayStart * Math.cos(angle),
      y1: center + rayStart * Math.sin(angle),
      x2: center + rayEnd * Math.cos(angle),
      y2: center + rayEnd * Math.sin(angle),
    };
  });

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <G stroke={color} strokeWidth={2} strokeLinecap="round" fill="none">
        {/* Center sun circle */}
        <Circle cx={center} cy={center} r={innerRadius} />

        {/* 8 radiating rays */}
        {rays.map((ray, i) => (
          <Line
            key={i}
            x1={ray.x1}
            y1={ray.y1}
            x2={ray.x2}
            y2={ray.y2}
          />
        ))}
      </G>
    </Svg>
  );
}

export default MorningLightIcon;
