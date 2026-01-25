import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/lib/constants';
import { Typography, Spacing, BorderRadius, Shadows, Gradients } from '@/lib/design';
import {
  GradientButton,
  Card,
  GradientText,
  WeeklyProgressTracker,
  StreakCounter,
} from '@/components/ui';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Mock data - in production this would come from user's history
  const streak = 3;
  const completedDays = [0, 1, 2]; // Mon, Tue, Wed

  const pickImageFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please grant photo library access to select WOD images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please grant camera access to photograph the whiteboard.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const pasteFromClipboard = async () => {
    try {
      const hasImage = await Clipboard.hasImageAsync();
      if (hasImage) {
        const image = await Clipboard.getImageAsync({ format: 'png' });
        if (image?.data) {
          // Check if data already has the prefix (some iOS versions include it)
          const imageUri = image.data.startsWith('data:')
            ? image.data
            : `data:image/png;base64,${image.data}`;
          setSelectedImage(imageUri);
        } else {
          Alert.alert('Paste failed', 'Could not read the image from clipboard. Try copying it again.');
        }
      } else {
        Alert.alert('No image', 'No image found in clipboard. Copy a screenshot first!');
      }
    } catch (error) {
      console.error('Clipboard paste error:', error);
      Alert.alert('Paste failed', 'Something went wrong while pasting. Please try again.');
    }
  };

  const showImageOptions = () => {
    const options = ['Take Photo', 'Choose from Library', 'Paste from Clipboard', 'Cancel'];
    const cancelButtonIndex = 3;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex },
        (buttonIndex) => {
          if (buttonIndex === 0) takePhoto();
          else if (buttonIndex === 1) pickImageFromLibrary();
          else if (buttonIndex === 2) pasteFromClipboard();
        }
      );
    } else {
      Alert.alert('Capture WOD', 'Choose an option', [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Library', onPress: pickImageFromLibrary },
        { text: 'Paste from Clipboard', onPress: pasteFromClipboard },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const analyzeWod = () => {
    if (!selectedImage) {
      Alert.alert('No image', 'Please select or capture a WOD image first.');
      return;
    }
    router.push({
      pathname: '/wod/confirm',
      params: { imageUri: selectedImage },
    });
  };

  const clearImage = () => {
    setSelectedImage(null);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Hero Section with Branding */}
      <View style={styles.heroSection}>
        <LinearGradient
          colors={['rgba(255, 107, 53, 0.08)', 'transparent']}
          style={styles.heroGradient}
        />
        <GradientText style={styles.brandText}>WODwise</GradientText>
        <Text style={styles.greeting}>
          {getGreeting()}! Ready to crush it?
        </Text>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <StreakCounter streak={streak} />
      </View>

      {/* Weekly Progress */}
      <View style={styles.weeklySection}>
        <WeeklyProgressTracker completedDays={completedDays} />
      </View>

      {/* Image Preview / Placeholder */}
      {selectedImage ? (
        <Card variant="elevated" padding="none" style={styles.imageCard}>
          <Image source={{ uri: selectedImage }} style={styles.selectedImage} resizeMode="contain" />
          <TouchableOpacity style={styles.clearButton} onPress={clearImage}>
            <FontAwesome name="times" size={16} color={Colors.text} />
          </TouchableOpacity>
        </Card>
      ) : (
        <TouchableOpacity onPress={showImageOptions} activeOpacity={0.8}>
          <Card variant="gradient-border" padding="large" style={styles.placeholder}>
            <View style={styles.placeholderContent}>
              <View style={styles.placeholderIconContainer}>
                <FontAwesome name="camera" size={32} color={Colors.primary} />
              </View>
              <Text style={styles.placeholderTitle}>Tap to Capture WOD</Text>
              <Text style={styles.placeholderText}>
                Take a photo, choose from library, or paste
              </Text>
            </View>
          </Card>
        </TouchableOpacity>
      )}

      {/* Analyze Button */}
      <GradientButton
        title="Analyze WOD"
        onPress={analyzeWod}
        disabled={!selectedImage}
        icon={<FontAwesome name="magic" size={20} color={Colors.text} />}
        size="large"
        fullWidth
        style={styles.analyzeButton}
      />

      {/* Info Box */}
      <Card style={styles.infoBox}>
        <View style={styles.infoContent}>
          <View style={styles.infoIconContainer}>
            <FontAwesome name="lightbulb-o" size={18} color={Colors.secondary} />
          </View>
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>How it works</Text>
            <Text style={styles.infoText}>
              WODwise extracts your workout and provides personalized strategy based on your fitness profile.
            </Text>
          </View>
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    padding: Spacing.xl,
    paddingBottom: Spacing.huge,
  },

  // Hero Section
  heroSection: {
    alignItems: 'center',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
    position: 'relative',
  },
  heroGradient: {
    position: 'absolute',
    top: -100,
    left: -50,
    right: -50,
    height: 300,
    borderRadius: 150,
  },
  brandText: {
    ...Typography.displayLarge,
    marginBottom: Spacing.sm,
  },
  greeting: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
  },

  // Stats Row
  statsRow: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },

  // Weekly Section
  weeklySection: {
    marginBottom: Spacing.xxl,
  },

  // Image Preview
  imageCard: {
    marginBottom: Spacing.lg,
    overflow: 'hidden',
    borderRadius: BorderRadius.lg,
  },
  selectedImage: {
    width: '100%',
    height: 220,
    borderRadius: BorderRadius.lg,
  },
  clearButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: BorderRadius.full,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Placeholder
  placeholder: {
    marginBottom: Spacing.lg,
  },
  placeholderContent: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  placeholderIconContainer: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    backgroundColor: `${Colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  placeholderTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  placeholderText: {
    ...Typography.body,
    color: Colors.textMuted,
    textAlign: 'center',
    maxWidth: 260,
  },

  // Analyze Button
  analyzeButton: {
    marginBottom: Spacing.xxl,
  },

  // Info Box
  infoBox: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.secondary,
  },
  infoContent: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    backgroundColor: `${Colors.secondary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    ...Typography.bodySmall,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  infoText: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    lineHeight: 18,
  },
});
