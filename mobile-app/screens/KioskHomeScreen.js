import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSizes } from '../styles/theme';
import ActionButton from '../components/ActionButton';

const KioskHomeScreen = ({ navigation }) => {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Mode KIOSK</Text>
                <Text style={styles.subtitle}>Pointage et services RH partages</Text>
            </View>

            <View style={styles.actions}>
                <ActionButton
                    title="Check-in"
                    variant="success"
                    onPress={() => navigation.navigate('KioskVerify', { action: 'check_in' })}
                    style={styles.actionButton}
                />
                <ActionButton
                    title="Check-out"
                    variant="secondary"
                    onPress={() => navigation.navigate('KioskVerify', { action: 'check_out' })}
                    style={styles.actionButton}
                />
                <ActionButton
                    title="Demande de conge"
                    onPress={() => navigation.navigate('KioskLeave')}
                    style={styles.actionButton}
                />
                <ActionButton
                    title="Bulletin de paie"
                    variant="outline"
                    onPress={() => navigation.navigate('KioskVerify', { action: 'payroll' })}
                    style={styles.actionButton}
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        padding: Spacing.lg,
    },
    header: {
        marginBottom: Spacing.xl,
    },
    title: {
        fontSize: FontSizes.xxxl,
        fontWeight: 'bold',
        color: Colors.text,
    },
    subtitle: {
        fontSize: FontSizes.md,
        color: Colors.textSecondary,
        marginTop: Spacing.sm,
    },
    actions: {
        gap: Spacing.md,
    },
    actionButton: {
        width: '100%',
    },
});

export default KioskHomeScreen;
