import React from 'react';
import { Platform, View } from 'react-native';
import { KeyboardAvoidingView as RNKeyboardAvoidingView, KeyboardAvoidingViewProps } from 'react-native';

/**
 * Web-compatible KeyboardAvoidingView that renders as a regular View on web
 */
export const KeyboardAvoidingView: React.FC<KeyboardAvoidingViewProps> = ({ children, ...props }) => {
  if (Platform.OS === 'web') {
    // On web, KeyboardAvoidingView doesn't work - just render children in a View
    return <View {...props}>{children}</View>;
  }
  return <RNKeyboardAvoidingView {...props}>{children}</RNKeyboardAvoidingView>;
};

