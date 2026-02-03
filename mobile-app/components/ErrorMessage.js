import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, BorderRadius } from '../styles/theme';

const ErrorMessage = ({ message, style = {} }) => {
    if (!message) return null;

    return (
        <View style={[styles.container, style]}>
            <MaterialIcons name="error-outline" size={20} color={Colors.error} />
            <Text style={styles.text}>{message}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fee',
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderLeftWidth: 4,
        borderLeftColor: Colors.error,
        marginVertical: Spacing.sm,
    },
    text: {
        flex: 1,
        marginLeft: Spacing.sm,
        fontSize: FontSizes.md,
        color: Colors.error,
    },
});

export default ErrorMessage;
