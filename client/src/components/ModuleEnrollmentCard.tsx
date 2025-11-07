import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import type { ModuleEnrollment } from '../types/dashboard';
import { palette } from '../theme/palette';
import { typography } from '../theme/typography';

interface Props {
  module: ModuleEnrollment;
  locked?: boolean;
  onPress?: () => void;
  testID?: string;
}

const CIRCLE_SIZE = 72;
const STROKE_WIDTH = 8;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export const ModuleEnrollmentCard: React.FC<Props> = ({ module, locked = false, onPress, testID }) => {
  const strokeDashoffset = CIRCUMFERENCE * (1 - module.progressPct);

  const Container = onPress ? TouchableOpacity : View;
  const containerProps = onPress
    ? ({
        onPress,
      } as const)
    : ({} as const);

  return (
    <Container
      style={[styles.card, locked && styles.lockedCard]}
      accessibilityRole={onPress ? 'button' : 'summary'}
      testID={testID}
      {...containerProps}
    >
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
        <View style={styles.titleRow}>
          <Text style={styles.title}>{module.title}</Text>
          {locked ? (
            <View style={styles.lockBadge}>
              <Text style={styles.lockBadgeLabel}>PRO</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.focusArea}>{module.focusArea}</Text>
        <View style={styles.streakPill}>
          <Text style={styles.streakText}>{module.currentStreak} day streak</Text>
        </View>
        {locked ? <Text style={styles.lockedCopy}>Upgrade to Core to unlock this module.</Text> : null}
      </View>
    </Container>
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
  lockedCard: {
    opacity: 0.75,
  },
  progressContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    ...typography.subheading,
    color: palette.textPrimary,
  },
  lockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: palette.secondary,
  },
  lockBadgeLabel: {
    ...typography.caption,
    color: palette.textPrimary,
    letterSpacing: 1,
    textTransform: 'uppercase',
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
  lockedCopy: {
    ...typography.caption,
    color: palette.textSecondary,
  },
});
