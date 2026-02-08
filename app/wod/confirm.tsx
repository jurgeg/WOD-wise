import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Colors } from '@/lib/constants';
import { parseWodImage, isClaudeConfigured } from '@/lib/claude';
import type { ParsedWorkout, WodMovement, WorkoutType } from '@/lib/types';

const WORKOUT_TYPES: WorkoutType[] = ['AMRAP', 'For Time', 'EMOM', 'Chipper', 'Intervals', 'Other'];

export default function ConfirmWodScreen() {
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [parsedWorkout, setParsedWorkout] = useState<ParsedWorkout | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasInjury, setHasInjury] = useState(false);
  const [injuryDescription, setInjuryDescription] = useState('');

  useEffect(() => {
    const parseImage = async () => {
      if (!imageUri) {
        setError('No image provided');
        setIsLoading(false);
        return;
      }

      if (!isClaudeConfigured) {
        setError('Claude API not configured');
        setIsLoading(false);
        return;
      }

      try {
        // Extract base64 data from the image URI
        let base64Data: string;
        let mimeType = 'image/png';

        if (imageUri.startsWith('data:')) {
          // Already base64 (from clipboard)
          const matches = imageUri.match(/^data:(.+);base64,(.+)$/);
          if (matches) {
            mimeType = matches[1];
            base64Data = matches[2];
          } else {
            throw new Error('Invalid data URI');
          }
        } else {
          // File URI - need to fetch and convert
          const response = await fetch(imageUri);
          const blob = await response.blob();

          // Convert blob to base64
          base64Data = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const result = reader.result as string;
              const base64 = result.split(',')[1];
              resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });

          mimeType = blob.type || 'image/jpeg';
        }

        const parsed = await parseWodImage(base64Data, mimeType);
        setParsedWorkout(parsed);
      } catch (err) {
        console.error('Failed to parse WOD:', err);
        setError(err instanceof Error ? err.message : 'Failed to parse workout');
      } finally {
        setIsLoading(false);
      }
    };

    parseImage();
  }, [imageUri]);

  const updateWorkoutType = (type: WorkoutType) => {
    if (parsedWorkout) {
      setParsedWorkout({ ...parsedWorkout, workoutType: type });
    }
  };

  const updateTimeCap = (value: string) => {
    if (parsedWorkout) {
      const numValue = parseInt(value) || undefined;
      setParsedWorkout({ ...parsedWorkout, timeCap: numValue });
    }
  };

  const updateMovement = (index: number, field: keyof WodMovement, value: any) => {
    if (parsedWorkout) {
      const newMovements = [...parsedWorkout.movements];
      newMovements[index] = { ...newMovements[index], [field]: value };
      setParsedWorkout({ ...parsedWorkout, movements: newMovements });
    }
  };

  const addMovement = () => {
    if (parsedWorkout) {
      setParsedWorkout({
        ...parsedWorkout,
        movements: [...parsedWorkout.movements, { name: '', reps: 0 }],
      });
    }
  };

  const removeMovement = (index: number) => {
    if (parsedWorkout && parsedWorkout.movements.length > 1) {
      const newMovements = parsedWorkout.movements.filter((_, i) => i !== index);
      setParsedWorkout({ ...parsedWorkout, movements: newMovements });
    }
  };

  const handleGetStrategy = () => {
    // Navigate to strategy screen with the parsed workout and any injury
    const injury = hasInjury && injuryDescription.trim() ? injuryDescription.trim() : '';
    router.push({
      pathname: '/wod/strategy',
      params: {
        workout: JSON.stringify(parsedWorkout),
        injury,
      },
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingTitle}>Analyzing your WOD...</Text>
        <Text style={styles.loadingSubtitle}>
          Our AI is extracting workout details from your image
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <FontAwesome name="exclamation-circle" size={48} color={Colors.error} />
        <Text style={styles.loadingTitle}>Oops!</Text>
        <Text style={styles.loadingSubtitle}>{error}</Text>
        <TouchableOpacity
          style={[styles.strategyButton, { marginTop: 24 }]}
          onPress={() => router.back()}
        >
          <Text style={styles.strategyButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
      {imageUri && (
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
      )}

      <View style={styles.confidenceBadge}>
        <FontAwesome
          name={parsedWorkout?.confidence === 'high' ? 'check-circle' : 'exclamation-circle'}
          size={14}
          color={parsedWorkout?.confidence === 'high' ? Colors.success : Colors.warning}
        />
        <Text style={styles.confidenceText}>
          {parsedWorkout?.confidence === 'high' ? 'High' : 'Medium'} confidence parse
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Workout Type</Text>
          {!editMode && (
            <TouchableOpacity onPress={() => setEditMode(true)}>
              <FontAwesome name="pencil" size={16} color={Colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {editMode ? (
          <View style={styles.typeSelector}>
            {WORKOUT_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeOption,
                  parsedWorkout?.workoutType === type && styles.typeOptionSelected,
                ]}
                onPress={() => updateWorkoutType(type)}
              >
                <Text
                  style={[
                    styles.typeOptionText,
                    parsedWorkout?.workoutType === type && styles.typeOptionTextSelected,
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.workoutTypeDisplay}>
            <Text style={styles.workoutType}>{parsedWorkout?.workoutType}</Text>
            {parsedWorkout?.timeCap && (
              <Text style={styles.timeCap}>{parsedWorkout.timeCap} minutes</Text>
            )}
          </View>
        )}

        {editMode && (
          <View style={styles.timeCapInput}>
            <Text style={styles.inputLabel}>Time Cap (minutes)</Text>
            <TextInput
              style={styles.input}
              value={parsedWorkout?.timeCap?.toString() || ''}
              onChangeText={updateTimeCap}
              placeholder="e.g., 12"
              placeholderTextColor={Colors.textMuted}
              keyboardType="number-pad"
            />
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Movements</Text>

        {parsedWorkout?.movements.map((movement, index) => (
          <View key={index} style={styles.movementCard}>
            {editMode ? (
              <>
                <View style={styles.movementEditRow}>
                  <TextInput
                    style={[styles.input, styles.movementNameInput]}
                    value={movement.name}
                    onChangeText={(value) => updateMovement(index, 'name', value)}
                    placeholder="Movement name"
                    placeholderTextColor={Colors.textMuted}
                  />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeMovement(index)}
                  >
                    <FontAwesome name="trash" size={16} color={Colors.error} />
                  </TouchableOpacity>
                </View>
                <View style={styles.movementDetailsEdit}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Reps</Text>
                    <TextInput
                      style={styles.smallInput}
                      value={movement.reps.toString()}
                      onChangeText={(value) => updateMovement(index, 'reps', parseInt(value) || 0)}
                      keyboardType="number-pad"
                    />
                  </View>
                  {movement.weightRx && (
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Weight (M/F)</Text>
                      <Text style={styles.weightText}>
                        {movement.weightRx.male}/{movement.weightRx.female} lbs
                      </Text>
                    </View>
                  )}
                </View>
              </>
            ) : (
              <>
                <View style={styles.movementHeader}>
                  <Text style={styles.movementReps}>{movement.reps}</Text>
                  <Text style={styles.movementName}>{movement.name}</Text>
                </View>
                {(movement.weightRx || movement.equipment) && (
                  <Text style={styles.movementDetails}>
                    {movement.weightRx
                      ? `${movement.weightRx.male}/${movement.weightRx.female} lbs`
                      : movement.equipment}
                  </Text>
                )}
              </>
            )}
          </View>
        ))}

        {editMode && (
          <TouchableOpacity style={styles.addMovementButton} onPress={addMovement}>
            <FontAwesome name="plus" size={14} color={Colors.primary} />
            <Text style={styles.addMovementText}>Add Movement</Text>
          </TouchableOpacity>
        )}
      </View>

      {parsedWorkout?.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.notes}>{parsedWorkout.notes}</Text>
        </View>
      )}

      {editMode && (
        <TouchableOpacity
          style={styles.doneEditingButton}
          onPress={() => setEditMode(false)}
        >
          <Text style={styles.doneEditingText}>Done Editing</Text>
        </TouchableOpacity>
      )}

      {/* Injury Toggle Section */}
      <View style={styles.injurySection}>
        <View style={styles.injuryHeader}>
          <View style={styles.injuryLabelContainer}>
            <FontAwesome name="exclamation-triangle" size={16} color={Colors.warning} />
            <Text style={styles.injuryLabel}>Any injuries or limitations today?</Text>
          </View>
          <Switch
            value={hasInjury}
            onValueChange={setHasInjury}
            trackColor={{ false: Colors.surface, true: Colors.warning }}
            thumbColor={Colors.text}
          />
        </View>
        {hasInjury && (
          <TextInput
            style={styles.injuryInput}
            value={injuryDescription}
            onChangeText={setInjuryDescription}
            placeholder="e.g., sore right shoulder, tight lower back"
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={2}
          />
        )}
      </View>

      <TouchableOpacity style={styles.strategyButton} onPress={handleGetStrategy}>
        <FontAwesome name="magic" size={20} color={Colors.text} />
        <Text style={styles.strategyButtonText}>Get My Strategy</Text>
      </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 24,
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  image: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    marginBottom: 16,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 20,
  },
  confidenceText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  workoutTypeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  workoutType: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  timeCap: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '500',
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  typeOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeOptionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeOptionText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  typeOptionTextSelected: {
    color: Colors.text,
    fontWeight: '500',
  },
  timeCapInput: {
    marginTop: 8,
  },
  inputLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  movementCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  movementHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  movementReps: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  movementName: {
    fontSize: 17,
    fontWeight: '500',
    color: Colors.text,
  },
  movementDetails: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  movementEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  movementNameInput: {
    flex: 1,
  },
  removeButton: {
    padding: 8,
  },
  movementDetailsEdit: {
    flexDirection: 'row',
    gap: 16,
  },
  inputGroup: {
    flex: 1,
  },
  smallInput: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  weightText: {
    fontSize: 14,
    color: Colors.text,
    paddingVertical: 10,
  },
  addMovementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  addMovementText: {
    fontSize: 14,
    color: Colors.primary,
  },
  notes: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 8,
  },
  doneEditingButton: {
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  doneEditingText: {
    fontSize: 14,
    color: Colors.secondary,
    fontWeight: '500',
  },
  injurySection: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  injuryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  injuryLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  injuryLabel: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500',
  },
  injuryInput: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    marginTop: 14,
    minHeight: 60,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  strategyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 12,
  },
  strategyButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
});
