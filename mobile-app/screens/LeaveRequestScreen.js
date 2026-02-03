import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    RefreshControl,
    TouchableOpacity,
    Alert,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '../styles/theme';
import ActionButton from '../components/ActionButton';
import ErrorMessage from '../components/ErrorMessage';
import { leavesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LEAVE_TYPES } from '../utils/constants';
import { formatDate, calculateDaysBetween } from '../utils/helpers';

const LeaveRequestScreen = ({ navigation }) => {
    const { user } = useAuth();
    const [leaveType, setLeaveType] = useState('annual');
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [reason, setReason] = useState('');
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const daysRequested = calculateDaysBetween(startDate, endDate);

    const handleSubmit = async () => {
        setError('');

        if (!leaveType || !reason.trim()) {
            setError('Veuillez remplir tous les champs obligatoires');
            return;
        }

        if (daysRequested <= 0) {
            setError('La date de fin doit être après la date de début');
            return;
        }

        setLoading(true);
        try {
            await leavesAPI.request({
                employee_id: user.employee_id,
                leave_type: leaveType,
                start_date: startDate.toISOString().split('T')[0],
                end_date: endDate.toISOString().split('T')[0],
                reason: reason.trim(),
            });

            Alert.alert(
                'Succès',
                'Votre demande de congé a été soumise avec succès',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack(),
                    },
                ]
            );
        } catch (err) {
            setError(err.response?.data?.message || 'Échec de la soumission');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.content}>
                <Text style={styles.title}>Nouvelle Demande de Congé</Text>

                <ErrorMessage message={error} />

                {/* Leave Type Selection */}
                <View style={styles.section}>
                    <Text style={styles.label}>Type de congé *</Text>
                    {LEAVE_TYPES.map((type) => (
                        <TouchableOpacity
                            key={type.value}
                            style={[
                                styles.typeOption,
                                leaveType === type.value && styles.typeOptionActive,
                            ]}
                            onPress={() => setLeaveType(type.value)}
                        >
                            <View style={styles.typeContent}>
                                <MaterialIcons
                                    name={type.icon}
                                    size={24}
                                    color={leaveType === type.value ? Colors.primary : Colors.textSecondary}
                                />
                                <Text
                                    style={[
                                        styles.typeLabel,
                                        leaveType === type.value && styles.typeLabelActive,
                                    ]}
                                >
                                    {type.label}
                                </Text>
                            </View>
                            {leaveType === type.value && (
                                <MaterialIcons name="check-circle" size={24} color={Colors.primary} />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Date Selection */}
                <View style={styles.section}>
                    <Text style={styles.label}>Dates *</Text>

                    <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() => setShowStartPicker(true)}
                    >
                        <MaterialIcons name="calendar-today" size={20} color={Colors.primary} />
                        <Text style={styles.dateText}>Du : {formatDate(startDate)}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() => setShowEndPicker(true)}
                    >
                        <MaterialIcons name="calendar-today" size={20} color={Colors.primary} />
                        <Text style={styles.dateText}>Au : {formatDate(endDate)}</Text>
                    </TouchableOpacity>

                    <View style={styles.daysInfo}>
                        <Text style={styles.daysText}>
                            Durée : {daysRequested} jour{daysRequested > 1 ? 's' : ''}
                        </Text>
                    </View>
                </View>

                {/* Reason */}
                <View style={styles.section}>
                    <Text style={styles.label}>Raison *</Text>
                    <TextInput
                        style={styles.textArea}
                        placeholder="Expliquez brièvement la raison de votre demande..."
                        placeholderTextColor={Colors.textLight}
                        value={reason}
                        onChangeText={setReason}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />
                </View>

                {/* Submit Button */}
                <ActionButton
                    title="Soumettre la Demande"
                    onPress={handleSubmit}
                    loading={loading}
                    style={styles.submitButton}
                />
            </ScrollView>

            {/* Date Pickers */}
            {showStartPicker && (
                <DateTimePicker
                    value={startDate}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                        setShowStartPicker(false);
                        if (selectedDate) {
                            setStartDate(selectedDate);
                            if (selectedDate > endDate) {
                                setEndDate(selectedDate);
                            }
                        }
                    }}
                />
            )}

            {showEndPicker && (
                <DateTimePicker
                    value={endDate}
                    mode="date"
                    display="default"
                    minimumDate={startDate}
                    onChange={(event, selectedDate) => {
                        setShowEndPicker(false);
                        if (selectedDate) {
                            setEndDate(selectedDate);
                        }
                    }}
                />
            )}
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
        padding: Spacing.lg,
    },
    title: {
        fontSize: FontSizes.xxl,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: Spacing.lg,
    },
    section: {
        marginBottom: Spacing.xl,
    },
    label: {
        fontSize: FontSizes.lg,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: Spacing.md,
    },
    typeOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.md,
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        marginBottom: Spacing.sm,
        borderWidth: 2,
        borderColor: Colors.border,
    },
    typeOptionActive: {
        borderColor: Colors.primary,
        ...Shadows.md,
    },
    typeContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    typeLabel: {
        fontSize: FontSizes.md,
        color: Colors.textSecondary,
        marginLeft: Spacing.md,
    },
    typeLabelActive: {
        color: Colors.primary,
        fontWeight: '600',
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        marginBottom: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    dateText: {
        fontSize: FontSizes.md,
        color: Colors.text,
        marginLeft: Spacing.md,
    },
    daysInfo: {
        backgroundColor: Colors.primary + '15',
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        marginTop: Spacing.sm,
    },
    daysText: {
        fontSize: FontSizes.md,
        fontWeight: '600',
        color: Colors.primary,
        textAlign: 'center',
    },
    textArea: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        fontSize: FontSizes.md,
        color: Colors.text,
        borderWidth: 1,
        borderColor: Colors.border,
        minHeight: 120,
    },
    submitButton: {
        marginTop: Spacing.md,
        marginBottom: Spacing.xl,
    },
});

export default LeaveRequestScreen;
