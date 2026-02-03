import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FaceDetector from 'expo-face-detector';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, BorderRadius } from '../styles/theme';
import { attendanceAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CheckInCameraScreen = ({ navigation, route }) => {
    const isCheckOut = route?.params?.isCheckOut || false;
    const [permission, requestPermission] = useCameraPermissions();
    const { user } = useAuth();
    const [capturing, setCapturing] = useState(false);
    const [faceDetected, setFaceDetected] = useState(false);
    const [faceData, setFaceData] = useState(null);
    const [countdown, setCountdown] = useState(3);
    const cameraRef = useRef(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const countdownRef = useRef(null);

    useEffect(() => {
        if (permission && !permission.granted) {
            requestPermission();
        }
    }, [permission]);

    // Pulse animation when face is detected
    useEffect(() => {
        if (faceDetected) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.1,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [faceDetected]);

    // Countdown timer when face is detected
    useEffect(() => {
        if (faceDetected && !capturing && countdown > 0) {
            countdownRef.current = setTimeout(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
        }

        if (countdown === 0 && faceDetected && !capturing) {
            handleCapture();
        }

        return () => {
            if (countdownRef.current) {
                clearTimeout(countdownRef.current);
            }
        };
    }, [faceDetected, countdown, capturing]);

    // Reset countdown when face is lost
    useEffect(() => {
        if (!faceDetected) {
            setCountdown(3);
        }
    }, [faceDetected]);

    const handleFacesDetected = ({ faces }) => {
        if (faces.length > 0 && !capturing) {
            const face = faces[0];

            // Check if face is well-positioned (centered and right size)
            const isCentered = face.bounds.origin.x > 50 && face.bounds.origin.x < 250;
            const isRightSize = face.bounds.size.width > 100 && face.bounds.size.width < 300;

            // Anti-fraud: Check if eyes are open (liveness indicator)
            const leftEyeOpen = face.leftEyeOpenProbability > 0.5;
            const rightEyeOpen = face.rightEyeOpenProbability > 0.5;
            const eyesOpen = leftEyeOpen && rightEyeOpen;

            if (isCentered && isRightSize && eyesOpen) {
                setFaceDetected(true);
                setFaceData(face);
            } else {
                setFaceDetected(false);
                setFaceData(null);
            }
        } else {
            setFaceDetected(false);
            setFaceData(null);
        }
    };

    const handleCapture = async () => {
        if (capturing) return;
        setCapturing(true);

        try {
            // Take photo for face verification
            let photoUri = null;
            if (cameraRef.current) {
                const photo = await cameraRef.current.takePictureAsync({
                    quality: 0.5,
                    base64: false,
                });
                photoUri = photo.uri;
            }

            if (isCheckOut) {
                await attendanceAPI.checkOut({
                    employee_id: user.employee_id,
                });
                Alert.alert('Succès', 'Check-out réussi ! 👋', [
                    { text: 'OK', onPress: () => navigation.goBack() },
                ]);
            } else {
                await attendanceAPI.checkIn({
                    employee_id: user.employee_id,
                    location: 'Mobile App',
                    device_info: 'Expo Go - Facial Recognition',
                    face_image_url: photoUri,
                    liveness_score: faceData ?
                        (faceData.leftEyeOpenProbability + faceData.rightEyeOpenProbability) / 2 : 1,
                });
                Alert.alert('Succès', 'Pointage réussi ! ✅', [
                    { text: 'OK', onPress: () => navigation.goBack() },
                ]);
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Échec du pointage';
            Alert.alert('Erreur', errorMessage, [
                {
                    text: 'Réessayer', onPress: () => {
                        setCapturing(false);
                        setCountdown(3);
                    }
                },
                { text: 'Annuler', onPress: () => navigation.goBack() }
            ]);
        }
    };

    if (!permission) {
        return (
            <View style={styles.container}>
                <MaterialIcons name="camera-alt" size={64} color={Colors.textSecondary} />
                <Text style={styles.permissionText}>Demande de permission caméra...</Text>
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <MaterialIcons name="no-photography" size={64} color={Colors.error} />
                <Text style={styles.permissionText}>Permission caméra refusée</Text>
                <TouchableOpacity style={styles.retryButton} onPress={requestPermission}>
                    <Text style={styles.retryText}>Autoriser la caméra</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                ref={cameraRef}
                style={styles.camera}
                facing="front"
                onFacesDetected={handleFacesDetected}
                faceDetectorSettings={{
                    mode: FaceDetector.FaceDetectorMode.fast,
                    detectLandmarks: FaceDetector.FaceDetectorLandmarks.none,
                    runClassifications: FaceDetector.FaceDetectorClassifications.all,
                    minDetectionInterval: 100,
                    tracking: true,
                }}
            />
            <View style={styles.overlay}>
                {/* Face Frame */}
                <Animated.View
                    style={[
                        styles.frame,
                        faceDetected && styles.frameDetected,
                        { transform: [{ scale: pulseAnim }] }
                    ]}
                />

                {/* Status Indicator */}
                <View style={styles.statusContainer}>
                    <View style={[
                        styles.statusDot,
                        faceDetected ? styles.statusDotSuccess : styles.statusDotWarning
                    ]} />
                    <Text style={styles.statusText}>
                        {faceDetected ? 'Visage détecté' : 'Recherche du visage...'}
                    </Text>
                </View>

                {/* Instructions */}
                <Text style={styles.instructions}>
                    {isCheckOut ? 'Check-out' : 'Check-in'} - Reconnaissance Faciale
                </Text>

                <Text style={styles.hint}>
                    {faceDetected
                        ? `Restez immobile... ${countdown}s`
                        : 'Positionnez votre visage dans le cadre\nGardez les yeux ouverts'
                    }
                </Text>

                {/* Progress Indicator */}
                {faceDetected && !capturing && (
                    <View style={styles.progressContainer}>
                        <View style={[styles.progressBar, { width: `${((3 - countdown) / 3) * 100}%` }]} />
                    </View>
                )}

                {/* Loading Indicator */}
                {capturing && (
                    <View style={styles.captureIndicator}>
                        <MaterialIcons name="face" size={48} color={Colors.success} />
                        <Text style={styles.captureText}>Traitement en cours...</Text>
                    </View>
                )}

                {/* Cancel Button */}
                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => navigation.goBack()}
                >
                    <MaterialIcons name="close" size={24} color={Colors.surface} />
                    <Text style={styles.cancelText}>Annuler</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.text,
        justifyContent: 'center',
        alignItems: 'center',
    },
    camera: {
        flex: 1,
        width: '100%',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    frame: {
        width: 260,
        height: 320,
        borderRadius: 130,
        borderWidth: 4,
        borderColor: Colors.warning,
        borderStyle: 'dashed',
    },
    frameDetected: {
        borderColor: Colors.success,
        borderStyle: 'solid',
        borderWidth: 5,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: Spacing.lg,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.xl,
    },
    statusDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: Spacing.sm,
    },
    statusDotSuccess: {
        backgroundColor: Colors.success,
    },
    statusDotWarning: {
        backgroundColor: Colors.warning,
    },
    statusText: {
        color: Colors.surface,
        fontSize: FontSizes.md,
        fontWeight: '600',
    },
    instructions: {
        marginTop: Spacing.xl,
        fontSize: FontSizes.xl,
        color: Colors.surface,
        textAlign: 'center',
        fontWeight: 'bold',
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
    },
    hint: {
        marginTop: Spacing.md,
        fontSize: FontSizes.md,
        color: Colors.surface,
        textAlign: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: Spacing.sm,
        borderRadius: BorderRadius.md,
        lineHeight: 22,
    },
    progressContainer: {
        width: 200,
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 3,
        marginTop: Spacing.lg,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: Colors.success,
        borderRadius: 3,
    },
    captureIndicator: {
        marginTop: Spacing.xl,
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
    },
    captureText: {
        color: Colors.surface,
        fontSize: FontSizes.md,
        marginTop: Spacing.sm,
    },
    cancelButton: {
        position: 'absolute',
        bottom: Spacing.xl * 2,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.9)',
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.xl,
    },
    cancelText: {
        color: Colors.surface,
        fontSize: FontSizes.lg,
        fontWeight: 'bold',
        marginLeft: Spacing.sm,
    },
    permissionText: {
        fontSize: FontSizes.lg,
        color: Colors.textSecondary,
        textAlign: 'center',
        margin: Spacing.xl,
    },
    retryButton: {
        backgroundColor: Colors.primary,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        marginHorizontal: Spacing.xl,
    },
    retryText: {
        color: Colors.surface,
        fontSize: FontSizes.md,
        fontWeight: '600',
        textAlign: 'center',
    },
});

export default CheckInCameraScreen;
