import React from 'react';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { palette } from '../../src/theme/palette';

interface IconProps {
  size?: number;
  color?: string;
}

/**
 * Movement Protocol Icon
 *
 * Figure in motion - represents exercise and movement.
 * Design: Geometric stick figure, minimal, 2px stroke weight.
 */
export function MovementIcon({
  size = 48,
  color = palette.primary,
}: IconProps): JSX.Element {
  const scale = size / 48;

  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <G stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* Head */}
        <Circle cx={24} cy={10} r={4} />

        {/* Body/torso - slightly angled for motion */}
        <Path d="M 24 14 L 22 28" />

        {/* Arms - one forward, one back for running pose */}
        <Path d="M 22 18 L 14 14" />
        <Path d="M 22 18 L 30 22" />

        {/* Legs - stride position */}
        <Path d="M 22 28 L 16 40" />
        <Path d="M 22 28 L 32 38" />
      </G>
    </Svg>
  );
}

export default MovementIcon;
