import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '../styles/theme';
import { formatDate, getStatusColor, getStatusLabel } from '../utils/helpers';

const LeaveRequestCard = ({ leave }) => {
    const statusColor = getStatusColor(leave.status);
    const statusLabel = getStatusLabel(leave.status);
    const leaveTypeLabel = getStatusLabel(leave.leave_type);

    return (
        <View style={[styles.container, Shadows.md]}>
            <View style={styles.header}>
                <View style={styles.typeContainer}>
                    <MaterialIcons name="event" size={20} color={Colors.primary} />
                    <Text style={styles.typeText}>{leaveTypeLabel}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                    <Text style={styles.statusText}>{statusLabel}</Text>
                </View>
            </View>

            <View style={styles.dateRow}>
                <View style={styles.dateItem}>
                    <Text style={styles.dateLabel}>Début</Text>
                    <Text style={styles.dateValue}>{formatDate(leave.start_date)}</Text>
                </View>
                <MaterialIcons name="arrow-forward" size={20} color={Colors.textSecondary} />
                <View style={styles.dateItem}>
                    <Text style={styles.dateLabel}>Fin</Text>
                    <Text style={styles.dateValue}>{formatDate(leave.end_date)}</Text>
                </View>
            </View>

            <View style={styles.daysContainer}>
                <MaterialIcons name="today" size={16} color={Colors.primary} />
                <Text style={styles.daysText}>
                    {leave.days_requested} jour{leave.days_requested > 1 ? 's' : ''}
                </Text>
            </View>

            {leave.reason && (
                <View style={styles.reasonContainer}>
                    <Text style={styles.reasonLabel}>Raison:</Text>
                    <Text style={styles.reasonText}>{leave.reason}</Text>
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
    typeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    typeText: {
        marginLeft: Spacing.xs,
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
    dateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    dateItem: {
        flex: 1,
    },
    dateLabel: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
        marginBottom: Spacing.xs,
    },
    dateValue: {
        fontSize: FontSizes.md,
        fontWeight: '600',
        color: Colors.text,
    },
    daysContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.md,
        marginBottom: Spacing.sm,
    },
    daysText: {
        marginLeft: Spacing.xs,
        fontSize: FontSizes.md,
        fontWeight: '600',
        color: Colors.primary,
    },
    reasonContainer: {
        marginTop: Spacing.sm,
        paddingTop: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: Colors.divider,
    },
    reasonLabel: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
        marginBottom: Spacing.xs,
    },
    reasonText: {
        fontSize: FontSizes.md,
        color: Colors.text,
        fontStyle: 'italic',
    },
});

export default LeaveRequestCard;
