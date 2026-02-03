import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '../styles/theme';
import LoadingSpinner from '../components/LoadingSpinner';
import { payrollAPI } from '../services/api';
import { formatCurrency } from '../utils/helpers';

const PayrollScreen = () => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [payrolls, setPayrolls] = useState([]);
    const [selectedPayroll, setSelectedPayroll] = useState(null);

    useEffect(() => {
        fetchPayrolls();
    }, []);

    const fetchPayrolls = async () => {
        try {
            const response = await payrollAPI.getMyPayrolls();
            if (response.data.success) {
                setPayrolls(response.data.payrolls || []);
            }
        } catch (error) {
            console.error('Failed to fetch payrolls:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchPayrolls();
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (selectedPayroll) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => setSelectedPayroll(null)}>
                        <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Bulletin de Paie</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView style={styles.content}>
                    <View style={[styles.card, Shadows.md]}>
                        <Text style={styles.month}>{selectedPayroll.month}</Text>

                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Salaire de base:</Text>
                            <Text style={styles.detailValue}>
                                {formatCurrency(selectedPayroll.base_salary)}
                            </Text>
                        </View>

                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Primes:</Text>
                            <Text style={styles.detailValue}>
                                {formatCurrency(selectedPayroll.bonuses || 0)}
                            </Text>
                        </View>

                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Déductions:</Text>
                            <Text style={[styles.detailValue, { color: Colors.error }]}>
                                -{formatCurrency(selectedPayroll.deductions || 0)}
                            </Text>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.detailRow}>
                            <Text style={styles.netLabel}>Salaire Net:</Text>
                            <Text style={styles.netValue}>
                                {formatCurrency(selectedPayroll.net_salary)}
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <Text style={styles.title}>Bulletins de Paie</Text>

                {payrolls.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>Aucun bulletin de paie disponible</Text>
                    </View>
                ) : (
                    payrolls.map((payroll, index) => (
                        <TouchableOpacity
                            key={payroll.payroll_id || index}
                            style={[styles.payrollCard, Shadows.md]}
                            onPress={() => setSelectedPayroll(payroll)}
                        >
                            <View style={styles.payrollHeader}>
                                <MaterialIcons name="receipt" size={24} color={Colors.primary} />
                                <Text style={styles.payrollMonth}>{payroll.month}</Text>
                            </View>
                            <View style={styles.payrollAmount}>
                                <Text style={styles.amountLabel}>Net:</Text>
                                <Text style={styles.amountValue}>
                                    {formatCurrency(payroll.net_salary)}
                                </Text>
                            </View>
                            <MaterialIcons name="chevron-right" size={24} color={Colors.textSecondary} />
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.md,
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
    },
    headerTitle: {
        fontSize: FontSizes.xl,
        fontWeight: '600',
        color: Colors.text,
    },
    content: {
        flex: 1,
        padding: Spacing.md,
    },
    title: {
        fontSize: FontSizes.xxl,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: Spacing.lg,
    },
    payrollCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        marginBottom: Spacing.md,
    },
    payrollHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    payrollMonth: {
        fontSize: FontSizes.lg,
        fontWeight: '600',
        color: Colors.text,
        marginLeft: Spacing.md,
    },
    payrollAmount: {
        alignItems: 'flex-end',
        marginRight: Spacing.md,
    },
    amountLabel: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
    },
    amountValue: {
        fontSize: FontSizes.lg,
        fontWeight: 'bold',
        color: Colors.success,
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
    },
    month: {
        fontSize: FontSizes.xxl,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: Spacing.lg,
        textAlign: 'center',
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: Spacing.md,
    },
    detailLabel: {
        fontSize: FontSizes.md,
        color: Colors.textSecondary,
    },
    detailValue: {
        fontSize: FontSizes.md,
        fontWeight: '600',
        color: Colors.text,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.divider,
        marginVertical: Spacing.md,
    },
    netLabel: {
        fontSize: FontSizes.lg,
        fontWeight: 'bold',
        color: Colors.text,
    },
    netValue: {
        fontSize: FontSizes.xl,
        fontWeight: 'bold',
        color: Colors.success,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: Spacing.xl * 2,
    },
    emptyText: {
        fontSize: FontSizes.lg,
        color: Colors.textSecondary,
    },
});

export default PayrollScreen;
