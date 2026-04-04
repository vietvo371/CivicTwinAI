/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useCallback } from 'react';
import { StatusBar, useColorScheme, Platform } from 'react-native';
import { NavigationContainer, Theme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import MainNavigator from './src/navigation/MainTabNavigator';
import { AuthProvider } from './src/contexts/AuthContext';
import { WebSocketProvider } from './src/contexts/WebSocketContext';
import { NotificationBanner } from './src/components/NotificationBanner';
import { theme } from './src/theme/colors';
import './src/i18n'; // Initialize i18n
import { navigationRef } from './src/navigation/NavigationService';
import { AlertProvider } from './src/services/AlertService';
import AlertServiceConnector from './src/component/AlertServiceConnector';
import NotificationService from './src/components/NotificationService';
import { ErrorModalProvider } from './src/utils/ErrorModalManager';
import { notifyFcmForeground } from './src/realtime/fcmForegroundBridge';

const App = () => {
  const isDarkMode = useColorScheme() === 'dark';

  const handleNotification = useCallback((remoteMessage: any) => {
    notifyFcmForeground(remoteMessage);
  }, []);

  const handleNotificationOpened = useCallback((notification: any) => {
    console.log('Người dùng mở thông báo:', notification);
  }, []);

  const navigationTheme: Theme = {
    dark: isDarkMode,
    colors: {
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.white,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.error,
    },
    fonts: {
      regular: {
        fontFamily: Platform.select({
          ios: 'SF Pro Display',
          android: 'Roboto',
        }) as string,
        fontWeight: '400',
      },
      medium: {
        fontFamily: Platform.select({
          ios: 'SF Pro Display',
          android: 'Roboto',
        }) as string,
        fontWeight: '500',
      },
      bold: {
        fontFamily: Platform.select({
          ios: 'SF Pro Display',
          android: 'Roboto',
        }) as string,
        fontWeight: '700',
      },
      heavy: {
        fontFamily: Platform.select({
          ios: 'SF Pro Display',
          android: 'Roboto',
        }) as string,
        fontWeight: '900',
      },
    },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorModalProvider>
          <AlertProvider>
            <AlertServiceConnector />
            <NotificationService
              onNotification={handleNotification}
              onNotificationOpened={handleNotificationOpened}
            />
            <AuthProvider>
              <WebSocketProvider>
                <StatusBar
                  barStyle={isDarkMode ? 'light-content' : 'dark-content'}
                  backgroundColor={theme.colors.background}
                />
                <NavigationContainer theme={navigationTheme} ref={navigationRef}>
                  <MainNavigator />
                </NavigationContainer>
                {/* NotificationBanner phải nằm BÊN TRONG WebSocketProvider để nhận context */}
                <NotificationBanner />
              </WebSocketProvider>
            </AuthProvider>
          </AlertProvider>
        </ErrorModalProvider>
      </SafeAreaProvider>
      <Toast />
    </GestureHandlerRootView>
  );
};

export default App;
