import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '../styles/theme';
import ActionButton from '../components/ActionButton';
import { LEAVE_TYPES } from '../utils/constants';
import { formatDate, calculateDaysBetween } from '../utils/helpers';

const KioskLeaveScreen = ({ navigation }) => {
    const [leaveType, setLeaveType] = useState('annual');
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [reason, setReason] = useState('');
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    const daysRequested = calculateDaysBetween(startDate, endDate);

    const handleContinue = () => {
        navigation.navigate('KioskVerify', {
            action: 'leave',
            leavePayload: {
                leave_type: leaveType,
                start_date: startDate.toISOString().split('T')[0],
                end_date: endDate.toISOString().split('T')[0],
                reason: reason.trim(),
            },
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.content}>
                <Text style={styles.title}>Demande de conge (KIOSK)</Text>

                <View style={styles.section}>
                    <Text style={styles.label}>Type de conge</Text>
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
                                    size={22}
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
                                <MaterialIcons name="check-circle" size={22} color={Colors.primary} />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Dates</Text>
                    <TouchableOpacity style={styles.dateButton} onPress={() => setShowStartPicker(true)}>
                        <MaterialIcons name="calendar-today" size={20} color={Colors.primary} />
                        <Text style={styles.dateText}>Du : {formatDate(startDate)}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.dateButton} onPress={() => setShowEndPicker(true)}>
                        <MaterialIcons name="calendar-today" size={20} color={Colors.primary} />
                        <Text style={styles.dateText}>Au : {formatDate(endDate)}</Text>
                    </TouchableOpacity>
                    <View style={styles.daysInfo}>
                        <Text style={styles.daysText}>
                            Duree : {daysRequested} jour{daysRequested > 1 ? 's' : ''}
                        </Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Raison</Text>
                    <TextInput
                        style={styles.textArea}
                        placeholder="Motif de la demande..."
                        placeholderTextColor={Colors.textLight}
                        value={reason}
                        onChangeText={setReason}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />
                </View>

                <ActionButton
                    title="Continuer la verification"
                    onPress={handleContinue}
                    style={styles.submitButton}
                />
            </ScrollView>

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

export default KioskLeaveScreen;
