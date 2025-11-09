import React, { useState } from 'react';
import { StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Surface, useTheme, ActivityIndicator } from 'react-native-paper';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase'; 

export default function AuthScreen() {
  const theme = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');

    if (!email || !password) {
      alert('Please enter your email and password.');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.replace('/(tabs)');
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        router.replace('/onboarding');
      }
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
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
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />

        {!isLogin && (
          <TextInput
            label="Confirm Password"
            mode="outlined"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            style={styles.input}
          />
        )}

        {error ? (
          <Text style={{ color: 'red', textAlign: 'center', marginBottom: 10 }}>
            {error}
          </Text>
        ) : null}

        {loading ? (
          <ActivityIndicator animating={true} />
        ) : (
          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.button}
            contentStyle={{ paddingVertical: 8 }}
          >
            {isLogin ? 'Login' : 'Sign Up'}
          </Button>
        )}

        <Button
          mode="text"
          onPress={() => setIsLogin(!isLogin)}
          style={styles.switchButton}
        >
          {isLogin
            ? "Don't have an account? Sign Up"
            : 'Already have an account? Login'}
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
