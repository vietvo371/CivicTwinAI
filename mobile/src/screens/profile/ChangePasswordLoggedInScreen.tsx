import React, { useState } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import PageHeader from '../../component/PageHeader';
import InputCustom from '../../component/InputCustom';
import ButtonCustom from '../../component/ButtonCustom';
import ModalCustom from '../../component/ModalCustom';
import { theme, SPACING, FONT_SIZE, SCREEN_PADDING } from '../../theme';
import { useTranslation } from '../../hooks/useTranslation';
import { authService } from '../../services/authService';

const ChangePasswordLoggedInScreen = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [formData, setFormData] = useState({
        mat_khau_cu: '',
        mat_khau_moi: '',
        mat_khau_moi_confirmation: '',
    });

    const [errors, setErrors] = useState<{
        mat_khau_cu?: string;
        mat_khau_moi?: string;
        mat_khau_moi_confirmation?: string;
    }>({});

    const [passwordStrength, setPasswordStrength] = useState(0);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const calculatePasswordStrength = (password: string) => {
        let strength = 0;
        if (password.length >= 6) strength += 1;
        if (password.length >= 8) strength += 1;
        if (/[a-z]/.test(password)) strength += 1;
        if (/[A-Z]/.test(password)) strength += 1;
        if (/\d/.test(password)) strength += 1;
        if (/[^A-Za-z0-9]/.test(password)) strength += 1;
        return strength;
    };

    const getPasswordStrengthText = (strength: number) => {
        if (strength <= 2) return { text: t('changePassword.strengthWeak'), color: theme.colors.error };
        if (strength <= 4) return { text: t('changePassword.strengthMedium'), color: theme.colors.warning };
        return { text: t('changePassword.strengthStrong'), color: theme.colors.success };
    };

    const validateForm = () => {
        const newErrors: {
            mat_khau_cu?: string;
            mat_khau_moi?: string;
            mat_khau_moi_confirmation?: string;
        } = {};

        if (!formData.mat_khau_cu) {
            newErrors.mat_khau_cu = t('changePassword.oldPasswordRequired');
        }

        if (!formData.mat_khau_moi) {
            newErrors.mat_khau_moi = t('changePassword.newPasswordRequired');
        } else if (formData.mat_khau_moi.length < 6) {
            newErrors.mat_khau_moi = t('changePassword.newPasswordMinLengthShort');
        } else if (formData.mat_khau_moi === formData.mat_khau_cu) {
            newErrors.mat_khau_moi = t('changePassword.newPasswordDifferent');
        }

        if (!formData.mat_khau_moi_confirmation) {
            newErrors.mat_khau_moi_confirmation = t('changePassword.confirmPasswordRequired');
        } else if (formData.mat_khau_moi !== formData.mat_khau_moi_confirmation) {
            newErrors.mat_khau_moi_confirmation = t('changePassword.passwordsDoNotMatchConfirm');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChangePassword = async () => {
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            await authService.changePassword(formData);
            setShowSuccessModal(true);
        } catch (error: any) {
            console.error('Change password error:', error);
            let message = t('changePassword.passwordChangedFailed');

            if (error.response?.data?.message) {
                message = error.response.data.message;
            } else if (error.message) {
                message = error.message;
            }

            setErrorMessage(message);
            setShowErrorModal(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={[]}>
            <StatusBar barStyle="dark-content" backgroundColor={theme.colors.white} />
            <View style={{ backgroundColor: theme.colors.white, paddingTop: insets.top }}>
                <PageHeader title={t('changePassword.title')} variant="default" />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.formSection}>
                    <Text style={styles.description}>
                        {t('changePassword.description')}
                    </Text>

                    <InputCustom
                        label={t('changePassword.oldPassword')}
                        placeholder={t('changePassword.oldPasswordPlaceholder')}
                        value={formData.mat_khau_cu}
                        onChangeText={(text) => setFormData({ ...formData, mat_khau_cu: text })}
                        secureTextEntry={!showOldPassword}
                        error={errors.mat_khau_cu}
                        leftIcon="lock-outline"
                        rightIcon={showOldPassword ? 'eye-off-outline' : 'eye-outline'}
                        onRightIconPress={() => setShowOldPassword(!showOldPassword)}
                        containerStyle={styles.input}
                    />

                    <InputCustom
                        label={t('changePassword.newPassword')}
                        placeholder={t('changePassword.newPasswordPlaceholder')}
                        value={formData.mat_khau_moi}
                        onChangeText={(text) => {
                            setFormData({ ...formData, mat_khau_moi: text });
                            setPasswordStrength(calculatePasswordStrength(text));
                        }}
                        secureTextEntry={!showNewPassword}
                        error={errors.mat_khau_moi}
                        leftIcon="lock-outline"
                        rightIcon={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                        onRightIconPress={() => setShowNewPassword(!showNewPassword)}
                        containerStyle={styles.input}
                    />

                    {/* Password Strength Indicator */}
                    {formData.mat_khau_moi.length > 0 && (
                        <View style={styles.passwordStrengthContainer}>
                            <View style={styles.passwordStrengthBar}>
                                <View
                                    style={[
                                        styles.passwordStrengthFill,
                                        {
                                            width: `${(passwordStrength / 6) * 100}%`,
                                            backgroundColor: getPasswordStrengthText(passwordStrength).color
                                        }
                                    ]}
                                />
                            </View>
                            <Text style={[
                                styles.passwordStrengthText,
                                { color: getPasswordStrengthText(passwordStrength).color }
                            ]}>
                                {t('changePassword.strength')}: {getPasswordStrengthText(passwordStrength).text}
                            </Text>
                        </View>
                    )}

                    <InputCustom
                        label={t('changePassword.confirmNewPassword')}
                        placeholder={t('changePassword.confirmNewPasswordPlaceholder')}
                        value={formData.mat_khau_moi_confirmation}
                        onChangeText={(text) => setFormData({ ...formData, mat_khau_moi_confirmation: text })}
                        secureTextEntry={!showConfirmPassword}
                        error={errors.mat_khau_moi_confirmation}
                        leftIcon="lock-check-outline"
                        rightIcon={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                        onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        containerStyle={styles.input}
                    />

                    <ButtonCustom
                        title={loading ? t('common.loading') : t('changePassword.changePassword')}
                        onPress={handleChangePassword}
                        disabled={loading}
                        style={styles.submitButton}
                        icon="check-circle"
                    />

                    <View style={styles.tipsSection}>
                        <Text style={styles.tipsTitle}>{t('changePassword.tipsTitle')}</Text>
                        <Text style={styles.tipText}>• {t('changePassword.tip1')}</Text>
                        <Text style={styles.tipText}>• {t('changePassword.tip2')}</Text>
                        <Text style={styles.tipText}>• {t('changePassword.tip3')}</Text>
                        <Text style={styles.tipText}>• {t('changePassword.tip4')}</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Success Modal */}
            <ModalCustom
                isModalVisible={showSuccessModal}
                setIsModalVisible={setShowSuccessModal}
                title={t('common.success')}
                type="success"
                isClose={false}
                actionText="OK"
                onPressAction={() => navigation.goBack()}
            >
                <Text style={{ textAlign: 'center', color: theme.colors.text }}>
                    {t('changePassword.successMessage')}
                </Text>
            </ModalCustom>

            {/* Error Modal */}
            <ModalCustom
                isModalVisible={showErrorModal}
                setIsModalVisible={setShowErrorModal}
                title={t('common.error')}
                type="error"
                isClose={false}
                actionText="OK"
            >
                <Text style={{ textAlign: 'center', color: theme.colors.text }}>
                    {errorMessage}
                </Text>
            </ModalCustom>
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
    formSection: {
        backgroundColor: theme.colors.white,
        padding: SCREEN_PADDING.horizontal,
        marginBottom: SPACING.md,
    },
    description: {
        fontSize: FONT_SIZE.sm,
        color: theme.colors.textSecondary,
        marginBottom: SPACING.lg,
        lineHeight: 20,
    },
    input: {
        marginBottom: SPACING.md,
    },
    passwordStrengthContainer: {
        marginTop: -SPACING.sm,
        marginBottom: SPACING.md,
    },
    passwordStrengthBar: {
        height: 4,
        backgroundColor: theme.colors.border,
        borderRadius: 2,
        overflow: 'hidden',
        marginBottom: SPACING.xs,
    },
    passwordStrengthFill: {
        height: '100%',
        borderRadius: 2,
    },
    passwordStrengthText: {
        fontSize: FONT_SIZE.xs,
        textAlign: 'right',
    },
    submitButton: {
        marginTop: SPACING.md,
        marginBottom: SPACING.lg,
    },
    tipsSection: {
        backgroundColor: theme.colors.backgroundSecondary,
        padding: SPACING.md,
        borderRadius: 8,
    },
    tipsTitle: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: SPACING.sm,
    },
    tipText: {
        fontSize: FONT_SIZE.xs,
        color: theme.colors.textSecondary,
        marginBottom: 4,
        lineHeight: 18,
    },
});

export default ChangePasswordLoggedInScreen;
