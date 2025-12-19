// Simple test component to verify web rendering works
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const WebTestScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>✅ Web Build Working!</Text>
      <Text style={styles.subtitle}>Apex OS is running in the browser</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F1218',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#63E6BE',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#A7B4C7',
  },
});

