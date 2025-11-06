import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import type { ModuleEnrollment } from '../types/dashboard';
import { palette } from '../theme/palette';
import { typography } from '../theme/typography';

interface Props {
  module: ModuleEnrollment;
}

const CIRCLE_SIZE = 72;
const STROKE_WIDTH = 8;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export const ModuleEnrollmentCard: React.FC<Props> = ({ module }) => {
  const strokeDashoffset = CIRCUMFERENCE * (1 - module.progressPct);

  return (
    <View style={styles.card} accessibilityRole="summary">
      <View style={styles.progressContainer}>
        <Svg height={CIRCLE_SIZE} width={CIRCLE_SIZE}>
          <Circle
            cx={CIRCLE_SIZE / 2}
            cy={CIRCLE_SIZE / 2}
            r={RADIUS}
            stroke={palette.elevated}
            strokeWidth={STROKE_WIDTH}
            fill="transparent"
          />
          <Circle
            cx={CIRCLE_SIZE / 2}
            cy={CIRCLE_SIZE / 2}
            r={RADIUS}
            stroke={palette.primary}
            strokeWidth={STROKE_WIDTH}
            fill="transparent"
            strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation={-90}
            origin={`${CIRCLE_SIZE / 2}, ${CIRCLE_SIZE / 2}`}
          />
          <SvgText
            x="50%"
            y="52%"
            fill={palette.textPrimary}
            fontSize="16"
            fontWeight="600"
            textAnchor="middle"
          >
            {`${Math.round(module.progressPct * 100)}%`}
          </SvgText>
        </Svg>
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{module.title}</Text>
        <Text style={styles.focusArea}>{module.focusArea}</Text>
        <View style={styles.streakPill}>
          <Text style={styles.streakText}>{module.currentStreak} day streak</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: 16,
    gap: 20,
  },
  progressContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    gap: 8,
  },
  title: {
    ...typography.subheading,
    color: palette.textPrimary,
  },
  focusArea: {
    ...typography.body,
    color: palette.textSecondary,
  },
  streakPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: palette.elevated,
  },
  streakText: {
    ...typography.caption,
    color: palette.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
