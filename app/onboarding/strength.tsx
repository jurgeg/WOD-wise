import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Colors, TRACKED_LIFTS } from '@/lib/constants';
import { useOnboardingStore } from '@/store/onboarding';
import { saveStrengthNumbers } from '@/lib/supabase';
import { useSettingsStore, convertWeight } from '@/store/settings';

export default function StrengthScreen() {
  const { lifts: storedLifts, setLifts: saveLiftsToStore } = useOnboardingStore();
  const { weightUnit } = useSettingsStore();
  const [isSaving, setIsSaving] = useState(false);

  // Convert stored numbers (always in lbs) to display unit
  const initialLifts: Record<string, string> = useMemo(() => {
    const converted: Record<string, string> = {};
    Object.entries(storedLifts).forEach(([key, value]) => {
      if (value > 0) {
        const displayValue = convertWeight(value, 'lbs', weightUnit);
        converted[key] = displayValue.toString();
      }
    });
    return converted;
  }, [storedLifts, weightUnit]);
  const [lifts, setLifts] = useState<Record<string, string>>(initialLifts);

  const updateLift = (key: string, value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, '');
    setLifts((prev) => ({ ...prev, [key]: numericValue }));
  };

  // Convert displayed values back to lbs for storage
  const getNumericLiftsInLbs = () => {
    const numericLifts: Record<string, number> = {};
    Object.entries(lifts).forEach(([key, value]) => {
      const num = parseInt(value);
      if (num > 0) {
        // Convert from display unit back to lbs for storage
        numericLifts[key] = convertWeight(num, weightUnit, 'lbs');
      }
    });
    return numericLifts;
  };

  const handleContinue = () => {
    saveLiftsToStore(getNumericLiftsInLbs());
    router.push('/onboarding/limitations');
  };

  const handleSave = async () => {
    setIsSaving(true);
    const numericLifts = getNumericLiftsInLbs();
    saveLiftsToStore(numericLifts);

    const liftsData = Object.entries(numericLifts).map(([liftName, weightLbs]) => ({
      liftName,
      weightLbs,
    }));

    const { error } = await saveStrengthNumbers(liftsData);
    setIsSaving(false);

    if (error) {
      Alert.alert('Save Failed', error.message);
    } else {
      Alert.alert('Saved!', 'Your 1RM numbers have been updated.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }
  };

  const filledCount = Object.values(lifts).filter((v) => v && parseInt(v) > 0).length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: '75%' }]} />
      </View>

      <Text style={styles.title}>What are your 1RM numbers?</Text>
      <Text style={styles.subtitle}>
        Enter your current one-rep max for major lifts. Leave blank if you don't know.
      </Text>

      <View style={styles.infoBox}>
        <FontAwesome name="lightbulb-o" size={16} color={Colors.warning} />
        <Text style={styles.infoText}>
          These help us recommend appropriate weights for WODs. We'll suggest percentages based on these numbers.
        </Text>
      </View>

      <View style={styles.lifts}>
        {TRACKED_LIFTS.map((lift) => (
          <View key={lift.key} style={styles.liftRow}>
            <Text style={styles.liftName}>{lift.name}</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={lifts[lift.key] || ''}
                onChangeText={(value) => updateLift(lift.key, value)}
                placeholder="---"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
                maxLength={4}
              />
              <Text style={styles.inputUnit}>{weightUnit}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerNote}>
          {filledCount} of {TRACKED_LIFTS.length} lifts entered • You can update these anytime
        </Text>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color={Colors.text} />
          ) : (
            <>
              <FontAwesome name="check" size={16} color={Colors.text} />
              <Text style={styles.continueButtonText}>Save</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Continue to Limitations</Text>
          <FontAwesome name="arrow-right" size={16} color={Colors.text} />
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
    marginBottom: 24,
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
    marginBottom: 16,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 10,
    marginBottom: 24,
    borderLeftWidth: 3,
    borderLeftColor: Colors.warning,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  lifts: {
    gap: 12,
    marginBottom: 24,
  },
  liftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 10,
  },
  liftName: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    minWidth: 70,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputUnit: {
    fontSize: 14,
    color: Colors.textMuted,
    width: 28,
  },
  footer: {
    marginTop: 8,
    gap: 12,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.success,
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  footerNote: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
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
  continueButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
