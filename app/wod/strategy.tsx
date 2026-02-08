import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Colors } from '@/lib/constants';
import { generateStrategy as generateStrategyAPI, isClaudeConfigured } from '@/lib/claude';
import { loadUserProfile, saveWodHistory } from '@/lib/supabase';
import type { ParsedWorkout, WodStrategy } from '@/lib/types';

export default function StrategyScreen() {
  const { workout, savedStrategy, injury } = useLocalSearchParams<{
    workout: string;
    savedStrategy?: string;
    injury?: string;
  }>();
  const [isLoading, setIsLoading] = useState(true);
  const [strategy, setStrategy] = useState<WodStrategy | null>(null);
  const [parsedWorkout, setParsedWorkout] = useState<ParsedWorkout | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If we have a saved strategy (from history), use it directly
    if (savedStrategy && workout) {
      try {
        const parsedStrategy = JSON.parse(savedStrategy) as WodStrategy;
        const parsedWod = JSON.parse(workout) as ParsedWorkout;
        setStrategy(parsedStrategy);
        setParsedWorkout(parsedWod);
        setIsLoading(false);
        return;
      } catch (e) {
        console.error('Failed to parse saved strategy:', e);
        // Fall through to generate fresh
      }
    }

    const fetchStrategy = async () => {
      if (!workout) {
        setError('No workout data');
        setIsLoading(false);
        return;
      }

      const parsed = JSON.parse(workout) as ParsedWorkout;
      setParsedWorkout(parsed);

      if (!isClaudeConfigured) {
        setError('Claude API not configured');
        setIsLoading(false);
        return;
      }

      try {
        // Load user profile from Supabase
        const { profile } = await loadUserProfile();

        // Build profile for strategy generation
        const userProfile = {
          experienceLevel: profile?.experienceLevel || 'intermediate',
          skills: profile?.skills || {},
          strengthNumbers: profile?.strengthNumbers || {},
          limitations: injury && injury.trim() ? [`injury: ${injury.trim()}`] : [],
        };

        const strategyResult = await generateStrategyAPI(parsed, userProfile);
        setStrategy(strategyResult);
      } catch (err) {
        console.error('Failed to generate strategy:', err);
        setError(err instanceof Error ? err.message : 'Failed to generate strategy');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStrategy();
  }, [workout, savedStrategy, injury]);

  const handleSave = async () => {
    // Save to Supabase history
    if (parsedWorkout && strategy) {
      const { error } = await saveWodHistory({
        parsedWorkout,
        strategy,
      });
      if (error) {
        console.warn('Failed to save to history:', error);
      }
    }
    router.replace('/(tabs)');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingTitle}>Generating your strategy...</Text>
        <Text style={styles.loadingSubtitle}>
          Analyzing the workout based on your fitness profile
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
          style={[styles.saveButton, { marginTop: 24 }]}
          onPress={() => router.back()}
        >
          <Text style={styles.saveButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Workout Summary */}
      <View style={styles.workoutSummary}>
        <Text style={styles.workoutType}>{parsedWorkout?.workoutType}</Text>
        {parsedWorkout?.timeCap && (
          <Text style={styles.timeCap}>{parsedWorkout.timeCap} min</Text>
        )}
      </View>

      {/* Time Estimate */}
      {strategy?.estimatedTime && (
        <View style={styles.estimateCard}>
          <FontAwesome name="clock-o" size={20} color={Colors.primary} />
          <View style={styles.estimateContent}>
            <Text style={styles.estimateLabel}>Target Rounds</Text>
            <Text style={styles.estimateValue}>
              {strategy.estimatedTime.min}-{strategy.estimatedTime.max} rounds
            </Text>
          </View>
        </View>
      )}

      {/* Scaling Recommendations */}
      {strategy?.scaling && strategy.scaling.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scaling Recommendations</Text>
          {strategy.scaling.map((item, index) => (
            <View key={index} style={styles.scalingCard}>
              <Text style={styles.scalingMovement}>{item.movement}</Text>
              <View style={styles.scalingChange}>
                <Text style={styles.scalingOriginal}>{item.original}</Text>
                <FontAwesome name="arrow-right" size={12} color={Colors.textMuted} />
                <Text style={styles.scalingScaled}>{item.scaled}</Text>
              </View>
              <Text style={styles.scalingReason}>{item.reason}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Pacing Strategy */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pacing Strategy</Text>
        <View style={styles.pacingCard}>
          <FontAwesome name="line-chart" size={18} color={Colors.secondary} />
          <Text style={styles.pacingText}>{strategy?.pacing}</Text>
        </View>
      </View>

      {/* Movement Breakdowns */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Set Breakdowns</Text>
        {strategy?.setBreakdowns.map((item, index) => (
          <View key={index} style={styles.breakdownCard}>
            <Text style={styles.breakdownMovement}>{item.movement}</Text>
            <Text style={styles.breakdownStrategy}>{item.strategy}</Text>
          </View>
        ))}
      </View>

      {/* Tips */}
      {strategy?.tips && strategy.tips.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tips</Text>
          <View style={styles.tipsCard}>
            {strategy.tips.map((tip, index) => (
              <View key={index} style={styles.tipRow}>
                <FontAwesome name="lightbulb-o" size={14} color={Colors.warning} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Cautions */}
      {strategy?.cautions && strategy.cautions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Watch Out For</Text>
          <View style={styles.cautionsCard}>
            {strategy.cautions.map((caution, index) => (
              <View key={index} style={styles.cautionRow}>
                <FontAwesome name="exclamation-triangle" size={14} color={Colors.error} />
                <Text style={styles.cautionText}>{caution}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Substitutions */}
      {strategy?.substitutions && strategy.substitutions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Substitution Options</Text>
          {strategy.substitutions.map((sub, index) => (
            <View key={index} style={styles.substitutionCard}>
              <Text style={styles.substitutionMovement}>
                Can't do {sub.movement}?
              </Text>
              {sub.options.map((option, optIndex) => (
                <TouchableOpacity key={optIndex} style={styles.substitutionOption}>
                  <View style={styles.substitutionOptionHeader}>
                    <FontAwesome name="exchange" size={12} color={Colors.secondary} />
                    <Text style={styles.substitutionName}>{option.name}</Text>
                  </View>
                  <Text style={styles.substitutionReason}>{option.reason}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <FontAwesome name="check" size={18} color={Colors.text} />
          <Text style={styles.saveButtonText}>Done - Go Crush It!</Text>
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
  workoutSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  workoutType: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
  },
  timeCap: {
    fontSize: 18,
    color: Colors.primary,
    fontWeight: '600',
  },
  estimateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  estimateContent: {},
  estimateLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  estimateValue: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  scalingCard: {
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  scalingMovement: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  scalingChange: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  scalingOriginal: {
    fontSize: 14,
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  scalingScaled: {
    fontSize: 15,
    color: Colors.success,
    fontWeight: '600',
    flexShrink: 1,
  },
  scalingReason: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  pacingCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 10,
  },
  pacingText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 21,
  },
  breakdownCard: {
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  breakdownMovement: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 4,
  },
  breakdownStrategy: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  tipsCard: {
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 10,
    gap: 12,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  cautionsCard: {
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: Colors.error,
    gap: 12,
  },
  cautionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  cautionText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  substitutionCard: {
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  substitutionMovement: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  substitutionOption: {
    backgroundColor: Colors.surfaceLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  substitutionOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  substitutionName: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
  },
  substitutionReason: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  actions: {
    marginTop: 8,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.success,
    paddingVertical: 18,
    borderRadius: 12,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
  },
});
