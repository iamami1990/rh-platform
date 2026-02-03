import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '../styles/theme';
import { formatDate, formatTime, getStatusColor, getStatusLabel } from '../utils/helpers';

const AttendanceCard = ({ attendance }) => {
    const statusColor = getStatusColor(attendance.status);
    const statusLabel = getStatusLabel(attendance.status);

    return (
        <View style={[styles.container, Shadows.md]}>
            <View style={styles.header}>
                <Text style={styles.date}>{formatDate(attendance.date)}</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                    <Text style={styles.statusText}>{statusLabel}</Text>
                </View>
            </View>

            <View style={styles.row}>
                <View style={styles.timeItem}>
                    <MaterialIcons name="login" size={18} color={Colors.success} />
                    <Text style={styles.timeLabel}>Arrivée</Text>
                    <Text style={styles.timeValue}>
                        {formatTime(attendance.check_in_time)}
                    </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.timeItem}>
                    <MaterialIcons name="logout" size={18} color={Colors.error} />
                    <Text style={styles.timeLabel}>Départ</Text>
                    <Text style={styles.timeValue}>
                        {attendance.check_out_time ? formatTime(attendance.check_out_time) : '-'}
                    </Text>
                </View>
            </View>

            {attendance.delay_minutes > 0 && (
                <View style={styles.delaySection}>
                    <MaterialIcons name="access-time" size={16} color={Colors.warning} />
                    <Text style={styles.delayText}>
                        Retard: {attendance.delay_minutes} minutes
                    </Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        marginBottom: Spacing.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    date: {
        fontSize: FontSizes.lg,
        fontWeight: '600',
        color: Colors.text,
    },
    statusBadge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.sm,
    },
    statusText: {
        color: Colors.surface,
        fontSize: FontSizes.sm,
        fontWeight: '600',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    timeItem: {
        flex: 1,
        alignItems: 'center',
    },
    timeLabel: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
        marginTop: Spacing.xs,
    },
    timeValue: {
        fontSize: FontSizes.lg,
        fontWeight: '600',
        color: Colors.text,
        marginTop: Spacing.xs,
    },
    divider: {
        width: 1,
        backgroundColor: Colors.divider,
        marginHorizontal: Spacing.md,
    },
    delaySection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: Spacing.md,
        paddingTop: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: Colors.divider,
    },
    delayText: {
        marginLeft: Spacing.xs,
        fontSize: FontSizes.sm,
        color: Colors.warning,
        fontWeight: '500',
    },
});

export default AttendanceCard;
