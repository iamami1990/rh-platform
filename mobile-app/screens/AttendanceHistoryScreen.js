import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSizes } from '../styles/theme';
import LoadingSpinner from '../components/LoadingSpinner';
import AttendanceCard from '../components/AttendanceCard';
import { attendanceAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const AttendanceHistoryScreen = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [attendance, setAttendance] = useState([]);

    useEffect(() => {
        fetchAttendance();
    }, []);

    const fetchAttendance = async () => {
        try {
            const response = await attendanceAPI.getHistory(user.employee_id);
            if (response.data.success) {
                setAttendance(response.data.attendance || []);
            }
        } catch (error) {
            console.error('Failed to fetch attendance:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchAttendance();
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <Text style={styles.title}>Historique de Présence</Text>

                {attendance.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>Aucun enregistrement de pointage</Text>
                    </View>
                ) : (
                    attendance.map((record, index) => (
                        <AttendanceCard key={record.attendance_id || index} attendance={record} />
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

export default AttendanceHistoryScreen;
