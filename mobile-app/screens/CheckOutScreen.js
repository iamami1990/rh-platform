import React from 'react';
import { Alert } from 'react-native';
import { attendanceAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

// Simple check-out handler component
const CheckOutScreen = ({ navigation }) => {
    const { user } = useAuth();

    React.useEffect(() => {
        handleCheckOut();
    }, []);

    const handleCheckOut = () => {
        Alert.alert(
            'Check-out',
            'Êtes-vous sûr de vouloir pointer votre départ ?',
            [
                {
                    text: 'Annuler',
                    onPress: () => navigation.goBack(),
                    style: 'cancel',
                },
                {
                    text: 'Confirmer',
                    onPress: async () => {
                        try {
                            await attendanceAPI.checkOut({ employee_id: user.employee_id });
                            Alert.alert('Succès', 'Départ enregistré', [
                                { text: 'OK', onPress: () => navigation.goBack() },
                            ]);
                        } catch (error) {
                            Alert.alert(
                                'Erreur',
                                error.response?.data?.message || 'Échec du check-out',
                                [{ text: 'OK', onPress: () => navigation.goBack() }]
                            );
                        }
                    },
                },
            ]
        );
    };

    return null;
};

export default CheckOutScreen;
