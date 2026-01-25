import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Colors } from '@/lib/constants';
import { loadWodHistory, getSession } from '@/lib/supabase';
import type { ParsedWorkout, WodStrategy } from '@/lib/types';

interface HistoryEntry {
  id: string;
  parsedWorkout: ParsedWorkout;
  strategy: WodStrategy;
  imageUrl: string | null;
  notes: string | null;
  createdAt: string;
}

export default function HistoryScreen() {
  const [workouts, setWorkouts] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const fetchHistory = async (showRefresh = false) => {
    if (showRefresh) {
      setIsRefreshing(true);
    }

    const { session } = await getSession();
    setIsLoggedIn(!!session);

    if (!session) {
      setWorkouts([]);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    const { history, error } = await loadWodHistory();
    if (!error) {
      setWorkouts(history);
    }
    setIsLoading(false);
    setIsRefreshing(false);
  };

  // Fetch on mount
  useEffect(() => {
    fetchHistory();
  }, []);

  // Refetch when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [])
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  const getMovementsSummary = (workout: ParsedWorkout) => {
    return workout.movements
      .slice(0, 3)
      .map((m) => m.name)
      .join(', ') + (workout.movements.length > 3 ? '...' : '');
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <FontAwesome name="user-circle" size={64} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Sign in to see history</Text>
          <Text style={styles.emptySubtitle}>
            Your workout history will be saved when you're signed in.
          </Text>
          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => fetchHistory(true)}
          tintColor={Colors.primary}
        />
      }
    >
      {workouts.length === 0 ? (
        <View style={styles.emptyState}>
          <FontAwesome name="calendar-o" size={64} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No workouts yet</Text>
          <Text style={styles.emptySubtitle}>
            Your analyzed WODs will appear here. Go analyze your first workout!
          </Text>
        </View>
      ) : (
        <>
          <Text style={styles.sectionTitle}>Recent Workouts</Text>
          {workouts.map((workout) => (
            <TouchableOpacity
              key={workout.id}
              style={styles.workoutCard}
              onPress={() => {
                // Navigate to view the saved strategy
                router.push({
                  pathname: '/wod/strategy',
                  params: {
                    workout: JSON.stringify(workout.parsedWorkout),
                    savedStrategy: JSON.stringify(workout.strategy),
                  },
                });
              }}
            >
              <View style={styles.workoutHeader}>
                <View style={styles.workoutTypeBadge}>
                  <Text style={styles.workoutTypeBadgeText}>
                    {workout.parsedWorkout.workoutType}
                  </Text>
                </View>
                <Text style={styles.workoutDate}>{formatDate(workout.createdAt)}</Text>
              </View>
              <Text style={styles.workoutMovements}>
                {getMovementsSummary(workout.parsedWorkout)}
              </Text>
              {workout.parsedWorkout.timeCap && (
                <View style={styles.workoutMeta}>
                  <FontAwesome name="clock-o" size={12} color={Colors.textMuted} />
                  <Text style={styles.workoutMetaText}>
                    {workout.parsedWorkout.timeCap} min cap
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </>
      )}
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
    flexGrow: 1,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 24,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 24,
  },
  signInButton: {
    marginTop: 24,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  signInButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  workoutCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  workoutTypeBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  workoutTypeBadgeText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  workoutDate: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  workoutMovements: {
    fontSize: 15,
    color: Colors.text,
    marginBottom: 8,
  },
  workoutMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  workoutMetaText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
});
