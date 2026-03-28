import 'react-native-gesture-handler';
import React, { useEffect, useMemo, useState } from 'react';
import { registerRootComponent } from 'expo';
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { AppProvider } from './src/context/AppContext';
import CategoryScreen from './src/screens/CategoryScreen';
import ItemSelectionScreen from './src/screens/ItemSelectionScreen';
import ConfirmationScreen from './src/screens/ConfirmationScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { initializeApi } from './src/services/api';
import { initializeSocket } from './src/services/socket';

const Stack = createStackNavigator();

function LoadingScreen() {
  return (
    <View style={styles.centeredScreen}>
      <ActivityIndicator size="large" color="#2563eb" />
      <Text style={styles.loadingText}>Starting NDRF Mobile...</Text>
    </View>
  );
}

function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Category"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#ffffff' },
      }}
    >
      <Stack.Screen name="Category" component={CategoryScreen} />
      <Stack.Screen name="Items" component={ItemSelectionScreen} />
      <Stack.Screen name="Confirmation" component={ConfirmationScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  const [bootState, setBootState] = useState('loading');
  const [bootError, setBootError] = useState('');
  const [bootAttempt, setBootAttempt] = useState(0);

  useEffect(() => {
    let active = true;

    const boot = async () => {
      setBootState('loading');
      setBootError('');

      try {
        try {
          await initializeApi();
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          console.warn('[App] API init warning:', message);
        }

        try {
          await initializeSocket();
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          console.warn('[App] Socket init warning:', message);
        }

        if (active) {
          setBootState('ready');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (active) {
          setBootError(message);
          setBootState('error');
        }
      }
    };

    boot();

    return () => {
      active = false;
    };
  }, [bootAttempt]);

  const navigationTheme = useMemo(
    () => ({
      ...DefaultTheme,
      colors: {
        ...DefaultTheme.colors,
        background: '#ffffff',
      },
    }),
    []
  );

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <AppProvider>
        {bootState === 'loading' && <LoadingScreen />}
        {bootState === 'error' && (
          <View style={styles.centeredScreen}>
            <Text style={styles.errorTitle}>App startup failed</Text>
            <Text style={styles.errorMessage}>{bootError || 'Unable to initialize app services.'}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => setBootAttempt((prev) => prev + 1)}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
        {bootState === 'ready' && (
          <NavigationContainer theme={navigationTheme}>
            <AppNavigator />
          </NavigationContainer>
        )}
        <Toast />
      </AppProvider>
    </SafeAreaProvider>
  );
}

// Keep root registration here as a fallback for App.jsx bundle entry requests.
registerRootComponent(App);

const styles = StyleSheet.create({
  centeredScreen: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#334155',
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#dfcccc',
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
