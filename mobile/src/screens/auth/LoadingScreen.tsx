import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { theme } from '../../theme/colors';
import { useAuth } from '../../contexts/AuthContext';
import { SPACING } from '../../theme';

interface LoadingScreenProps {
  navigation: any;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ navigation }) => {
  const { user, loading, isAuthenticated, userRole } = useAuth();

  useEffect(() => {
    // Navigate only after AuthContext has finished its initial load
    if (!loading) {
      if (isAuthenticated && user) {
        // Role-based navigation based on the computed role from AuthContext
        if (userRole === 'emergency') {
          navigation.replace('EmergencyTabs');
        } else {
          navigation.replace('CitizenTabs');
        }
      } else {
        // Not authenticated
        navigation.replace('Login');
      }
    }
  }, [loading, isAuthenticated, user, userRole, navigation]);

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <ActivityIndicator
        size="large"
        color={theme.colors.primary}
        style={styles.spinner}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: SPACING.xl,
  },
  spinner: {
    marginTop: SPACING.lg,
  },
});

export default LoadingScreen;