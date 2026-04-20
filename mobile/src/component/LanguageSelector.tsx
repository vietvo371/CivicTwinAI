import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  Dimensions,
  Animated,
  TouchableWithoutFeedback,
  Pressable,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BlurView } from '@react-native-community/blur';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useTranslation } from '../hooks/useTranslation';
import { theme, COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, SCREEN_PADDING } from '../theme';

const { height } = Dimensions.get('window');

type Language = {
  code: string;
  name: string;
  flag: any;
};

const LANGUAGES: Language[] = [
  {
    code: 'vi',
    name: 'Tiếng Việt',
    flag: require('../assets/images/logo_vietnam.jpg'),
  },
  {
    code: 'en',
    name: 'English',
    flag: require('../assets/images/logo_eng.png'),
  },
];

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (code: string) => void;
  currentLanguage: string;
};

const LanguageSelector = ({ visible, onClose, onSelect, currentLanguage }: Props) => {
  const { t, changeLanguage } = useTranslation();
  const slideAnim = React.useRef(new Animated.Value(height)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 7, // Matched with ModalCustom for high responsiveness
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, slideAnim]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleLanguageSelect = async (languageCode: string) => {
    await changeLanguage(languageCode);
    onSelect(languageCode);
    handleClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleClose}
        >
          <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
            <BlurView
              style={StyleSheet.absoluteFill}
              blurType="dark"
              blurAmount={10}
              reducedTransparencyFallbackColor="black"
            />
          </Animated.View>
        </Pressable>

        <Animated.View
          style={[
            styles.modalContent,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.handle} />
          
          <View style={styles.header}>
            <Text style={styles.title}>{t('language.title')}</Text>
            <TouchableOpacity 
              onPress={handleClose}
              style={styles.closeBtn}
            >
              <Icon name="close" size={22} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.languageList}>
            {LANGUAGES.map((language) => (
              <TouchableOpacity
                key={language.code}
                style={[
                  styles.languageItem,
                  currentLanguage === language.code && styles.languageItemSelected
                ]}
                onPress={() => handleLanguageSelect(language.code)}
                activeOpacity={0.7}
              >
                <View style={styles.languageInfo}>
                  <View style={styles.flagContainer}>
                    <Image 
                      source={language.flag}
                      style={styles.flag}
                    />
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={[
                      styles.languageName,
                      currentLanguage === language.code && styles.languageNameSelected
                    ]}>
                      {language.name}
                    </Text>
                    <Text style={styles.nativeName}>{language.code === 'vi' ? 'Tiếng Việt' : 'English'}</Text>
                  </View>
                </View>
                
                {currentLanguage === language.code ? (
                  <View style={styles.checkCircle}>
                    <Icon name="check" size={16} color={theme.colors.white} />
                  </View>
                ) : (
                  <View style={styles.uncheckCircle} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: SPACING.md,
    paddingBottom: hp('5%'),
    paddingHorizontal: SCREEN_PADDING.horizontal,
    ...theme.shadows.lg,
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: theme.colors.divider,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageList: {
    gap: SPACING.md,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: BORDER_RADIUS.xxl,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  languageItemSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '08', // Ultra-light primary
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  flagContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    padding: 2,
    backgroundColor: theme.colors.white,
    ...theme.shadows.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flag: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  textContainer: {
    gap: 2,
  },
  languageName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  languageNameSelected: {
    color: theme.colors.primary,
  },
  nativeName: {
    fontSize: 12,
    color: theme.colors.textLight,
    fontWeight: '500',
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  uncheckCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: theme.colors.divider,
  },
});

export default LanguageSelector;
