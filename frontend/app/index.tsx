import React, { useState } from 'react';
import { StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Surface, useTheme } from 'react-native-paper';
import { router } from 'expo-router';

export default function AuthScreen() {
  const theme = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = () => {
    if (isLogin) {
      console.log('Logging in with:', email, password);
    } else {
      if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
      }
      console.log('Signing up with:', email, password);
      router.replace({ pathname: '/(tabs)' } as any);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Text variant="headlineMedium" style={styles.title}>
          {isLogin ? 'Welcome Back 👋' : 'Create Account ✨'}
        </Text>

        <TextInput
          label="Email"
          mode="outlined"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          label="Password"
          mode="outlined"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />

        {!isLogin && (
          <TextInput
            label="Confirm Password"
            mode="outlined"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            style={styles.input}
          />
        )}

        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.button}
          contentStyle={{ paddingVertical: 8 }}
        >
          {isLogin ? 'Login' : 'Sign Up'}
        </Button>

        <Button
          mode="text"
          onPress={() => setIsLogin(!isLogin)}
          style={styles.switchButton}
        >
          {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Login'}
        </Button>
      </Surface>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    padding: 24,
    borderRadius: 16,
    elevation: 3,
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    marginBottom: 14,
  },
  button: {
    marginTop: 10,
  },
  switchButton: {
    marginTop: 10,
  },
});
