import React from 'react';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { palette } from '../../src/theme/palette';

interface IconProps {
  size?: number;
  color?: string;
}

/**
 * Cold Plunge Protocol Icon
 *
 * Snowflake with water droplet - represents cold exposure therapy.
 * Design: Geometric, minimal, 2px stroke weight.
 */
export function ColdPlungeIcon({
  size = 48,
  color = palette.primary,
}: IconProps): JSX.Element {
  const center = size / 2;
  const armLength = size * 0.35;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <G stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* Vertical arm */}
        <Path d={`M ${center} ${center - armLength} L ${center} ${center + armLength}`} />

        {/* Horizontal arm */}
        <Path d={`M ${center - armLength} ${center} L ${center + armLength} ${center}`} />

        {/* Diagonal arms */}
        <Path d={`M ${center - armLength * 0.7} ${center - armLength * 0.7} L ${center + armLength * 0.7} ${center + armLength * 0.7}`} />
        <Path d={`M ${center + armLength * 0.7} ${center - armLength * 0.7} L ${center - armLength * 0.7} ${center + armLength * 0.7}`} />

        {/* Small branches on vertical arm */}
        <Path d={`M ${center - size * 0.1} ${center - armLength * 0.5} L ${center} ${center - armLength * 0.35} L ${center + size * 0.1} ${center - armLength * 0.5}`} />
        <Path d={`M ${center - size * 0.1} ${center + armLength * 0.5} L ${center} ${center + armLength * 0.35} L ${center + size * 0.1} ${center + armLength * 0.5}`} />

        {/* Small branches on horizontal arm */}
        <Path d={`M ${center - armLength * 0.5} ${center - size * 0.1} L ${center - armLength * 0.35} ${center} L ${center - armLength * 0.5} ${center + size * 0.1}`} />
        <Path d={`M ${center + armLength * 0.5} ${center - size * 0.1} L ${center + armLength * 0.35} ${center} L ${center + armLength * 0.5} ${center + size * 0.1}`} />
      </G>
    </Svg>
  );
}

export default ColdPlungeIcon;
