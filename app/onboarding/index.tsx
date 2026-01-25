import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Colors } from '@/lib/constants';

export default function OnboardingWelcome() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <FontAwesome name="bolt" size={64} color={Colors.primary} />
          </View>
          <Text style={styles.title}>Let's Set Up Your Profile</Text>
          <Text style={styles.subtitle}>
            Answer a few questions so WODwise can give you personalized workout strategies
          </Text>
        </View>

        <View style={styles.steps}>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Experience Level</Text>
              <Text style={styles.stepDescription}>How long you've been doing CrossFit</Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Movement Skills</Text>
              <Text style={styles.stepDescription}>Rate your ability in key movements</Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Strength Numbers</Text>
              <Text style={styles.stepDescription}>Your 1RM for major lifts</Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Limitations</Text>
              <Text style={styles.stepDescription}>Any injuries or restrictions</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => router.push('/onboarding/experience')}
          >
            <Text style={styles.startButtonText}>Get Started</Text>
            <FontAwesome name="arrow-right" size={18} color={Colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  steps: {
    paddingVertical: 24,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  stepDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  footer: {
    gap: 12,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 12,
  },
  startButtonText: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipButtonText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
});
