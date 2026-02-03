import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '../styles/theme';
import { useAuth } from '../context/AuthContext';
import { APP_VERSION } from '../utils/constants';

const ProfileScreen = () => {
    const { user, logout } = useAuth();

    const handleLogout = () => {
        Alert.alert(
            'Déconnexion',
            'Êtes-vous sûr de vouloir vous déconnecter ?',
            [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Déconnexion', onPress: logout, style: 'destructive' },
            ]
        );
    };

    const MenuItem = ({ icon, title, onPress, showArrow = true }) => (
        <TouchableOpacity style={styles.menuItem} onPress={onPress}>
            <View style={styles.menuLeft}>
                <MaterialIcons name={icon} size={24} color={Colors.primary} />
                <Text style={styles.menuTitle}>{title}</Text>
            </View>
            {showArrow && (
                <MaterialIcons name="chevron-right" size={24} color={Colors.textSecondary} />
            )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.content}>
                {/* Profile Header */}
                <View style={[styles.profileCard, Shadows.md]}>
                    <View style={styles.avatar}>
                        <MaterialIcons name="person" size={48} color={Colors.surface} />
                    </View>
                    <Text style={styles.email}>{user?.email}</Text>
                    <Text style={styles.role}>{user?.role?.toUpperCase()}</Text>
                </View>

                {/* Menu Items */}
                <View style={[styles.menuCard, Shadows.md]}>
                    <MenuItem
                        icon="badge"
                        title="Informations personnelles"
                        onPress={() => { }}
                    />
                    <MenuItem
                        icon="notifications"
                        title="Notifications"
                        onPress={() => { }}
                    />
                    <MenuItem
                        icon="security"
                        title="Sécurité"
                        onPress={() => { }}
                    />
                    <MenuItem
                        icon="help"
                        title="Aide et support"
                        onPress={() => { }}
                    />
                    <MenuItem
                        icon="info"
                        title={`Version ${APP_VERSION}`}
                        showArrow={false}
                        onPress={() => { }}
                    />
                </View>

                {/* Logout Button */}
                <TouchableOpacity
                    style={[styles.logoutButton, Shadows.md]}
                    onPress={handleLogout}
                >
                    <MaterialIcons name="logout" size={24} color={Colors.error} />
                    <Text style={styles.logoutText}>Déconnexion</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    content: {
        flex: 1,
        padding: Spacing.md,
    },
    profileCard: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.xl,
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    avatar: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    email: {
        fontSize: FontSizes.xl,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: Spacing.xs,
    },
    role: {
        fontSize: FontSizes.md,
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    menuCard: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        marginBottom: Spacing.lg,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
    },
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuTitle: {
        fontSize: FontSizes.md,
        color: Colors.text,
        marginLeft: Spacing.md,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.error,
    },
    logoutText: {
        fontSize: FontSizes.lg,
        fontWeight: '600',
        color: Colors.error,
        marginLeft: Spacing.sm,
    },
});

export default ProfileScreen;
