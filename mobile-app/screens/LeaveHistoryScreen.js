import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSizes } from '../styles/theme';
import LoadingSpinner from '../components/LoadingSpinner';
import LeaveRequestCard from '../components/LeaveRequestCard';
import { leavesAPI } from '../services/api';

const LeaveHistoryScreen = () => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [leaves, setLeaves] = useState([]);

    useEffect(() => {
        fetchLeaves();
    }, []);

    const fetchLeaves = async () => {
        try {
            const response = await leavesAPI.getMyLeaves();
            if (response.data.success) {
                setLeaves(response.data.leaves || []);
            }
        } catch (error) {
            console.error('Failed to fetch leaves:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchLeaves();
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
                <Text style={styles.title}>Historique des Congés</Text>

                {leaves.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>Aucune demande de congé</Text>
                    </View>
                ) : (
                    leaves.map((leave, index) => (
                        <LeaveRequestCard key={leave.leave_id || index} leave={leave} />
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

export default LeaveHistoryScreen;
