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
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Colors, MOVEMENT_CATEGORIES, SKILL_LEVELS } from '@/lib/constants';
import { useOnboardingStore } from '@/store/onboarding';
import { saveMovementSkills } from '@/lib/supabase';
import { haptics } from '@/lib/haptics';

type SkillRating = 1 | 2 | 3 | 4 | 5;

export default function SkillsScreen() {
  const { skills: storedSkills, setSkills: saveSkillsToStore } = useOnboardingStore();
  const [skills, setSkills] = useState<Record<string, number>>(storedSkills);
  const [expandedCategory, setExpandedCategory] = useState<string | null>('gymnastics');
  const [isSaving, setIsSaving] = useState(false);

  const updateSkill = (movement: string, rating: SkillRating) => {
    haptics.selection();
    setSkills((prev) => ({ ...prev, [movement]: rating }));
  };

  const handleSaveAndContinue = async () => {
    setIsSaving(true);
    saveSkillsToStore(skills);

    const skillsData = Object.entries(skills).map(([movementName, skillLevel]) => {
      let category: string | undefined;
      for (const [catKey, catValue] of Object.entries(MOVEMENT_CATEGORIES)) {
        if ((catValue.movements as readonly string[]).includes(movementName)) {
          category = catKey;
          break;
        }
      }
      return { movementName, skillLevel, category };
    });

    const { error } = await saveMovementSkills(skillsData);
    setIsSaving(false);

    if (error) {
      Alert.alert('Save Failed', error.message);
    } else {
      router.push('/onboarding/strength');
    }
  };

  const categories = Object.entries(MOVEMENT_CATEGORIES);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: '50%' }]} />
      </View>

      <Text style={styles.title}>Rate your movement skills</Text>
      <Text style={styles.subtitle}>
        Tap a movement to rate your proficiency. This helps us suggest appropriate scaling.
      </Text>

      <View style={styles.legend}>
        {Object.entries(SKILL_LEVELS).map(([level, info]) => (
          <View key={level} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: getSkillColor(Number(level) as SkillRating) }]} />
            <Text style={styles.legendText}>{info.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.categories}>
        {categories.map(([key, category]) => (
          <View key={key} style={styles.category}>
            <TouchableOpacity
              style={styles.categoryHeader}
              onPress={() => setExpandedCategory(expandedCategory === key ? null : key)}
            >
              <Text style={styles.categoryTitle}>{category.label}</Text>
              <FontAwesome
                name={expandedCategory === key ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={Colors.textMuted}
              />
            </TouchableOpacity>

            {expandedCategory === key && (
              <View style={styles.movements}>
                {category.movements.map((movement) => (
                  <View key={movement} style={styles.movement}>
                    <Text style={styles.movementName}>{movement}</Text>
                    <View style={styles.ratingButtons}>
                      {([1, 2, 3, 4, 5] as SkillRating[]).map((rating) => (
                        <TouchableOpacity
                          key={rating}
                          style={[
                            styles.ratingButton,
                            skills[movement] === rating && styles.ratingButtonSelected,
                            skills[movement] === rating && { backgroundColor: getSkillColor(rating) },
                          ]}
                          onPress={() => updateSkill(movement, rating)}
                        >
                          <Text
                            style={[
                              styles.ratingButtonText,
                              skills[movement] === rating && styles.ratingButtonTextSelected,
                            ]}
                          >
                            {rating}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerNote}>
          You can update these anytime in your profile settings
        </Text>
        <TouchableOpacity
          style={[styles.continueButton, isSaving && styles.buttonDisabled]}
          onPress={handleSaveAndContinue}
          disabled={isSaving}
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

function getSkillColor(rating: SkillRating): string {
  const colors = {
    1: Colors.error,
    2: Colors.primaryDark,
    3: Colors.warning,
    4: Colors.successDark,
    5: Colors.success,
  };
  return colors[rating];
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
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
    padding: 12,
    backgroundColor: Colors.surface,
    borderRadius: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  categories: {
    gap: 12,
    marginBottom: 24,
  },
  category: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  categoryTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
  },
  movements: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: 12,
    gap: 12,
  },
  movement: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  movementName: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  ratingButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  ratingButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ratingButtonSelected: {
    borderColor: 'transparent',
  },
  ratingButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textMuted,
  },
  ratingButtonTextSelected: {
    color: Colors.text,
    fontWeight: '600',
  },
  footer: {
    marginTop: 8,
    gap: 12,
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
