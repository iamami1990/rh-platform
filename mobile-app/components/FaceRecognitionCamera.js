import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { RNCamera } from 'react-native-camera';

/**
 * Facial Recognition Camera Component
 * 
 * This component handles facial recognition for check-in/check-out
 * 
 * TODO: Implement actual ML model training and integration
 * - Train face recognition model with employee photos
 * - Implement liveness detection to prevent photo spoofing
 * - Add face matching algorithm
 * - Store face embeddings securely
 */

const FaceRecognitionCamera = ({ onCapture, onClose }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [faceDetected, setFaceDetected] = useState(false);
    const cameraRef = useRef(null);

    const handleFacesDetected = ({ faces }) => {
        if (faces.length > 0) {
            setFaceDetected(true);
            // Face detected - ready to capture
        } else {
            setFaceDetected(false);
        }
    };

    const captureFace = async () => {
        if (!cameraRef.current || isProcessing) return;

        setIsProcessing(true);

        try {
            const options = {
                quality: 0.8,
                base64: true,
                width: 300,
                fixOrientation: true,
            };

            const data = await cameraRef.current.takePictureAsync(options);

            // TODO: Send to backend for face recognition
            // const result = await verifyFace(data.base64);

            // For now, simulate successful recognition
            setTimeout(() => {
                onCapture({
                    success: true,
                    image: data.uri,
                    confidence: 0.95,
                    // employee_id: result.employee_id
                });
                setIsProcessing(false);
            }, 1500);

        } catch (error) {
            console.error('Capture error:', error);
            Alert.alert('Erreur', 'Échec de la capture. Réessayez.');
            setIsProcessing(false);
        }
    };

    return (
        <View style={styles.container}>
            <RNCamera
                ref={cameraRef}
                style={styles.camera}
                type={RNCamera.Constants.Type.front}
                onFacesDetected={handleFacesDetected}
                faceDetectionMode={RNCamera.Constants.FaceDetection.Mode.accurate}
                faceDetectionLandmarks={RNCamera.Constants.FaceDetection.Landmarks.all}
                faceDetectionClassifications={RNCamera.Constants.FaceDetection.Classifications.all}
                captureAudio={false}
            >
                {/* Overlay */}
                <View style={styles.overlay}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Text style={styles.closeText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Face frame */}
                    <View style={styles.faceFrame}>
                        <View style={[styles.corner, styles.topLeft]} />
                        <View style={[styles.corner, styles.topRight]} />
                        <View style={[styles.corner, styles.bottomLeft]} />
                        <View style={[styles.corner, styles.bottomRight]} />
                    </View>

                    {/* Instructions */}
                    <View style={styles.instructions}>
                        <Text style={styles.instructionText}>
                            {faceDetected
                                ? '✓ Visage détecté'
                                : 'Positionnez votre visage dans le cadre'}
                        </Text>
                    </View>

                    {/* Capture button */}
                    <View style={styles.controls}>
                        {isProcessing ? (
                            <ActivityIndicator size="large" color="#fff" />
                        ) : (
                            <TouchableOpacity
                                style={[styles.captureButton, !faceDetected && styles.captureButtonDisabled]}
                                onPress={captureFace}
                                disabled={!faceDetected}
                            >
                                <View style={styles.captureButtonInner} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </RNCamera>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    camera: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 20,
        paddingTop: 50,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    faceFrame: {
        width: 250,
        height: 300,
        alignSelf: 'center',
        marginTop: 50,
        position: 'relative',
    },
    corner: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderColor: '#4caf50',
        borderWidth: 3,
    },
    topLeft: {
        top: 0,
        left: 0,
        borderBottomWidth: 0,
        borderRightWidth: 0,
    },
    topRight: {
        top: 0,
        right: 0,
        borderBottomWidth: 0,
        borderLeftWidth: 0,
    },
    bottomLeft: {
        bottom: 0,
        left: 0,
        borderTopWidth: 0,
        borderRightWidth: 0,
    },
    bottomRight: {
        bottom: 0,
        right: 0,
        borderTopWidth: 0,
        borderLeftWidth: 0,
    },
    instructions: {
        marginTop: 30,
        paddingHorizontal: 40,
    },
    instructionText: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
        fontWeight: '600',
    },
    controls: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    captureButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureButtonDisabled: {
        opacity: 0.5,
    },
    captureButtonInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#fff',
    },
});

export default FaceRecognitionCamera;
