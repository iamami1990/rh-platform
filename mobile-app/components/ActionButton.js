import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '../styles/theme';

const ActionButton = ({
    title,
    onPress,
    variant = 'primary', // 'primary', 'secondary', 'success', 'danger', 'outline'
    loading = false,
    disabled = false,
    style = {},
}) => {
    const getButtonStyle = () => {
        if (disabled) return styles.buttonDisabled;

        switch (variant) {
            case 'primary':
                return styles.buttonPrimary;
            case 'secondary':
                return styles.buttonSecondary;
            case 'success':
                return styles.buttonSuccess;
            case 'danger':
                return styles.buttonDanger;
            case 'outline':
                return styles.buttonOutline;
            default:
                return styles.buttonPrimary;
        }
    };

    const getTextStyle = () => {
        if (disabled) return styles.textDisabled;

        switch (variant) {
            case 'outline':
                return styles.textOutline;
            default:
                return styles.textDefault;
        }
    };

    return (
        <TouchableOpacity
            style={[styles.button, getButtonStyle(), Shadows.md, style]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.7}
        >
            {loading ? (
                <ActivityIndicator color={variant === 'outline' ? Colors.primary : Colors.surface} />
            ) : (
                <Text style={[styles.text, getTextStyle()]}>{title}</Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 48,
    },
    buttonPrimary: {
        backgroundColor: Colors.primary,
    },
    buttonSecondary: {
        backgroundColor: Colors.secondary,
    },
    buttonSuccess: {
        backgroundColor: Colors.success,
    },
    buttonDanger: {
        backgroundColor: Colors.error,
    },
    buttonOutline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: Colors.primary,
    },
    buttonDisabled: {
        backgroundColor: Colors.border,
    },
    text: {
        fontSize: FontSizes.lg,
        fontWeight: '600',
    },
    textDefault: {
        color: Colors.surface,
    },
    textOutline: {
        color: Colors.primary,
    },
    textDisabled: {
        color: Colors.textLight,
    },
});

export default ActionButton;
