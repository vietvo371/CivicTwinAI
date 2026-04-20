import React from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Image, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import PageHeader from '../../component/PageHeader';
import { theme, SPACING, FONT_SIZE, BORDER_RADIUS, ICON_SIZE, SCREEN_PADDING } from '../../theme';
import { useTranslation } from '../../hooks/useTranslation';

const AboutScreen = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();

    const appInfo = {
        name: 'CivicTwinAI',
        version: '1.0.0',
        buildNumber: '100',
        description: t('about.description'),
    };

    const features = [
        { icon: 'map-marker-alert', title: t('about.feat1Title'), description: t('about.feat1Desc') },
        { icon: 'chart-line', title: t('about.feat2Title'), description: t('about.feat2Desc') },
        { icon: 'account-group', title: t('about.feat3Title'), description: t('about.feat3Desc') },
        { icon: 'shield-check', title: t('about.feat4Title'), description: t('about.feat4Desc') },
    ];

    const teamMembers = [
        { name: t('about.contactDev'), email: 'dev@civictwinai.com' },
        { name: t('about.contactSupport'), email: 'support@civictwinai.com' },
        { name: t('about.contactBusiness'), email: 'business@civictwinai.com' },
    ];

    const socialLinks = [
        { icon: 'facebook', name: 'Facebook', url: 'https://facebook.com/civictwinai' },
        { icon: 'twitter', name: 'Twitter', url: 'https://twitter.com/civictwinai' },
        { icon: 'instagram', name: 'Instagram', url: 'https://instagram.com/civictwinai' },
        { icon: 'youtube', name: 'YouTube', url: 'https://youtube.com/@civictwinai' },
    ];

    return (
        <SafeAreaView style={styles.container} edges={[]}>
            <StatusBar barStyle="dark-content" backgroundColor={theme.colors.white} />
            <View style={{ backgroundColor: theme.colors.white, paddingTop: insets.top }}>
                <PageHeader title={t('about.title')} variant="default" />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* App Logo & Info */}
                <View style={styles.logoSection}>
                    <View style={styles.logoContainer}>
                        <Icon name="city-variant" size={64} color={theme.colors.primary} />
                    </View>
                    <Text style={styles.appName}>{appInfo.name}</Text>
                    <Text style={styles.appVersion}>
                        {t('about.version', { version: appInfo.version, build: appInfo.buildNumber })}
                    </Text>
                    <Text style={styles.appDescription}>{appInfo.description}</Text>
                </View>

                {/* Features */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('about.featuresTitle')}</Text>
                    <View style={styles.featureGrid}>
                        {features.map((feature, index) => (
                            <View key={index} style={styles.featureCard}>
                                <View style={styles.featureIconContainer}>
                                    <Icon name={feature.icon} size={ICON_SIZE.lg} color={theme.colors.primary} />
                                </View>
                                <Text style={styles.featureTitle}>{feature.title}</Text>
                                <Text style={styles.featureDescription}>{feature.description}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Mission */}
                <View style={styles.missionSection}>
                    <Icon name="target" size={ICON_SIZE.xl} color={theme.colors.primary} />
                    <Text style={styles.missionTitle}>{t('about.missionTitle')}</Text>
                    <Text style={styles.missionText}>
                        {t('about.missionText')}
                    </Text>
                </View>

                {/* Contact Team */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('about.contact')}</Text>
                    <View style={styles.contactList}>
                        {teamMembers.map((member, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.contactItem}
                                onPress={() => Linking.openURL(`mailto:${member.email}`)}
                            >
                                <Icon name="email-outline" size={ICON_SIZE.md} color={theme.colors.primary} />
                                <View style={styles.contactInfo}>
                                    <Text style={styles.contactName}>{member.name}</Text>
                                    <Text style={styles.contactEmail}>{member.email}</Text>
                                </View>
                                <Icon name="chevron-right" size={ICON_SIZE.sm} color={theme.colors.textSecondary} />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Social Media */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('about.followUs')}</Text>
                    <View style={styles.socialGrid}>
                        {socialLinks.map((social, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.socialButton}
                                onPress={() => Linking.openURL(social.url)}
                            >
                                <Icon name={social.icon} size={ICON_SIZE.lg} color={theme.colors.white} />
                                <Text style={styles.socialName}>{social.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Legal Links */}
                <View style={styles.legalSection}>
                    <TouchableOpacity
                        style={styles.legalLink}
                        onPress={() => Linking.openURL('https://civictwinai.com/privacy')}
                    >
                        <Text style={styles.legalText}>{t('about.privacyPolicy')}</Text>
                    </TouchableOpacity>
                    <Text style={styles.legalDivider}>•</Text>
                    <TouchableOpacity
                        style={styles.legalLink}
                        onPress={() => Linking.openURL('https://civictwinai.com/terms')}
                    >
                        <Text style={styles.legalText}>{t('about.termsOfUse')}</Text>
                    </TouchableOpacity>
                </View>

                {/* Copyright */}
                <Text style={styles.copyright}>
                    © 2025 CivicTwinAI. All rights reserved.
                </Text>
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
    logoSection: {
        alignItems: 'center',
        backgroundColor: theme.colors.white,
        padding: SCREEN_PADDING.horizontal,
        paddingVertical: SPACING.xl * 2,
        marginBottom: SPACING.md,
    },
    logoContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: theme.colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    appName: {
        fontSize: FONT_SIZE['2xl'],
        fontWeight: '700',
        color: theme.colors.text,
        marginBottom: SPACING.xs,
    },
    appVersion: {
        fontSize: FONT_SIZE.sm,
        color: theme.colors.textSecondary,
        marginBottom: SPACING.md,
    },
    appDescription: {
        fontSize: FONT_SIZE.md,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    section: {
        backgroundColor: theme.colors.white,
        padding: SCREEN_PADDING.horizontal,
        marginBottom: SPACING.md,
    },
    sectionTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: SPACING.md,
    },
    featureGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
    },
    featureCard: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: theme.colors.backgroundSecondary,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md,
        alignItems: 'center',
    },
    featureIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: theme.colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    featureTitle: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 4,
        textAlign: 'center',
    },
    featureDescription: {
        fontSize: FONT_SIZE.xs,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 16,
    },
    missionSection: {
        backgroundColor: theme.colors.primary + '10',
        padding: SCREEN_PADDING.horizontal,
        paddingVertical: SPACING.xl,
        marginHorizontal: SCREEN_PADDING.horizontal,
        borderRadius: BORDER_RADIUS.lg,
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    missionTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        color: theme.colors.text,
        marginTop: SPACING.md,
        marginBottom: SPACING.sm,
    },
    missionText: {
        fontSize: FONT_SIZE.sm,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    contactList: {
        gap: SPACING.sm,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        backgroundColor: theme.colors.backgroundSecondary,
        borderRadius: BORDER_RADIUS.md,
        gap: SPACING.md,
    },
    contactInfo: {
        flex: 1,
    },
    contactName: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 2,
    },
    contactEmail: {
        fontSize: FONT_SIZE.sm,
        color: theme.colors.primary,
    },
    socialGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
    },
    socialButton: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: theme.colors.primary,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md,
        alignItems: 'center',
        gap: SPACING.xs,
    },
    socialName: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: theme.colors.white,
    },
    legalSection: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: SPACING.sm,
        paddingVertical: SPACING.md,
    },
    legalLink: {
        padding: SPACING.xs,
    },
    legalText: {
        fontSize: FONT_SIZE.sm,
        color: theme.colors.primary,
        fontWeight: '500',
    },
    legalDivider: {
        fontSize: FONT_SIZE.sm,
        color: theme.colors.textSecondary,
    },
    copyright: {
        fontSize: FONT_SIZE.xs,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        paddingBottom: SPACING.xl,
    },
});

export default AboutScreen;
