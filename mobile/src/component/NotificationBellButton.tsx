import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { theme, COLORS } from '../theme';
import { useNotifications } from '../hooks/useNotifications';

interface Props {
  style?: StyleProp<ViewStyle>;
  color?: string;
  backgroundColor?: string;
}

const NotificationBellButton: React.FC<Props> = ({ style, color = theme.colors.text, backgroundColor }) => {
  const navigation = useNavigation();
  const { unreadCount } = useNotifications();

  return (
    <TouchableOpacity 
      style={[
        styles.btn, 
        backgroundColor && { backgroundColor, padding: 8, borderRadius: 20 },
        style
      ]} 
      onPress={() => (navigation as any).navigate('Notifications')}
    >
      <Icon name="bell-outline" size={24} color={color} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: COLORS.white,
    zIndex: 10,
    elevation: 2,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '900',
  },
});

export default NotificationBellButton;
