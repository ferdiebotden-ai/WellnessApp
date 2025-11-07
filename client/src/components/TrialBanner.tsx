import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useMonetization } from '../providers/MonetizationProvider';
import { palette } from '../theme/palette';
import { typography } from '../theme/typography';

export const TrialBanner: React.FC = () => {
  const { loading, hasTrial, daysLeftInTrial, isTrialExpired } = useMonetization();

  if (loading || !hasTrial) {
    return null;
  }

  const headline = isTrialExpired
    ? 'Your trial has ended.'
    : `${daysLeftInTrial ?? 0} day${daysLeftInTrial === 1 ? '' : 's'} left in your trial`;

  const helperText = isTrialExpired
    ? 'Upgrade to keep accessing Core coaching and insights.'
    : 'Unlock Core for $29/mo to keep your personalized plan after the trial.';

  return (
    <View style={styles.banner} testID="trial-banner" accessibilityRole="summary">
      <Text style={styles.headline}>{headline}</Text>
      <Text style={styles.helper}>{helperText}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: palette.elevated,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 4,
  },
  headline: {
    ...typography.subheading,
    color: palette.textPrimary,
  },
  helper: {
    ...typography.caption,
    color: palette.textSecondary,
  },
});
