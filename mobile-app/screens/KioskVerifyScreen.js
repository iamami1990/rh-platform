import React, { useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Alert,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Colors, Spacing, FontSizes, BorderRadius } from '../styles/theme';
import ActionButton from '../components/ActionButton';
import { kioskAPI } from '../services/api';

const KioskVerifyScreen = ({ navigation, route }) => {
    const { action, leavePayload } = route.params || {};
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef(null);
    const [photoBase64, setPhotoBase64] = useState(null);
    const [pin, setPin] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const capturePhoto = async () => {
        if (!cameraRef.current) return;
        const photo = await cameraRef.current.takePictureAsync({
            quality: 0.6,
            base64: true,
        });
        setPhotoBase64(photo.base64 || null);
        Alert.alert('Capture', 'Photo capturee. Vous pouvez continuer.');
    };

    const handleSubmit = async () => {
        if (!photoBase64 && !pin) {
            Alert.alert('Erreur', 'Capturez un visage ou saisissez un PIN.');
            return;
        }

        setLoading(true);
        const deviceInfo = {
            kiosk: true,
            app_version: Constants.expoConfig?.version || '1.0.0',
        };
        const payload = {
            image_base64: photoBase64,
            pin: pin || undefined,
            email: email || undefined,
            device_info: deviceInfo,
        };

        try {
            if (action === 'check_in') {
                await kioskAPI.checkIn(payload);
                Alert.alert('Succes', 'Check-in enregistre.', [
                    { text: 'OK', onPress: () => navigation.navigate('KioskHome') },
                ]);
            } else if (action === 'check_out') {
                await kioskAPI.checkOut(payload);
                Alert.alert('Succes', 'Check-out enregistre.', [
                    { text: 'OK', onPress: () => navigation.navigate('KioskHome') },
                ]);
            } else if (action === 'leave') {
                await kioskAPI.leave({ ...payload, ...leavePayload });
                Alert.alert('Succes', 'Demande de conge envoyee.', [
                    { text: 'OK', onPress: () => navigation.navigate('KioskHome') },
                ]);
            } else if (action === 'payroll') {
                const response = await kioskAPI.payrollSlip(payload);
                Alert.alert(
                    'Bulletin de paie',
                    `Mois: ${response.data.month}\nNet: ${response.data.net_salary} TND`,
                    [{ text: 'OK', onPress: () => navigation.navigate('KioskHome') }]
                );
            } else {
                Alert.alert('Erreur', 'Action kiosk inconnue');
            }
        } catch (error) {
            const msg = error.response?.data?.message || 'Echec de verification';
            Alert.alert('Erreur', msg);
        } finally {
            setLoading(false);
        }
    };

    if (!permission) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.infoText}>Demande de permission camera...</Text>
            </SafeAreaView>
        );
    }

    if (!permission.granted) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.infoText}>Permission camera refusee</Text>
                <ActionButton title="Autoriser la camera" onPress={requestPermission} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Verification KIOSK</Text>
            <Text style={styles.subtitle}>Visage ou PIN + email</Text>

            <View style={styles.cameraWrapper}>
                <CameraView ref={cameraRef} style={styles.camera} facing="front" />
                <TouchableOpacity style={styles.captureButton} onPress={capturePhoto}>
                    <MaterialIcons name="camera-alt" size={28} color={Colors.surface} />
                    <Text style={styles.captureText}>Capturer</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.form}>
                <TextInput
                    style={styles.input}
                    placeholder="Email professionnel (optionnel)"
                    placeholderTextColor={Colors.textLight}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
                <TextInput
                    style={styles.input}
                    placeholder="PIN (optionnel)"
                    placeholderTextColor={Colors.textLight}
                    value={pin}
                    onChangeText={setPin}
                    keyboardType="number-pad"
                    secureTextEntry
                />
            </View>

            <ActionButton
                title="Continuer"
                onPress={handleSubmit}
                loading={loading}
                style={styles.submitButton}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        padding: Spacing.lg,
    },
    title: {
        fontSize: FontSizes.xxl,
        fontWeight: 'bold',
        color: Colors.text,
    },
    subtitle: {
        fontSize: FontSizes.md,
        color: Colors.textSecondary,
        marginBottom: Spacing.md,
    },
    cameraWrapper: {
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
        marginBottom: Spacing.lg,
    },
    camera: {
        width: '100%',
        height: 260,
    },
    captureButton: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    captureText: {
        color: Colors.surface,
        fontWeight: '600',
    },
    form: {
        gap: Spacing.sm,
    },
    input: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        fontSize: FontSizes.md,
        color: Colors.text,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    submitButton: {
        marginTop: Spacing.lg,
    },
    infoText: {
        textAlign: 'center',
        marginTop: Spacing.xl,
        color: Colors.textSecondary,
    },
});

export default KioskVerifyScreen;
