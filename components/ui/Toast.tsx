import React, { useEffect, useRef, useCallback } from 'react';
import { Animated, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Colors } from '@/lib/constants';
import { Typography, Spacing, BorderRadius } from '@/lib/design';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

const TOAST_ICONS: Record<ToastType, string> = {
  success: 'check-circle',
  error: 'exclamation-circle',
  info: 'info-circle',
  warning: 'exclamation-triangle',
};

const TOAST_COLORS: Record<ToastType, string> = {
  success: Colors.success,
  error: Colors.error,
  info: Colors.secondary,
  warning: Colors.warning,
};

// --- Global toast state ---
type ToastListener = (toasts: ToastMessage[]) => void;
let _toasts: ToastMessage[] = [];
let _listeners: ToastListener[] = [];

function notify() {
  _listeners.forEach((fn) => fn([..._toasts]));
}

export const toast = {
  success(title: string, message?: string) {
    this._show('success', title, message);
  },
  error(title: string, message?: string) {
    this._show('error', title, message);
  },
  info(title: string, message?: string) {
    this._show('info', title, message);
  },
  warning(title: string, message?: string) {
    this._show('warning', title, message);
  },
  _show(type: ToastType, title: string, message?: string, duration: number = 3000) {
    const id = Date.now().toString();
    _toasts = [..._toasts, { id, type, title, message, duration }];
    notify();
    setTimeout(() => {
      _toasts = _toasts.filter((t) => t.id !== id);
      notify();
    }, duration);
  },
};

// --- Single Toast Item ---
function ToastItem({ item, onDismiss }: { item: ToastMessage; onDismiss: () => void }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [opacity, translateY]);

  return (
    <Animated.View style={[styles.toast, { opacity, transform: [{ translateY }] }]}>
      <View style={[styles.toastAccent, { backgroundColor: TOAST_COLORS[item.type] }]} />
      <FontAwesome
        name={TOAST_ICONS[item.type] as any}
        size={20}
        color={TOAST_COLORS[item.type]}
        style={styles.toastIcon}
      />
      <View style={styles.toastContent}>
        <Text style={styles.toastTitle}>{item.title}</Text>
        {item.message ? <Text style={styles.toastMessage}>{item.message}</Text> : null}
      </View>
      <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <FontAwesome name="times" size={14} color={Colors.textMuted} />
      </TouchableOpacity>
    </Animated.View>
  );
}

// --- Toast Container (mount once in root layout) ---
export function ToastContainer() {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  useEffect(() => {
    _listeners.push(setToasts);
    return () => {
      _listeners = _listeners.filter((fn) => fn !== setToasts);
    };
  }, []);

  const dismiss = useCallback((id: string) => {
    _toasts = _toasts.filter((t) => t.id !== id);
    notify();
  }, []);

  if (toasts.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {toasts.map((item) => (
        <ToastItem key={item.id} item={item} onDismiss={() => dismiss(item.id)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: Spacing.lg,
    right: Spacing.lg,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  toastAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: BorderRadius.md,
    borderBottomLeftRadius: BorderRadius.md,
  },
  toastIcon: {
    marginRight: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  toastContent: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  toastTitle: {
    ...Typography.bodySmall,
    color: Colors.text,
    fontWeight: '600',
  },
  toastMessage: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
