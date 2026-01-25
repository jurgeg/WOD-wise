import React, { useState } from 'react';
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
import { Colors, MOVEMENT_CATEGORIES } from '@/lib/constants';
import { useOnboardingStore } from '@/store/onboarding';
import {
  saveProfile,
  saveMovementSkills,
  saveStrengthNumbers,
  saveLimitations,
} from '@/lib/supabase';

interface Limitation {
  id: string;
  type: 'injury' | 'equipment' | 'other';
  description: string;
}

const LIMITATION_TYPES = [
  { key: 'injury', label: 'Injury/Pain', icon: 'medkit' as const },
  { key: 'equipment', label: 'Equipment', icon: 'wrench' as const },
  { key: 'other', label: 'Other', icon: 'info-circle' as const },
];

export default function LimitationsScreen() {
  const {
    experienceLevel,
    yearsExperience,
    skills,
    lifts,
    limitations: storedLimitations,
    setLimitations: saveLimitationsToStore,
    reset,
  } = useOnboardingStore();

  const [limitations, setLimitations] = useState<Limitation[]>(storedLimitations);
  const [isAdding, setIsAdding] = useState(false);
  const [newType, setNewType] = useState<'injury' | 'equipment' | 'other'>('injury');
  const [newDescription, setNewDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const addLimitation = () => {
    if (!newDescription.trim()) {
      Alert.alert('Missing description', 'Please describe the limitation.');
      return;
    }

    setLimitations((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        type: newType,
        description: newDescription.trim(),
      },
    ]);
    setNewDescription('');
    setIsAdding(false);
  };

  const removeLimitation = (id: string) => {
    setLimitations((prev) => prev.filter((l) => l.id !== id));
  };

  const handleFinish = async () => {
    setIsSaving(true);

    try {
      // Save profile
      if (experienceLevel) {
        const { error: profileError } = await saveProfile({
          experienceLevel,
          yearsExperience,
        });
        if (profileError) {
          throw profileError;
        }
      }

      // Save movement skills
      const skillsData = Object.entries(skills).map(([movementName, skillLevel]) => {
        // Find the category for this movement
        let category: string | undefined;
        for (const [catKey, catValue] of Object.entries(MOVEMENT_CATEGORIES)) {
          if (catValue.movements.includes(movementName)) {
            category = catKey;
            break;
          }
        }
        return {
          movementName,
          skillLevel,
          category,
        };
      });

      const { error: skillsError } = await saveMovementSkills(skillsData);
      if (skillsError) {
        throw skillsError;
      }

      // Save strength numbers
      const liftsData = Object.entries(lifts).map(([liftName, weightLbs]) => ({
        liftName,
        weightLbs,
      }));

      const { error: liftsError } = await saveStrengthNumbers(liftsData);
      if (liftsError) {
        throw liftsError;
      }

      // Save limitations
      const limitationsData = limitations.map((lim) => ({
        type: lim.type,
        description: lim.description,
      }));

      const { error: limitationsError } = await saveLimitations(limitationsData);
      if (limitationsError) {
        throw limitationsError;
      }

      // Save limitations to store (in case user goes back)
      saveLimitationsToStore(limitations);

      // Reset the store after successful save
      reset();

      Alert.alert(
        'Profile Complete!',
        'Your fitness profile has been saved. You can now get personalized WOD strategies.',
        [
          {
            text: 'Start Using WODwise',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    } catch (error) {
      console.error('Failed to save profile:', error);
      Alert.alert(
        'Save Failed',
        error instanceof Error ? error.message : 'Failed to save your profile. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const getTypeIcon = (type: string) => {
    const found = LIMITATION_TYPES.find((t) => t.key === type);
    return found?.icon || 'info-circle';
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'injury':
        return Colors.error;
      case 'equipment':
        return Colors.warning;
      default:
        return Colors.secondary;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: '100%' }]} />
      </View>

      <Text style={styles.title}>Any limitations?</Text>
      <Text style={styles.subtitle}>
        Let us know about injuries, equipment restrictions, or other factors that affect your workouts.
      </Text>

      {limitations.length > 0 && (
        <View style={styles.limitationsList}>
          {limitations.map((limitation) => (
            <View key={limitation.id} style={styles.limitationCard}>
              <View style={[styles.typeIndicator, { backgroundColor: getTypeColor(limitation.type) }]}>
                <FontAwesome name={getTypeIcon(limitation.type)} size={14} color={Colors.text} />
              </View>
              <View style={styles.limitationContent}>
                <Text style={styles.limitationType}>
                  {LIMITATION_TYPES.find((t) => t.key === limitation.type)?.label}
                </Text>
                <Text style={styles.limitationDescription}>{limitation.description}</Text>
              </View>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeLimitation(limitation.id)}
              >
                <FontAwesome name="times" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {isAdding ? (
        <View style={styles.addForm}>
          <Text style={styles.addFormLabel}>Type</Text>
          <View style={styles.typeButtons}>
            {LIMITATION_TYPES.map((type) => (
              <TouchableOpacity
                key={type.key}
                style={[
                  styles.typeButton,
                  newType === type.key && styles.typeButtonSelected,
                ]}
                onPress={() => setNewType(type.key as typeof newType)}
              >
                <FontAwesome
                  name={type.icon}
                  size={16}
                  color={newType === type.key ? Colors.text : Colors.textMuted}
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    newType === type.key && styles.typeButtonTextSelected,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.addFormLabel}>Description</Text>
          <TextInput
            style={styles.descriptionInput}
            value={newDescription}
            onChangeText={setNewDescription}
            placeholder="e.g., Bad right shoulder - avoid overhead movements"
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={3}
          />

          <View style={styles.addFormButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setIsAdding(false);
                setNewDescription('');
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addButton} onPress={addLimitation}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.addLimitationButton} onPress={() => setIsAdding(true)}>
          <FontAwesome name="plus" size={16} color={Colors.primary} />
          <Text style={styles.addLimitationText}>Add a limitation</Text>
        </TouchableOpacity>
      )}

      {limitations.length === 0 && !isAdding && (
        <View style={styles.noLimitations}>
          <FontAwesome name="check-circle" size={48} color={Colors.success} />
          <Text style={styles.noLimitationsTitle}>No limitations? Great!</Text>
          <Text style={styles.noLimitationsText}>
            You can always add them later if needed.
          </Text>
        </View>
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.finishButton, isSaving && styles.finishButtonDisabled]}
          onPress={handleFinish}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color={Colors.text} />
          ) : (
            <>
              <Text style={styles.finishButtonText}>Finish Setup</Text>
              <FontAwesome name="check" size={16} color={Colors.text} />
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
    marginBottom: 24,
  },
  limitationsList: {
    gap: 12,
    marginBottom: 16,
  },
  limitationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  typeIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  limitationContent: {
    flex: 1,
  },
  limitationType: {
    fontSize: 12,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  limitationDescription: {
    fontSize: 14,
    color: Colors.text,
  },
  removeButton: {
    padding: 8,
  },
  addLimitationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    marginBottom: 24,
  },
  addLimitationText: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '500',
  },
  addForm: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  addFormLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 8,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeButtonText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  typeButtonTextSelected: {
    color: Colors.text,
    fontWeight: '500',
  },
  descriptionInput: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  addFormButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  addButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  noLimitations: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noLimitationsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 4,
  },
  noLimitationsText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  footer: {
    marginTop: 'auto',
  },
  finishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.success,
    paddingVertical: 16,
    borderRadius: 12,
  },
  finishButtonDisabled: {
    opacity: 0.7,
  },
  finishButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
