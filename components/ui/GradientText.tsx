import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/lib/constants';
import { Gradients } from '@/lib/design';

interface GradientTextProps {
  children: string;
  style?: TextStyle;
  gradient?: 'brand' | 'primary' | 'secondary' | 'accent';
}

export function GradientText({
  children,
  style,
  gradient = 'brand',
}: GradientTextProps) {
  const gradientConfig = Gradients[gradient];

  return (
    <MaskedView
      maskElement={
        <Text style={[styles.text, style]}>{children}</Text>
      }
    >
      <LinearGradient
        colors={[...gradientConfig.colors]}
        start={gradientConfig.start}
        end={gradientConfig.end}
      >
        <Text style={[styles.text, style, styles.hidden]}>{children}</Text>
      </LinearGradient>
    </MaskedView>
  );
}

const styles = StyleSheet.create({
  text: {
    color: Colors.text,
  },
  hidden: {
    opacity: 0,
  },
});
