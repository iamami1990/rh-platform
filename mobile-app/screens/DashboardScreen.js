import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    RefreshControl,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '../styles/theme';
import StatCard from '../components/StatCard';
import ActionButton from '../components/ActionButton';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { attendanceAPI, leavesAPI, payrollAPI, sentimentAPI } from '../services/api';
import { formatCurrency } from '../utils/helpers';

const DashboardScreen = ({ navigation }) => {
    const { user, logout } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({ present: 0, lates: 0, absences: 0 });
    const [leaves, setLeaves] = useState({ available: 0, used: 0 });
    const [lastPayroll, setLastPayroll] = useState(null);
    const [sentiment, setSentiment] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [attRes, leaveRes, payrollRes, sentimentRes] = await Promise.all([
                attendanceAPI.getHistory(user?.employee_id || ''),
                leavesAPI.getBalance(user?.employee_id || ''),
                payrollAPI.getMyPayrolls(),
                sentimentAPI.getMySentiment().catch(() => ({ data: { success: false } })),
            ]);

            if (attRes.data.success) {
                const history = attRes.data.attendance || [];
                setStats({
                    present: history.filter(a => a.status === 'present' || a.status === 'late').length,
                    lates: history.filter(a => a.status === 'late').length,
                    absences: history.filter(a => a.status === 'absent').length,
                });
            }

            if (leaveRes.data.success && leaveRes.data.balance) {
                const annualBalance = leaveRes.data.balance.annual || {};
                setLeaves({
                    available: annualBalance.remaining || 0,
                    used: annualBalance.used || 0,
                });
            }

            if (payrollRes.data.success && payrollRes.data.payrolls?.length > 0) {
                setLastPayroll(payrollRes.data.payrolls[0]);
            }

            if (sentimentRes.data.success) {
                setSentiment(sentimentRes.data.sentiment);
            }
        } catch (error) {
            console.error('Dashboard data fetch failed:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchDashboardData();
    };

    const handleCheckIn = () => {
        navigation.navigate('CheckInCamera');
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Olympia HR</Text>
                    <Text style={styles.headerSubtitle}>Bonjour, {user?.email}</Text>
                </View>
                <TouchableOpacity onPress={logout}>
                    <MaterialIcons name="logout" size={24} color={Colors.surface} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Quick Actions */}
                <View style={[styles.card, Shadows.md]}>
                    <Text style={styles.cardTitle}>🕐 Pointage</Text>
                    <View style={styles.actionRow}>
                        <ActionButton
                            title="Check-in"
                            onPress={handleCheckIn}
                            variant="success"
                            style={styles.actionButton}
                        />
                        <ActionButton
                            title="Check-out"
                            onPress={() => navigation.navigate('CheckInCamera', { isCheckOut: true })}
                            variant="danger"
                            style={styles.actionButton}
                        />
                    </View>
                    <Text style={styles.cardInfo}>
                        Utilisez la reconnaissance faciale pour pointer
                    </Text>
                </View>

                {/* Stats du mois */}
                <Text style={styles.sectionTitle}>📊 Ce Mois-ci</Text>
                <View style={styles.statsRow}>
                    <StatCard icon="✅" value={stats.present} label="Jours présents" />
                    <StatCard icon="⏰" value={stats.lates} label="Retards" color={Colors.warning} />
                    <StatCard icon="❌" value={stats.absences} label="Absences" color={Colors.error} />
                </View>

                {/* Solde Congés */}
                <View style={[styles.card, Shadows.md]}>
                    <Text style={styles.cardTitle}>🏖️ Solde Congés</Text>
                    <View style={styles.statsRow}>
                        <StatCard icon="📅" value={leaves.available} label="Disponibles" />
                        <StatCard icon="📝" value={leaves.used} label="Utilisés" color={Colors.warning} />
                    </View>
                    <ActionButton
                        title="Nouvelle Demande"
                        onPress={() => navigation.navigate('LeaveRequest')}
                        variant="outline"
                        style={styles.leaveButton}
                    />
                </View>

                {/* Dernière Paie */}
                {lastPayroll && (
                    <TouchableOpacity
                        style={[styles.card, Shadows.md]}
                        onPress={() => navigation.navigate('Payroll')}
                    >
                        <Text style={styles.cardTitle}>💰 Dernière Paie</Text>
                        <View style={styles.payrollInfo}>
                            <View style={styles.payrollRow}>
                                <Text style={styles.payrollLabel}>Mois:</Text>
                                <Text style={styles.payrollValue}>{lastPayroll.month}</Text>
                            </View>
                            <View style={styles.payrollRow}>
                                <Text style={styles.payrollLabel}>Salaire Net:</Text>
                                <Text style={styles.payrollValueBold}>
                                    {formatCurrency(lastPayroll.net_salary)}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.viewButton}>
                            <Text style={styles.viewButtonText}>Voir détails</Text>
                            <MaterialIcons name="arrow-forward" size={18} color={Colors.primary} />
                        </View>
                    </TouchableOpacity>
                )}

                {/* Engagement Score */}
                {sentiment && (
                    <View style={[styles.card, Shadows.md]}>
                        <Text style={styles.cardTitle}>🤖 Score Engagement</Text>
                        <View style={styles.sentimentContainer}>
                            <Text
                                style={[
                                    styles.sentimentScore,
                                    {
                                        color:
                                            sentiment.overall_score < 50
                                                ? Colors.error
                                                : Colors.warning,
                                    },
                                ]}
                            >
                                {sentiment.overall_score}/100
                            </Text>
                            <Text style={styles.sentimentLabel}>
                                {sentiment.risk_level === 'high'
                                    ? 'Risque élevé'
                                    : 'Engagement normal'}
                            </Text>
                        </View>
                    </View>
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
        backgroundColor: Colors.primary,
        padding: Spacing.lg,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: FontSizes.xxl,
        fontWeight: 'bold',
        color: Colors.surface,
    },
    headerSubtitle: {
        fontSize: FontSizes.md,
        color: Colors.surface,
        marginTop: Spacing.xs,
        opacity: 0.9,
    },
    content: {
        flex: 1,
        padding: Spacing.md,
    },
    sectionTitle: {
        fontSize: FontSizes.xl,
        fontWeight: '600',
        color: Colors.text,
        marginVertical: Spacing.md,
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
    },
    cardTitle: {
        fontSize: FontSizes.xl,
        fontWeight: '600',
        marginBottom: Spacing.md,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.sm,
    },
    actionButton: {
        flex: 1,
        marginHorizontal: Spacing.xs,
    },
    cardInfo: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginTop: Spacing.sm,
    },
    statsRow: {
        flexDirection: 'row',
        marginBottom: Spacing.md,
    },
    leaveButton: {
        marginTop: Spacing.sm,
    },
    payrollInfo: {
        marginBottom: Spacing.md,
    },
    payrollRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.sm,
    },
    payrollLabel: {
        fontSize: FontSizes.md,
        color: Colors.textSecondary,
    },
    payrollValue: {
        fontSize: FontSizes.md,
        color: Colors.text,
    },
    payrollValueBold: {
        fontSize: FontSizes.lg,
        fontWeight: 'bold',
        color: Colors.success,
    },
    viewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: Colors.divider,
    },
    viewButtonText: {
        fontSize: FontSizes.md,
        color: Colors.primary,
        fontWeight: '600',
        marginRight: Spacing.xs,
    },
    sentimentContainer: {
        alignItems: 'center',
        paddingVertical: Spacing.lg,
    },
    sentimentScore: {
        fontSize: 48,
        fontWeight: 'bold',
        marginBottom: Spacing.sm,
    },
    sentimentLabel: {
        fontSize: FontSizes.md,
        color: Colors.textSecondary,
    },
});

export default DashboardScreen;
