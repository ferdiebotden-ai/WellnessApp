import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useMonetization } from '../providers/MonetizationProvider';
import type { PaywallTrigger } from '../types/monetization';
import { palette } from '../theme/palette';
import { typography } from '../theme/typography';

interface PaywallModalProps {
  onSubscribe?: () => Promise<void>;
}

const HEADLINES: Record<PaywallTrigger, string> = {
  trial_expired: 'Your 14-day Core trial has ended',
  chat_limit: 'Weekly AI chat limit reached',
  pro_module: 'This module requires Core access',
  soft_prompt: 'Keep your gains going with Core',
};

const SUBCOPY: Record<PaywallTrigger, string> = {
  trial_expired: 'Activate the $29/mo Core plan to continue receiving personalized coaching and insights.',
  chat_limit: 'Upgrade to Core for unlimited coaching conversations and extended analytics.',
  pro_module: 'Upgrade to Core to unlock premium protocols and deeper recovery analytics.',
  soft_prompt: 'Convert your progress into lasting change with Core’s daily coaching and accountability.',
};

export const PaywallModal: React.FC<PaywallModalProps> = ({ onSubscribe }) => {
  const { isPaywallVisible, closePaywall, isPaywallDismissible, paywallTrigger } = useMonetization();
  const [isProcessing, setProcessing] = useState(false);

  const headline = useMemo(() => {
    if (!paywallTrigger) {
      return HEADLINES.trial_expired;
    }

    return HEADLINES[paywallTrigger] ?? HEADLINES.trial_expired;
  }, [paywallTrigger]);

  const description = useMemo(() => {
    if (!paywallTrigger) {
      return SUBCOPY.trial_expired;
    }

    return SUBCOPY[paywallTrigger] ?? SUBCOPY.trial_expired;
  }, [paywallTrigger]);

  if (!isPaywallVisible) {
    return null;
  }

  const handleSubscribe = () => {
    if (!onSubscribe || isProcessing) {
      return;
    }

    setProcessing(true);
    onSubscribe()
      .catch((error) => {
        console.error('Subscription flow failed', error);
      })
      .finally(() => {
        setProcessing(false);
      });
  };

  return (
    <Modal animationType="slide" transparent visible>
      <View style={styles.overlay}>
        <View style={styles.sheet} testID="paywall-modal" accessibilityViewIsModal>
          {isPaywallDismissible ? (
            <TouchableOpacity
              accessibilityRole="button"
              onPress={closePaywall}
              style={styles.closeButton}
              testID="close-paywall"
            >
              <Text style={styles.closeButtonLabel}>Close</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.closeButtonPlaceholder} />
          )}
          <Text style={styles.badge}>Core Plan</Text>
          <Text style={styles.headline}>{headline}</Text>
          <Text style={styles.subcopy}>{description}</Text>

          <View style={styles.priceCard}>
            <Text style={styles.priceHeadline}>$29</Text>
            <Text style={styles.priceFrequency}>per month</Text>
            <Text style={styles.priceHelper}>14-day trial completed • Cancel anytime</Text>
          </View>

          <View style={styles.featureList}>
            <Text style={styles.featureItem}>• Unlimited AI coach conversations</Text>
            <Text style={styles.featureItem}>• Advanced health insights & recovery trends</Text>
            <Text style={styles.featureItem}>• Priority access to Core modules & protocols</Text>
          </View>

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={{ busy: isProcessing, disabled: isProcessing }}
            disabled={isProcessing}
            onPress={handleSubscribe}
            style={[styles.primaryButton, isProcessing && styles.primaryButtonDisabled]}
            testID="subscribe-core"
          >
            {isProcessing ? (
              <ActivityIndicator color={palette.surface} testID="subscribe-loading" />
            ) : (
              <Text style={styles.primaryButtonText}>Upgrade to Core for $29/mo</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: palette.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 16,
  },
  closeButton: {
    alignSelf: 'flex-end',
  },
  closeButtonPlaceholder: {
    height: 20,
  },
  closeButtonLabel: {
    ...typography.caption,
    color: palette.textSecondary,
  },
  badge: {
    alignSelf: 'flex-start',
    ...typography.caption,
    textTransform: 'uppercase',
    color: palette.primary,
    letterSpacing: 1,
  },
  headline: {
    ...typography.heading,
    color: palette.textPrimary,
  },
  subcopy: {
    ...typography.body,
    color: palette.textSecondary,
  },
  priceCard: {
    borderRadius: 20,
    backgroundColor: palette.elevated,
    padding: 20,
    gap: 8,
  },
  priceHeadline: {
    ...typography.heading,
    fontSize: 32,
    color: palette.textPrimary,
  },
  priceFrequency: {
    ...typography.subheading,
    color: palette.textSecondary,
  },
  priceHelper: {
    ...typography.caption,
    color: palette.textMuted,
  },
  featureList: {
    gap: 8,
  },
  featureItem: {
    ...typography.body,
    color: palette.textPrimary,
  },
  primaryButton: {
    backgroundColor: palette.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    ...typography.subheading,
    color: palette.surface,
  },
});
