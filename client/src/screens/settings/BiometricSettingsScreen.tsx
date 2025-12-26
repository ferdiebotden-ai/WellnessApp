import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ApexLoadingIndicator, ThinkingDots } from '../../components/ui/ApexLoadingIndicator';
import * as Localization from 'expo-localization';
import * as Haptics from 'expo-haptics';
import { fetchCurrentUser, updateUserBiometrics } from '../../services/api';
import { palette } from '../../theme/palette';
import { typography } from '../../theme/typography';
import type { UserProfile } from '../../types/user';

type BiologicalSex = 'male' | 'female' | 'prefer_not_to_say';
type UnitSystem = 'metric' | 'imperial';

const SEX_OPTIONS: { id: BiologicalSex; label: string }[] = [
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
  { id: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const STEP_GOAL_OPTIONS = [5000, 7500, 10000, 12500, 15000];
const DEFAULT_STEP_GOAL = 10000;

export const BiometricSettingsScreen: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  const [stepGoal, setStepGoal] = useState(DEFAULT_STEP_GOAL);
  const [timezone, setTimezone] = useState('UTC');

  // Detect timezone
  const detectedTimezone = useMemo(() => {
    const calendars = Localization.getCalendars();
    return calendars[0]?.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';
  }, []);

  // Load user profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetchCurrentUser();
        const user = response.user;

        // Populate form from user data
        if (user.birth_date) {
          setBirthDate(new Date(user.birth_date));
        }
        if (user.biological_sex) {
          setBiologicalSex(user.biological_sex);
        }
        if (user.height_cm) {
          setHeightCm(String(user.height_cm));
          // Also populate imperial
          const totalInches = user.height_cm / 2.54;
          setHeightFeet(String(Math.floor(totalInches / 12)));
          setHeightInches(String(Math.round(totalInches % 12)));
        }
        if (user.weight_kg) {
          setWeightKg(String(user.weight_kg));
          // Also populate imperial
          setWeightLbs(String(Math.round(user.weight_kg * 2.205)));
        }
        if (user.step_goal) {
          setStepGoal(user.step_goal);
        }
        setTimezone(user.timezone ?? detectedTimezone);
      } catch (err) {
        console.error('Failed to load user profile:', err);
        setError('Failed to load profile. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadProfile();
  }, [detectedTimezone]);

  // Calculate age from birth date
  const calculateAge = useCallback((date: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
      age--;
    }
    return age;
  }, []);

  // Convert height to metric
  const getHeightCm = useCallback((): number | null => {
    if (unitSystem === 'metric') {
      const cm = parseFloat(heightCm);
      return !isNaN(cm) && cm > 0 ? Math.round(cm) : null;
    }
    const feet = parseFloat(heightFeet) || 0;
    const inches = parseFloat(heightInches) || 0;
    const totalInches = feet * 12 + inches;
    if (totalInches <= 0) return null;
    return Math.round(totalInches * 2.54);
  }, [unitSystem, heightCm, heightFeet, heightInches]);

  // Convert weight to metric
  const getWeightKg = useCallback((): number | null => {
    if (unitSystem === 'metric') {
      const kg = parseFloat(weightKg);
      return !isNaN(kg) && kg > 0 ? Math.round(kg * 100) / 100 : null;
    }
    const lbs = parseFloat(weightLbs);
    if (isNaN(lbs) || lbs <= 0) return null;
    return Math.round((lbs / 2.205) * 100) / 100;
  }, [unitSystem, weightKg, weightLbs]);

  const handleSave = useCallback(async () => {
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsSaving(true);
      setError(null);

      // Build update payload
      const updatePayload: Record<string, unknown> = {};

      if (birthDate) {
        updatePayload.birth_date = birthDate.toISOString().split('T')[0];
      }
      if (biologicalSex) {
        updatePayload.biological_sex = biologicalSex;
      }
      const heightCmValue = getHeightCm();
      if (heightCmValue) {
        updatePayload.height_cm = heightCmValue;
      }
      const weightKgValue = getWeightKg();
      if (weightKgValue) {
        updatePayload.weight_kg = weightKgValue;
        updatePayload.weight_updated_at = new Date().toISOString();
      }
      if (stepGoal) {
        updatePayload.step_goal = stepGoal;
      }
      if (timezone) {
        updatePayload.timezone = timezone;
      }

      await updateUserBiometrics(updatePayload);

      Alert.alert('Success', 'Your biometric profile has been updated.');
    } catch (err) {
      console.error('Failed to save biometrics:', err);
      setError('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [birthDate, biologicalSex, getHeightCm, getWeightKg, stepGoal, timezone]);

  const handleDateChange = useCallback(
    (_event: unknown, selectedDate?: Date) => {
      setShowDatePicker(Platform.OS === 'ios');
      if (selectedDate) {
        void Haptics.selectionAsync();
        setBirthDate(selectedDate);
      }
    },
    []
  );

  const handleSexSelect = useCallback((sex: BiologicalSex) => {
    void Haptics.selectionAsync();
    setBiologicalSex(sex);
  }, []);

  const toggleUnitSystem = useCallback(() => {
    void Haptics.selectionAsync();
    setUnitSystem((prev) => (prev === 'metric' ? 'imperial' : 'metric'));
  }, []);

  const handleStepGoalSelect = useCallback((goal: number) => {
    void Haptics.selectionAsync();
    setStepGoal(goal);
  }, []);

  const formatStepGoal = (goal: number): string => {
    return goal.toLocaleString();
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ApexLoadingIndicator size={48} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        {/* Birthday Section */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.section}>
          <Text style={styles.sectionTitle}>Birthday</Text>
          <Text style={styles.sectionSubtitle}>
            Used for age-based HRV personalization
          </Text>
          <Pressable
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateButtonText}>
              {birthDate
                ? `${birthDate.toLocaleDateString()} (Age: ${calculateAge(birthDate)})`
                : 'Select your birthday'}
            </Text>
          </Pressable>
          {showDatePicker && (
            <DateTimePicker
              value={birthDate || new Date(1990, 0, 1)}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              maximumDate={new Date()}
              minimumDate={new Date(1900, 0, 1)}
              themeVariant="dark"
            />
          )}
        </Animated.View>

        {/* Biological Sex Section */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.section}>
          <Text style={styles.sectionTitle}>Biological Sex</Text>
          <Text style={styles.sectionSubtitle}>
            For HRV baseline calibration
          </Text>
          <View style={styles.radioGroup}>
            {SEX_OPTIONS.map((option) => (
              <Pressable
                key={option.id}
                style={[
                  styles.radioOption,
                  biologicalSex === option.id && styles.radioOptionSelected,
                ]}
                onPress={() => handleSexSelect(option.id)}
              >
                <View
                  style={[
                    styles.radioCircle,
                    biologicalSex === option.id && styles.radioCircleSelected,
                  ]}
                >
                  {biologicalSex === option.id && (
                    <View style={styles.radioCircleInner} />
                  )}
                </View>
                <Text
                  style={[
                    styles.radioLabel,
                    biologicalSex === option.id && styles.radioLabelSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Height/Weight Section */}
        <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.section}>
          <View style={styles.measurementHeader}>
            <View>
              <Text style={styles.sectionTitle}>Height & Weight</Text>
              <Text style={styles.sectionSubtitle}>
                For protocol dosing
              </Text>
            </View>
            <Pressable style={styles.unitToggle} onPress={toggleUnitSystem}>
              <Text
                style={[
                  styles.unitOption,
                  unitSystem === 'imperial' && styles.unitOptionActive,
                ]}
              >
                US
              </Text>
              <Text
                style={[
                  styles.unitOption,
                  unitSystem === 'metric' && styles.unitOptionActive,
                ]}
              >
                Metric
              </Text>
            </Pressable>
          </View>

          {/* Height Input */}
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Height</Text>
            {unitSystem === 'imperial' ? (
              <View style={styles.imperialHeightRow}>
                <View style={styles.inputGroup}>
                  <TextInput
                    style={styles.textInput}
                    value={heightFeet}
                    onChangeText={setHeightFeet}
                    placeholder="5"
                    placeholderTextColor={palette.textMuted}
                    keyboardType="number-pad"
                    maxLength={1}
                  />
                  <Text style={styles.inputUnit}>ft</Text>
                </View>
                <View style={styles.inputGroup}>
                  <TextInput
                    style={styles.textInput}
                    value={heightInches}
                    onChangeText={setHeightInches}
                    placeholder="10"
                    placeholderTextColor={palette.textMuted}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                  <Text style={styles.inputUnit}>in</Text>
                </View>
              </View>
            ) : (
              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.textInput}
                  value={heightCm}
                  onChangeText={setHeightCm}
                  placeholder="178"
                  placeholderTextColor={palette.textMuted}
                  keyboardType="number-pad"
                  maxLength={3}
                />
                <Text style={styles.inputUnit}>cm</Text>
              </View>
            )}
          </View>

          {/* Weight Input */}
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Weight</Text>
            {unitSystem === 'imperial' ? (
              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.textInput}
                  value={weightLbs}
                  onChangeText={setWeightLbs}
                  placeholder="175"
                  placeholderTextColor={palette.textMuted}
                  keyboardType="number-pad"
                  maxLength={3}
                />
                <Text style={styles.inputUnit}>lbs</Text>
              </View>
            ) : (
              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.textInput}
                  value={weightKg}
                  onChangeText={setWeightKg}
                  placeholder="80"
                  placeholderTextColor={palette.textMuted}
                  keyboardType="decimal-pad"
                  maxLength={5}
                />
                <Text style={styles.inputUnit}>kg</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Daily Step Goal Section */}
        <Animated.View entering={FadeInDown.duration(400).delay(350)} style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Step Goal</Text>
          <Text style={styles.sectionSubtitle}>
            For step tracking progress on Health Dashboard
          </Text>
          <View style={styles.stepGoalRow}>
            {STEP_GOAL_OPTIONS.map((goal) => (
              <Pressable
                key={goal}
                style={[
                  styles.stepGoalOption,
                  stepGoal === goal && styles.stepGoalOptionSelected,
                ]}
                onPress={() => handleStepGoalSelect(goal)}
              >
                <Text
                  style={[
                    styles.stepGoalText,
                    stepGoal === goal && styles.stepGoalTextSelected,
                  ]}
                >
                  {formatStepGoal(goal)}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Timezone Section */}
        <Animated.View entering={FadeInDown.duration(400).delay(450)} style={styles.section}>
          <Text style={styles.sectionTitle}>Timezone</Text>
          <Text style={styles.sectionSubtitle}>
            For scheduling nudges at the right time
          </Text>
          <View style={styles.timezoneDisplay}>
            <Text style={styles.timezoneText}>{timezone}</Text>
          </View>
        </Animated.View>

        {/* Save Button */}
        <Animated.View entering={FadeInDown.duration(400).delay(550)}>
          <Pressable
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ThinkingDots color={palette.background} size={6} />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </Pressable>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: palette.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    ...typography.body,
    color: palette.textSecondary,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    paddingBottom: 48,
  },
  errorText: {
    ...typography.body,
    color: palette.error,
    textAlign: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
    borderRadius: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...typography.subheading,
    color: palette.textPrimary,
    marginBottom: 4,
  },
  sectionSubtitle: {
    ...typography.caption,
    color: palette.textSecondary,
    marginBottom: 12,
  },
  dateButton: {
    backgroundColor: palette.surface,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
  },
  dateButtonText: {
    ...typography.body,
    color: palette.textPrimary,
  },
  radioGroup: {
    gap: 8,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
  },
  radioOptionSelected: {
    borderColor: palette.primary,
    backgroundColor: 'rgba(99, 230, 190, 0.08)',
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: palette.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioCircleSelected: {
    borderColor: palette.primary,
  },
  radioCircleInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: palette.primary,
  },
  radioLabel: {
    ...typography.body,
    color: palette.textSecondary,
  },
  radioLabelSelected: {
    color: palette.textPrimary,
    fontWeight: '600',
  },
  measurementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: palette.surface,
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: palette.border,
  },
  unitOption: {
    ...typography.caption,
    paddingHorizontal: 12,
    paddingVertical: 6,
    color: palette.textMuted,
  },
  unitOptionActive: {
    color: palette.primary,
    backgroundColor: 'rgba(99, 230, 190, 0.15)',
    borderRadius: 6,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  inputLabel: {
    ...typography.body,
    color: palette.textSecondary,
    flex: 1,
  },
  imperialHeightRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 12,
  },
  textInput: {
    ...typography.body,
    color: palette.textPrimary,
    paddingVertical: 12,
    minWidth: 50,
    textAlign: 'center',
  },
  inputUnit: {
    ...typography.caption,
    color: palette.textMuted,
    marginLeft: 4,
  },
  timezoneDisplay: {
    backgroundColor: palette.surface,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
  },
  timezoneText: {
    ...typography.body,
    color: palette.textSecondary,
  },
  stepGoalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stepGoalOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  stepGoalOptionSelected: {
    borderColor: palette.primary,
    backgroundColor: 'rgba(99, 230, 190, 0.15)',
  },
  stepGoalText: {
    ...typography.body,
    color: palette.textSecondary,
    fontWeight: '500',
  },
  stepGoalTextSelected: {
    color: palette.primary,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: palette.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    ...typography.subheading,
    color: palette.background,
    fontWeight: '700',
  },
});
