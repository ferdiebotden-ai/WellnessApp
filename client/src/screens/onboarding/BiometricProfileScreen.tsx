import React, { useCallback, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Localization from 'expo-localization';
import * as Haptics from 'expo-haptics';
import { palette } from '../../theme/palette';
import type { OnboardingStackParamList } from '../../navigation/OnboardingStack';
import type {
  PrimaryGoal,
  BiologicalSex,
  BiometricProfileData,
} from '../../types/onboarding';

type BiometricProfileScreenProps = NativeStackScreenProps<
  OnboardingStackParamList,
  'BiometricProfile'
>;

/** Unit system for height/weight */
type UnitSystem = 'metric' | 'imperial';

const SEX_OPTIONS: { id: BiologicalSex; label: string }[] = [
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
  { id: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const MIN_AGE = 16;
const MAX_AGE = 120;

export const BiometricProfileScreen: React.FC<BiometricProfileScreenProps> = ({
  navigation,
  route,
}) => {
  const { selectedGoals, selectedProtocolIds } = route.params;

  // Auto-detect timezone using expo-localization getCalendars API
  const detectedTimezone = useMemo(() => {
    const calendars = Localization.getCalendars();
    return calendars[0]?.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';
  }, []);

  // Form state
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [biologicalSex, setBiologicalSex] = useState<BiologicalSex | null>(null);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('imperial');
  const [heightFeet, setHeightFeet] = useState('');
  const [heightInches, setHeightInches] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightLbs, setWeightLbs] = useState('');
  const [weightKg, setWeightKg] = useState('');

  // Calculate age from birth date
  const age = useMemo(() => {
    if (!birthDate) return null;
    const today = new Date();
    let years = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      years--;
    }
    return years;
  }, [birthDate]);

  // Validate age
  const ageError = useMemo(() => {
    if (age === null) return null;
    if (age < MIN_AGE) return `You must be at least ${MIN_AGE} years old`;
    if (age > MAX_AGE) return 'Please enter a valid birth date';
    return null;
  }, [age]);

  // Convert height to cm
  const getHeightInCm = useCallback((): number | null => {
    if (unitSystem === 'metric') {
      const cm = parseFloat(heightCm);
      return isNaN(cm) || cm <= 0 ? null : cm;
    } else {
      const feet = parseFloat(heightFeet) || 0;
      const inches = parseFloat(heightInches) || 0;
      const totalInches = feet * 12 + inches;
      if (totalInches <= 0) return null;
      return Math.round(totalInches * 2.54);
    }
  }, [unitSystem, heightCm, heightFeet, heightInches]);

  // Convert weight to kg
  const getWeightInKg = useCallback((): number | null => {
    if (unitSystem === 'metric') {
      const kg = parseFloat(weightKg);
      return isNaN(kg) || kg <= 0 ? null : kg;
    } else {
      const lbs = parseFloat(weightLbs);
      if (isNaN(lbs) || lbs <= 0) return null;
      return Math.round(lbs * 0.453592 * 10) / 10;
    }
  }, [unitSystem, weightKg, weightLbs]);

  // Format birth date for display
  const formattedBirthDate = useMemo(() => {
    if (!birthDate) return 'Select your birthday';
    return birthDate.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }, [birthDate]);

  // Handle date change
  const handleDateChange = useCallback(
    (_event: unknown, selectedDate?: Date) => {
      setShowDatePicker(Platform.OS === 'ios');
      if (selectedDate) {
        setBirthDate(selectedDate);
        void Haptics.selectionAsync();
      }
    },
    []
  );

  // Handle sex selection
  const handleSexSelect = useCallback((sex: BiologicalSex) => {
    setBiologicalSex(sex);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // Handle unit system toggle
  const handleUnitToggle = useCallback((system: UnitSystem) => {
    setUnitSystem(system);
    void Haptics.selectionAsync();
  }, []);

  // Check if form is valid for continue
  const canContinue = useMemo(() => {
    // All fields are optional, but if age is entered it must be valid
    if (ageError) return false;
    return true;
  }, [ageError]);

  // Handle continue
  const handleContinue = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const biometricData: BiometricProfileData = {
      birthDate,
      biologicalSex,
      heightCm: getHeightInCm(),
      weightKg: getWeightInKg(),
      timezone: detectedTimezone,
    };

    navigation.navigate('WearableConnection', {
      selectedGoals,
      selectedProtocolIds,
      biometrics: biometricData,
    });
  }, [
    navigation,
    selectedGoals,
    selectedProtocolIds,
    birthDate,
    biologicalSex,
    getHeightInCm,
    getWeightInKg,
    detectedTimezone,
  ]);

  // Calculate max date (must be at least MIN_AGE years old)
  const maxDate = useMemo(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - MIN_AGE);
    return date;
  }, []);

  // Calculate min date (reasonable minimum)
  const minDate = useMemo(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - MAX_AGE);
    return date;
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            entering={FadeInDown.duration(600).delay(100)}
            style={styles.header}
          >
            <Text style={styles.question}>A bit about you</Text>
            <Text style={styles.subtitle}>
              This helps us personalize your protocols. All fields are optional.
            </Text>
          </Animated.View>

          {/* Birthday Section */}
          <Animated.View
            entering={FadeInDown.duration(500).delay(200)}
            style={styles.section}
          >
            <Text style={styles.sectionLabel}>BIRTHDAY</Text>
            <Pressable
              style={[styles.dateButton, ageError && styles.dateButtonError]}
              onPress={() => {
                setShowDatePicker(true);
                void Haptics.selectionAsync();
              }}
            >
              <Text
                style={[
                  styles.dateButtonText,
                  !birthDate && styles.dateButtonPlaceholder,
                ]}
              >
                {formattedBirthDate}
              </Text>
              {age !== null && !ageError && (
                <Text style={styles.ageLabel}>{age} years old</Text>
              )}
            </Pressable>
            {ageError && <Text style={styles.errorText}>{ageError}</Text>}
            {showDatePicker && (
              <DateTimePicker
                value={birthDate || maxDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                maximumDate={maxDate}
                minimumDate={minDate}
                themeVariant="dark"
              />
            )}
          </Animated.View>

          {/* Biological Sex Section */}
          <Animated.View
            entering={FadeInDown.duration(500).delay(300)}
            style={styles.section}
          >
            <Text style={styles.sectionLabel}>BIOLOGICAL SEX</Text>
            <Text style={styles.sectionHint}>
              Used for HRV baseline calibration
            </Text>
            <View style={styles.sexOptions}>
              {SEX_OPTIONS.map((option) => (
                <Pressable
                  key={option.id}
                  style={[
                    styles.sexOption,
                    biologicalSex === option.id && styles.sexOptionSelected,
                  ]}
                  onPress={() => handleSexSelect(option.id)}
                >
                  <Text
                    style={[
                      styles.sexOptionText,
                      biologicalSex === option.id && styles.sexOptionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* Unit System Toggle */}
          <Animated.View
            entering={FadeInDown.duration(500).delay(400)}
            style={styles.section}
          >
            <View style={styles.unitToggleContainer}>
              <Pressable
                style={[
                  styles.unitToggle,
                  unitSystem === 'imperial' && styles.unitToggleActive,
                ]}
                onPress={() => handleUnitToggle('imperial')}
              >
                <Text
                  style={[
                    styles.unitToggleText,
                    unitSystem === 'imperial' && styles.unitToggleTextActive,
                  ]}
                >
                  Imperial
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.unitToggle,
                  unitSystem === 'metric' && styles.unitToggleActive,
                ]}
                onPress={() => handleUnitToggle('metric')}
              >
                <Text
                  style={[
                    styles.unitToggleText,
                    unitSystem === 'metric' && styles.unitToggleTextActive,
                  ]}
                >
                  Metric
                </Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* Height Section */}
          <Animated.View
            entering={FadeInDown.duration(500).delay(500)}
            style={styles.section}
          >
            <Text style={styles.sectionLabel}>HEIGHT</Text>
            {unitSystem === 'imperial' ? (
              <View style={styles.heightRow}>
                <View style={styles.heightInputContainer}>
                  <TextInput
                    style={styles.input}
                    value={heightFeet}
                    onChangeText={setHeightFeet}
                    placeholder="5"
                    placeholderTextColor={palette.textMuted}
                    keyboardType="numeric"
                    maxLength={1}
                  />
                  <Text style={styles.unitLabel}>ft</Text>
                </View>
                <View style={styles.heightInputContainer}>
                  <TextInput
                    style={styles.input}
                    value={heightInches}
                    onChangeText={setHeightInches}
                    placeholder="10"
                    placeholderTextColor={palette.textMuted}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                  <Text style={styles.unitLabel}>in</Text>
                </View>
              </View>
            ) : (
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, styles.inputFull]}
                  value={heightCm}
                  onChangeText={setHeightCm}
                  placeholder="175"
                  placeholderTextColor={palette.textMuted}
                  keyboardType="numeric"
                  maxLength={3}
                />
                <Text style={styles.unitLabel}>cm</Text>
              </View>
            )}
          </Animated.View>

          {/* Weight Section */}
          <Animated.View
            entering={FadeInDown.duration(500).delay(600)}
            style={styles.section}
          >
            <Text style={styles.sectionLabel}>WEIGHT</Text>
            <Text style={styles.sectionHint}>
              Used for protocol dosing. We can track changes over time.
            </Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, styles.inputFull]}
                value={unitSystem === 'imperial' ? weightLbs : weightKg}
                onChangeText={unitSystem === 'imperial' ? setWeightLbs : setWeightKg}
                placeholder={unitSystem === 'imperial' ? '165' : '75'}
                placeholderTextColor={palette.textMuted}
                keyboardType="numeric"
                maxLength={3}
              />
              <Text style={styles.unitLabel}>
                {unitSystem === 'imperial' ? 'lbs' : 'kg'}
              </Text>
            </View>
          </Animated.View>

          {/* Timezone (auto-detected) */}
          <Animated.View
            entering={FadeInDown.duration(500).delay(700)}
            style={styles.section}
          >
            <Text style={styles.sectionLabel}>TIMEZONE</Text>
            <View style={styles.timezoneDisplay}>
              <Text style={styles.timezoneText}>{detectedTimezone}</Text>
              <Text style={styles.timezoneAuto}>Auto-detected</Text>
            </View>
          </Animated.View>

          {/* Continue Button */}
          <Animated.View
            entering={FadeInDown.duration(500).delay(800)}
            style={styles.buttonContainer}
          >
            <Pressable
              style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]}
              onPress={handleContinue}
              disabled={!canContinue}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </Pressable>
            <Pressable
              style={styles.skipButton}
              onPress={handleContinue}
            >
              <Text style={styles.skipButtonText}>Skip for now</Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  question: {
    fontSize: 32,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: palette.textSecondary,
    lineHeight: 24,
  },
  section: {
    marginBottom: 28,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.textMuted,
    letterSpacing: 1,
    marginBottom: 8,
  },
  sectionHint: {
    fontSize: 14,
    color: palette.textMuted,
    marginBottom: 12,
  },
  // Date Button
  dateButton: {
    backgroundColor: palette.elevated,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateButtonError: {
    borderColor: palette.error,
  },
  dateButtonText: {
    fontSize: 16,
    color: palette.textPrimary,
  },
  dateButtonPlaceholder: {
    color: palette.textMuted,
  },
  ageLabel: {
    fontSize: 14,
    color: palette.textSecondary,
  },
  errorText: {
    fontSize: 14,
    color: palette.error,
    marginTop: 8,
  },
  // Sex Options
  sexOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  sexOption: {
    flex: 1,
    backgroundColor: palette.elevated,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  sexOptionSelected: {
    borderColor: palette.primary,
    backgroundColor: 'rgba(99, 230, 190, 0.08)',
  },
  sexOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: palette.textSecondary,
  },
  sexOptionTextSelected: {
    color: palette.primary,
  },
  // Unit Toggle
  unitToggleContainer: {
    flexDirection: 'row',
    backgroundColor: palette.elevated,
    borderRadius: 12,
    padding: 4,
  },
  unitToggle: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  unitToggleActive: {
    backgroundColor: palette.primary,
  },
  unitToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.textMuted,
  },
  unitToggleTextActive: {
    color: palette.background,
  },
  // Inputs
  heightRow: {
    flexDirection: 'row',
    gap: 16,
  },
  heightInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: palette.elevated,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 18,
    fontWeight: '600',
    color: palette.textPrimary,
    textAlign: 'center',
  },
  inputFull: {
    maxWidth: 120,
  },
  unitLabel: {
    fontSize: 16,
    color: palette.textMuted,
    minWidth: 30,
  },
  // Timezone
  timezoneDisplay: {
    backgroundColor: palette.elevated,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timezoneText: {
    fontSize: 16,
    color: palette.textPrimary,
  },
  timezoneAuto: {
    fontSize: 12,
    color: palette.textMuted,
    fontStyle: 'italic',
  },
  // Buttons
  buttonContainer: {
    marginTop: 16,
    gap: 12,
  },
  continueButton: {
    backgroundColor: palette.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: palette.border,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.background,
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 14,
    color: palette.textMuted,
  },
});
