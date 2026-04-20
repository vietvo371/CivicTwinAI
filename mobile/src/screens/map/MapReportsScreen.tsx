import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet } from 'react-native';
import PageHeader from '../../component/PageHeader';
import { theme, SPACING, FONT_SIZE } from '../../theme';

const MapReportsScreen = () => {
  const { t } = useTranslation();
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <PageHeader title={t('map.reportsMap')} variant="default" />
      <View style={styles.content}>
        <Text style={styles.placeholderText}>{t('common.comingSoon')}</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  placeholderText: {
    fontSize: FONT_SIZE.md,
    color: theme.colors.textSecondary,
  },
});

export default MapReportsScreen;


