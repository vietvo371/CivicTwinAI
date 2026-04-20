import React from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import PageHeader from '../../component/PageHeader';
import { theme, SPACING, FONT_SIZE, BORDER_RADIUS, ICON_SIZE, SCREEN_PADDING } from '../../theme';
import { useTranslation } from '../../hooks/useTranslation';

interface HelpItem {
    id: string;
    icon: string;
    title: string;
    description: string;
    action: () => void;
}

const HelpCenterScreen = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();

    const handleContactSupport = () => {
        Linking.openURL(`mailto:${t('help.directContactEmail')}?subject=Hỗ trợ CivicTwinAI`);
    };

    const handleOpenFAQ = () => {
        Linking.openURL('https://civictwinai.com/faq');
    };

    const handleOpenGuide = () => {
        Linking.openURL('https://civictwinai.com/guide');
    };

    const handleOpenCommunity = () => {
        Linking.openURL('https://community.civictwinai.com');
    };

    const handleReportBug = () => {
        Linking.openURL(`mailto:bugs@civictwinai.com?subject=${t('help.bugTitle')} CivicTwinAI`);
    };

    const helpItems: HelpItem[] = [
        {
            id: 'faq',
            icon: 'frequently-asked-questions',
            title: t('help.faqTitle'),
            description: t('help.faqDesc'),
            action: handleOpenFAQ,
        },
        {
            id: 'guide',
            icon: 'book-open-variant',
            title: t('help.guideTitle'),
            description: t('help.guideDesc'),
            action: handleOpenGuide,
        },
        {
            id: 'contact',
            icon: 'email-outline',
            title: t('help.supportTitle'),
            description: t('help.supportDesc'),
            action: handleContactSupport,
        },
        {
            id: 'community',
            icon: 'account-group',
            title: t('help.communityTitle'),
            description: t('help.communityDesc'),
            action: handleOpenCommunity,
        },
        {
            id: 'bug',
            icon: 'bug-outline',
            title: t('help.bugTitle'),
            description: t('help.bugDesc'),
            action: handleReportBug,
        },
    ];

    const quickLinks = [
        { title: t('about.privacyPolicy'), url: 'https://civictwinai.com/privacy' },
        { title: t('about.termsOfUse'), url: 'https://civictwinai.com/terms' },
        { title: t('help.communityGuidelines'), url: 'https://civictwinai.com/community-guidelines' },
    ];

    return (
        <SafeAreaView style={styles.container} edges={[]}>
            <StatusBar barStyle="dark-content" backgroundColor={theme.colors.white} />
            <View style={{ backgroundColor: theme.colors.white, paddingTop: insets.top }}>
                <PageHeader title={t('help.title')} variant="default" />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Header Section */}
                <View style={styles.headerSection}>
                    <Icon name="help-circle" size={64} color={theme.colors.primary} />
                    <Text style={styles.headerTitle}>{t('help.headerTitle')}</Text>
                    <Text style={styles.headerDescription}>
                        {t('help.headerDesc')}
                    </Text>
                </View>

                {/* Help Items */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('help.categories')}</Text>
                    <View style={styles.helpList}>
                        {helpItems.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.helpItem}
                                onPress={item.action}
                            >
                                <View style={styles.helpIconContainer}>
                                    <Icon name={item.icon} size={ICON_SIZE.lg} color={theme.colors.primary} />
                                </View>
                                <View style={styles.helpContent}>
                                    <Text style={styles.helpTitle}>{item.title}</Text>
                                    <Text style={styles.helpDescription}>{item.description}</Text>
                                </View>
                                <Icon name="chevron-right" size={ICON_SIZE.md} color={theme.colors.textSecondary} />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Quick Links */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('help.quickLinks')}</Text>
                    <View style={styles.linkList}>
                        {quickLinks.map((link, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.linkItem}
                                onPress={() => Linking.openURL(link.url)}
                            >
                                <Text style={styles.linkText}>{link.title}</Text>
                                <Icon name="open-in-new" size={ICON_SIZE.sm} color={theme.colors.primary} />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Contact Info */}
                <View style={styles.contactSection}>
                    <Text style={styles.contactTitle}>{t('help.directContact')}</Text>
                    <View style={styles.contactItem}>
                        <Icon name="email" size={ICON_SIZE.md} color={theme.colors.primary} />
                        <Text style={styles.contactText}>{t('help.directContactEmail')}</Text>
                    </View>
                    <View style={styles.contactItem}>
                        <Icon name="phone" size={ICON_SIZE.md} color={theme.colors.primary} />
                        <Text style={styles.contactText}>{t('help.directContactPhone')}</Text>
                    </View>
                </View>
            </ScrollView>
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
    },
    headerSection: {
        alignItems: 'center',
        backgroundColor: theme.colors.white,
        padding: SCREEN_PADDING.horizontal,
        paddingVertical: SPACING.xl,
        marginBottom: SPACING.md,
    },
    headerTitle: {
        fontSize: FONT_SIZE.xl,
        fontWeight: '700',
        color: theme.colors.text,
        marginTop: SPACING.md,
        marginBottom: SPACING.xs,
    },
    headerDescription: {
        fontSize: FONT_SIZE.sm,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
    section: {
        backgroundColor: theme.colors.white,
        padding: SCREEN_PADDING.horizontal,
        marginBottom: SPACING.md,
    },
    sectionTitle: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: SPACING.md,
    },
    helpList: {
        gap: SPACING.sm,
    },
    helpItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        backgroundColor: theme.colors.backgroundSecondary,
        borderRadius: BORDER_RADIUS.md,
        gap: SPACING.md,
    },
    helpIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: theme.colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    helpContent: {
        flex: 1,
    },
    helpTitle: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 2,
    },
    helpDescription: {
        fontSize: FONT_SIZE.sm,
        color: theme.colors.textSecondary,
        lineHeight: 18,
    },
    linkList: {
        gap: SPACING.xs,
    },
    linkItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: SPACING.md,
        backgroundColor: theme.colors.backgroundSecondary,
        borderRadius: BORDER_RADIUS.sm,
    },
    linkText: {
        fontSize: FONT_SIZE.sm,
        color: theme.colors.primary,
        fontWeight: '500',
    },
    contactSection: {
        backgroundColor: theme.colors.primary + '10',
        padding: SCREEN_PADDING.horizontal,
        marginHorizontal: SCREEN_PADDING.horizontal,
        borderRadius: BORDER_RADIUS.md,
        marginBottom: SPACING.xl,
    },
    contactTitle: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: SPACING.md,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        marginBottom: SPACING.sm,
    },
    contactText: {
        fontSize: FONT_SIZE.sm,
        color: theme.colors.text,
    },
});

export default HelpCenterScreen;
