import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import { Colors } from '@/lib/constants';
import { getCurrentUser, getSession, signOut } from '@/lib/supabase';
import { useSettingsStore } from '@/store/settings';
import { useOnboardingStore } from '@/store/onboarding';

export default function ProfileScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const { weightUnit, toggleWeightUnit } = useSettingsStore();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { session } = await getSession();
    setIsLoggedIn(!!session);
    setUserEmail(session?.user?.email || null);
    setIsLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    useOnboardingStore.getState().reset();
    setIsLoggedIn(false);
    setUserEmail(null);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.authPrompt}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <View style={styles.authPrompt}>
          <FontAwesome name="user-circle" size={80} color={Colors.textMuted} />
          <Text style={styles.authTitle}>Create Your Profile</Text>
          <Text style={styles.authSubtitle}>
            Sign in to save your fitness profile and get personalized WOD strategies
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/(auth)/signup')}
          >
            <Text style={styles.primaryButtonText}>Create Account</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.secondaryButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <FontAwesome name="user" size={40} color={Colors.text} />
        </View>
        <Text style={styles.profileName}>{userEmail?.split('@')[0] || 'Athlete'}</Text>
        <Text style={styles.profileEmail}>{userEmail}</Text>
      </View>

      {/* Setup Profile Button */}
      <TouchableOpacity
        style={styles.setupButton}
        onPress={() => router.push('/onboarding')}
      >
        <FontAwesome name="sliders" size={20} color={Colors.text} />
        <Text style={styles.setupButtonText}>Setup / Edit Fitness Profile</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fitness Profile</Text>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/onboarding/experience')}>
          <View style={styles.menuItemLeft}>
            <FontAwesome name="signal" size={18} color={Colors.primary} />
            <Text style={styles.menuItemText}>Experience Level</Text>
          </View>
          <View style={styles.menuItemRight}>
            <FontAwesome name="chevron-right" size={14} color={Colors.textMuted} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/onboarding/skills')}>
          <View style={styles.menuItemLeft}>
            <FontAwesome name="list-ul" size={18} color={Colors.primary} />
            <Text style={styles.menuItemText}>Movement Skills</Text>
          </View>
          <FontAwesome name="chevron-right" size={14} color={Colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/onboarding/strength')}>
          <View style={styles.menuItemLeft}>
            <FontAwesome name="trophy" size={18} color={Colors.primary} />
            <Text style={styles.menuItemText}>1RM Numbers</Text>
          </View>
          <FontAwesome name="chevron-right" size={14} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subscription</Text>

        <View style={styles.subscriptionCard}>
          <View style={styles.subscriptionHeader}>
            <Text style={styles.subscriptionTier}>Free Tier</Text>
            <View style={styles.usageBadge}>
              <Text style={styles.usageText}>3/5 analyses used</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.upgradeButton}>
            <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>

        <TouchableOpacity style={styles.menuItem} onPress={toggleWeightUnit}>
          <View style={styles.menuItemLeft}>
            <FontAwesome name="balance-scale" size={18} color={Colors.primary} />
            <Text style={styles.menuItemText}>Weight Unit</Text>
          </View>
          <View style={styles.unitToggle}>
            <View style={[styles.unitOption, weightUnit === 'lbs' && styles.unitOptionActive]}>
              <Text style={[styles.unitText, weightUnit === 'lbs' && styles.unitTextActive]}>lbs</Text>
            </View>
            <View style={[styles.unitOption, weightUnit === 'kg' && styles.unitOptionActive]}>
              <Text style={[styles.unitText, weightUnit === 'kg' && styles.unitTextActive]}>kg</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>

        <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleSignOut}>
          <View style={styles.menuItemLeft}>
            <FontAwesome name="sign-out" size={18} color={Colors.error} />
            <Text style={[styles.menuItemText, styles.logoutText]}>Sign Out</Text>
          </View>
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
  },
  authPrompt: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 24,
    marginBottom: 8,
  },
  authSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    marginBottom: 16,
    width: '100%',
  },
  primaryButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    width: '100%',
  },
  secondaryButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 16,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  setupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  setupButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
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
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuItemText: {
    fontSize: 16,
    color: Colors.text,
  },
  menuItemValue: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  logoutItem: {
    marginTop: 8,
  },
  logoutText: {
    color: Colors.error,
  },
  subscriptionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  subscriptionTier: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  usageBadge: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  usageText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  upgradeButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
  },
  upgradeButtonText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 8,
    padding: 2,
  },
  unitOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  unitOptionActive: {
    backgroundColor: Colors.primary,
  },
  unitText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  unitTextActive: {
    color: Colors.text,
  },
});
