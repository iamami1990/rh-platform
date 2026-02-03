import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSizes, BorderRadius } from '../styles/theme';
import ActionButton from '../components/ActionButton';
import ErrorMessage from '../components/ErrorMessage';
import { useAuth } from '../context/AuthContext';

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleLogin = async () => {
        setError('');

        if (!email || !password) {
            setError('Veuillez remplir tous les champs');
            return;
        }

        setLoading(true);
        const result = await login(email, password);
        setLoading(false);

        if (!result.success) {
            setError(result.message);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.logoContainer}>
                        <Text style={styles.logo}>🏢</Text>
                        <Text style={styles.title}>Olympia HR</Text>
                        <Text style={styles.subtitle}>Plateforme Intelligente RH</Text>
                    </View>

                    <View style={styles.formContainer}>
                        <ErrorMessage message={error} />

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email professionnel</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="exemple@olympia.com"
                                placeholderTextColor={Colors.textLight}
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                autoCorrect={false}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Mot de passe</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="••••••••"
                                placeholderTextColor={Colors.textLight}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                autoCorrect={false}
                            />
                        </View>

                        <ActionButton
                            title="Se Connecter"
                            onPress={handleLogin}
                            loading={loading}
                            style={styles.loginButton}
                        />
                    </View>

                    <Text style={styles.version}>Version 1.0.0</Text>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.primary,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: Spacing.lg,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: Spacing.xl * 2,
    },
    logo: {
        fontSize: 64,
        marginBottom: Spacing.md,
    },
    title: {
        fontSize: FontSizes.xxxl,
        fontWeight: 'bold',
        color: Colors.surface,
        marginBottom: Spacing.xs,
    },
    subtitle: {
        fontSize: FontSizes.lg,
        color: Colors.surface,
        opacity: 0.9,
    },
    formContainer: {
        width: '100%',
    },
    inputGroup: {
        marginBottom: Spacing.lg,
    },
    label: {
        fontSize: FontSizes.md,
        color: Colors.surface,
        marginBottom: Spacing.sm,
        fontWeight: '500',
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        fontSize: FontSizes.lg,
        color: Colors.surface,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    loginButton: {
        backgroundColor: Colors.surface,
        marginTop: Spacing.md,
    },
    version: {
        textAlign: 'center',
        marginTop: Spacing.xl,
        color: Colors.surface,
        fontSize: FontSizes.sm,
        opacity: 0.7,
    },
});

export default LoginScreen;
