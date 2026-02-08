import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Colors, EXPERIENCE_LEVELS } from '@/lib/constants';
import { useOnboardingStore } from '@/store/onboarding';
import { saveProfile } from '@/lib/supabase';
import type { ExperienceLevel } from '@/lib/types';

export default function ExperienceScreen() {
  const { standalone } = useLocalSearchParams<{ standalone?: string }>();
  const isStandalone = standalone === 'true';

  const { experienceLevel, yearsExperience: storedYears, setExperience } = useOnboardingStore();
  const [selectedLevel, setSelectedLevel] = useState<ExperienceLevel | null>(experienceLevel);
  const [yearsExperience, setYearsExperience] = useState<number>(storedYears);
  const [isSaving, setIsSaving] = useState(false);

  const levels = Object.entries(EXPERIENCE_LEVELS) as [ExperienceLevel, typeof EXPERIENCE_LEVELS[ExperienceLevel]][];

  const handleSaveAndContinue = async () => {
    if (!selectedLevel) {
      Alert.alert('Select a level', 'Please select your experience level.');
      return;
    }

    setIsSaving(true);
    setExperience(selectedLevel, yearsExperience);

    const { error } = await saveProfile({
      experienceLevel: selectedLevel,
      yearsExperience,
    });

    setIsSaving(false);

    if (error) {
      Alert.alert('Save Failed', error.message);
    } else {
      router.push('/onboarding/skills');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: '25%' }]} />
      </View>

      <Text style={styles.title}>What's your experience level?</Text>
      <Text style={styles.subtitle}>
        This helps us understand your baseline fitness and recommend appropriate scaling
      </Text>

      <View style={styles.options}>
        {levels.map(([key, value]) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.option,
              selectedLevel === key && styles.optionSelected,
            ]}
            onPress={() => setSelectedLevel(key)}
          >
            <View style={styles.optionContent}>
              <View style={styles.optionHeader}>
                <Text style={[
                  styles.optionTitle,
                  selectedLevel === key && styles.optionTitleSelected,
                ]}>
                  {value.label}
                </Text>
                {selectedLevel === key && (
                  <FontAwesome name="check-circle" size={20} color={Colors.primary} />
                )}
              </View>
              <Text style={styles.optionDescription}>{value.description}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.yearsSection}>
        <Text style={styles.yearsLabel}>Years doing CrossFit</Text>
        <View style={styles.yearsPicker}>
          <TouchableOpacity
            style={styles.yearsButton}
            onPress={() => setYearsExperience(Math.max(0, yearsExperience - 1))}
          >
            <FontAwesome name="minus" size={16} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.yearsValue}>{yearsExperience}</Text>
          <TouchableOpacity
            style={styles.yearsButton}
            onPress={() => setYearsExperience(yearsExperience + 1)}
          >
            <FontAwesome name="plus" size={16} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueButton, (!selectedLevel || isSaving) && styles.continueButtonDisabled]}
          onPress={handleSaveAndContinue}
          disabled={!selectedLevel || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color={Colors.text} />
          ) : (
            <>
              <Text style={styles.continueButtonText}>Save & Continue</Text>
              <FontAwesome name="arrow-right" size={16} color={Colors.text} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.surface,
    borderRadius: 2,
    marginBottom: 32,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 24,
  },
  options: {
    gap: 12,
    marginBottom: 32,
  },
  option: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  optionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surfaceLight,
  },
  optionContent: {},
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
  },
  optionTitleSelected: {
    color: Colors.primary,
  },
  optionDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  yearsSection: {
    marginBottom: 32,
  },
  yearsLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 12,
  },
  yearsPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  yearsButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  yearsValue: {
    fontSize: 32,
    fontWeight: '600',
    color: Colors.text,
    minWidth: 60,
    textAlign: 'center',
  },
  footer: {
    marginTop: 'auto',
    gap: 12,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
  },
  continueButtonDisabled: {
    backgroundColor: Colors.surfaceLight,
    opacity: 0.6,
  },
  continueButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
