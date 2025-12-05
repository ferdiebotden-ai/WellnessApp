import { Platform, ViewStyle } from 'react-native';

type ShadowLevel = 'sm' | 'md' | 'lg';

/**
 * Creates platform-specific shadow styles.
 * Uses boxShadow on web to avoid deprecated shadow* prop warnings.
 * Uses native shadow props on iOS/Android for better performance.
 */
export const createShadow = (level: ShadowLevel, color = '#000'): ViewStyle => {
  const shadows = {
    sm: { blur: 4, y: 2, opacity: 0.1 },
    md: { blur: 8, y: 4, opacity: 0.18 },
    lg: { blur: 12, y: 6, opacity: 0.25 },
  };
  const s = shadows[level];

  if (Platform.OS === 'web') {
    // Extract RGB values for rgba() if color is hex
    const hexToRgba = (hex: string, alpha: number): string => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (result) {
        const r = parseInt(result[1], 16);
        const g = parseInt(result[2], 16);
        const b = parseInt(result[3], 16);
        return `rgba(${r},${g},${b},${alpha})`;
      }
      return `rgba(0,0,0,${alpha})`;
    };

    return {
      boxShadow: `0 ${s.y}px ${s.blur}px ${hexToRgba(color, s.opacity)}`,
    } as ViewStyle;
  }

  // Native platforms (iOS/Android)
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: s.y },
    shadowOpacity: s.opacity,
    shadowRadius: s.blur,
    elevation: s.y,
  };
};

/**
 * Creates a dynamic shadow for animated components.
 * Returns a function that can be called with opacity for reanimated styles.
 */
export const createAnimatedShadowStyle = (
  level: ShadowLevel,
  color = '#000',
  opacityMultiplier = 1
): ViewStyle => {
  if (Platform.OS === 'web') {
    return {}; // Web animations handled differently
  }

  const shadows = {
    sm: { blur: 4, y: 2 },
    md: { blur: 8, y: 4 },
    lg: { blur: 12, y: 6 },
  };
  const s = shadows[level];

  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: s.y },
    shadowRadius: s.blur,
    // shadowOpacity will be set dynamically in the animated style
  };
};
