import React from 'react';
import Svg, { Path, G } from 'react-native-svg';
import { palette } from '../../src/theme/palette';

interface IconProps {
  size?: number;
  color?: string;
}

/**
 * Sauna Protocol Icon
 *
 * 3 heat wave curves - represents heat exposure therapy.
 * Design: Geometric, minimal, 2px stroke weight.
 */
export function SaunaIcon({
  size = 48,
  color = palette.primary,
}: IconProps): JSX.Element {
  const waveHeight = size * 0.5;
  const waveWidth = size * 0.12;
  const startY = size * 0.75;
  const gap = size * 0.2;

  // Three sinusoidal heat waves
  const createWave = (xOffset: number) => {
    const x = xOffset;
    return `M ${x} ${startY}
            Q ${x + waveWidth} ${startY - waveHeight * 0.35}, ${x} ${startY - waveHeight * 0.5}
            Q ${x - waveWidth} ${startY - waveHeight * 0.65}, ${x} ${startY - waveHeight}`;
  };

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <G stroke={color} strokeWidth={2} strokeLinecap="round" fill="none">
        {/* Left wave */}
        <Path d={createWave(size * 0.3)} />

        {/* Center wave */}
        <Path d={createWave(size * 0.5)} />

        {/* Right wave */}
        <Path d={createWave(size * 0.7)} />
      </G>
    </Svg>
  );
}

export default SaunaIcon;
