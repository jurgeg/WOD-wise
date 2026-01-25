import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Colors } from '@/lib/constants';
import { signUp } from '@/lib/supabase';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Passwords don\'t match', 'Please make sure your passwords match.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    const { data, error } = await signUp(email, password);
    setIsLoading(false);

    if (error) {
      Alert.alert('Signup failed', error.message);
      return;
    }

    // Navigate to onboarding
    Alert.alert(
      'Account created!',
      'Please check your email to verify your account, then complete your profile setup.',
      [
        {
          text: 'Continue',
          onPress: () => router.replace('/onboarding'),
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <FontAwesome name="bolt" size={48} color={Colors.primary} />
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Join WODwise for personalized workout strategies
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <FontAwesome name="envelope" size={18} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={Colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <View style={styles.inputContainer}>
              <FontAwesome name="lock" size={20} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <FontAwesome
                  name={showPassword ? 'eye-slash' : 'eye'}
                  size={18}
                  color={Colors.textMuted}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <FontAwesome name="lock" size={20} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor={Colors.textMuted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.passwordRequirements}>
              <Text style={styles.requirementText}>Password requirements:</Text>
              <View style={styles.requirement}>
                <FontAwesome
                  name={password.length >= 6 ? 'check-circle' : 'circle-o'}
                  size={14}
                  color={password.length >= 6 ? Colors.success : Colors.textMuted}
                />
                <Text style={[
                  styles.requirementLabel,
                  password.length >= 6 && styles.requirementMet
                ]}>
                  At least 6 characters
                </Text>
              </View>
              <View style={styles.requirement}>
                <FontAwesome
                  name={password === confirmPassword && password.length > 0 ? 'check-circle' : 'circle-o'}
                  size={14}
                  color={password === confirmPassword && password.length > 0 ? Colors.success : Colors.textMuted}
                />
                <Text style={[
                  styles.requirementLabel,
                  password === confirmPassword && password.length > 0 && styles.requirementMet
                ]}>
                  Passwords match
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.signupButton, isLoading && styles.signupButtonDisabled]}
              onPress={handleSignup}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.text} />
              ) : (
                <Text style={styles.signupButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.loginLink}>Sign in</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.termsText}>
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  inputIcon: {
    width: 24,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    fontSize: 16,
    color: Colors.text,
  },
  eyeButton: {
    padding: 8,
  },
  passwordRequirements: {
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  requirementText: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginBottom: 8,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  requirementLabel: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  requirementMet: {
    color: Colors.success,
  },
  signupButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  signupButtonDisabled: {
    opacity: 0.7,
  },
  signupButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  footerText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  loginLink: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  termsText: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
