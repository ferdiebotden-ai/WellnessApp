import React from 'react';
import { View, ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Path } from 'react-native-svg';
import { palette } from '../../theme/palette';

interface ApexLogoProps {
  /** Size of the logo in pixels (default: 48) */
  size?: number;
  /** Start color for gradient (default: primary teal) */
  startColor?: string;
  /** End color for gradient (default: blue) */
  endColor?: string;
  /** Additional style */
  style?: ViewStyle;
}

/**
 * Apex Logo - Single Gradient Chevron
 *
 * A clean, modern single chevron logo with a teal-to-blue gradient.
 * Replaces the previous double-chevron design.
 */
export function ApexLogo({
  size = 48,
  startColor = palette.primary,
  endColor = '#5B8DEF',
  style,
}: ApexLogoProps): JSX.Element {
  return (
    <View style={style}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient
            id="chevronGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <Stop offset="0%" stopColor={startColor} />
            <Stop offset="100%" stopColor={endColor} />
          </LinearGradient>
        </Defs>
        <Path
          d="M50 12 L92 58 L74 58 L50 32 L26 58 L8 58 Z"
          fill="url(#chevronGradient)"
        />
      </Svg>
    </View>
  );
}

export default ApexLogo;
