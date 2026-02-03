import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '../styles/theme';

const StatCard = ({ icon, value, label, color = Colors.primary }) => {
    return (
        <View style={[styles.container, Shadows.md]}>
            <Text style={[styles.icon, { color }]}>{icon}</Text>
            <Text style={[styles.value, { color }]}>{value}</Text>
            <Text style={styles.label}>{label}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        alignItems: 'center',
        flex: 1,
        marginHorizontal: Spacing.xs,
    },
    icon: {
        fontSize: 32,
        marginBottom: Spacing.xs,
    },
    value: {
        fontSize: FontSizes.xxl,
        fontWeight: 'bold',
        marginBottom: Spacing.xs,
    },
    label: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
});

export default StatCard;
