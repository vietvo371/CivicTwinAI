import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../i18n';

export const useTranslation = () => {
  const { t, i18n: i18nInstance } = useI18nTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(() => i18nInstance.language);

  useEffect(() => {
    const listener = (lng: string) => {
      setCurrentLanguage(lng);
    };
    i18nInstance.on('languageChanged', listener);
    return () => {
      i18nInstance.off('languageChanged', listener);
    };
  }, [i18nInstance]);

  const changeLanguage = async (languageCode: string) => {
    try {
      await i18nInstance.changeLanguage(languageCode);
      await AsyncStorage.setItem('user-language', languageCode);
    } catch (error) {
      console.log('Error changing language:', error);
    }
  };

  const getCurrentLanguage = () => {
    return i18nInstance.language;
  };

  const isRTL = () => {
    return i18nInstance.dir() === 'rtl';
  };

  return {
    t,
    changeLanguage,
    getCurrentLanguage,
    isRTL,
    currentLanguage,
  };
};

export default useTranslation;
