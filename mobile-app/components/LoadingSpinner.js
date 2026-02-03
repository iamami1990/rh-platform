import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '../styles/theme';

const LoadingSpinner = ({ size = 'large', color = Colors.primary }) => {
    return (
        <View style={styles.container}>
            <ActivityIndicator size={size} color={color} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
    },
});

export default LoadingSpinner;
