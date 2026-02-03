import React, { useEffect, useState } from 'react';
import {
    Box,
    Grid,
    Typography,
    CircularProgress,
    useTheme,
    Avatar,
    Chip,
} from '@mui/material';
import {
    People,
    EventAvailable,
    AttachMoney,
    Psychology,
    NotificationsActive,
    Warning,
} from '@mui/icons-material';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as ChartTooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts';
import { dashboardAPI, sentimentAPI } from '../services/api';
import ModernStatCard from '../components/ModernStatCard';
import GlassPaper from '../components/GlassPaper';

const DashboardPage = () => {
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [dashResponse, alertsResponse] = await Promise.all([
                dashboardAPI.getAdmin(),
                sentimentAPI.getAlerts({ limit: 5 })
            ]);
            setDashboardData(dashResponse.data.dashboard);
            setAlerts(alertsResponse.data.alerts || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    };


    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress color="primary" />
            </Box>
        );
    }

    if (error) {
        return (
            <GlassPaper sx={{ p: 3, border: '1px solid', borderColor: 'error.light' }}>
                <Typography color="error" fontWeight="700">⚠️ {error}</Typography>
            </GlassPaper>
        );
    }

    const { employees, attendance, payroll, sentiment } = dashboardData || {};

    // Mock data for charts if backend doesn't provide it yet
    const attendanceHistory = [
        { date: '01/12', rate: 95 },
        { date: '05/12', rate: 88 },
        { date: '10/12', rate: 92 },
        { date: '15/12', rate: 98 },
        { date: '20/12', rate: 85 },
        { date: '25/12', rate: 94 },
    ];

    const departmentData = [
        { name: 'IT', value: 30 },
        { name: 'RH', value: 10 },
        { name: 'Finance', value: 15 },
        { name: 'Ops', value: 45 },
    ];

    const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981'];

    return (
        <Box sx={{ animation: 'fadeIn 0.5s ease-in' }}>
            {/* Header */}
            <Box mb={4}>
                <Typography variant="h4" fontWeight="900" sx={{ letterSpacing: '-0.5px' }}>
                    👋 Bonjour, Admin
                </Typography>
                <Typography variant="body1" color="text.secondary" fontWeight="500">
                    Voici ce qui se passe sur votre plateforme aujourd'hui
                </Typography>
            </Box>

            {/* KPI Cards */}
            <Grid container spacing={3} mb={4}>
                <Grid item xs={12} sm={6} md={3}>
                    <ModernStatCard
                        title="Employés Totaux"
                        value={employees?.total || 0}
                        icon={<People />}
                        color="primary"
                        trend="+12%"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <ModernStatCard
                        title="Taux de Présence"
                        value={`${attendance?.today?.rate || 0}%`}
                        icon={<EventAvailable />}
                        color="success"
                        trend="+2.4%"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <ModernStatCard
                        title="Masse Salariale"
                        value={`${(payroll?.total_mass || 0).toLocaleString()} TND`}
                        icon={<AttachMoney />}
                        color="warning"
                        trend="-1.5%"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <ModernStatCard
                        title="Score Sentiment"
                        value={`${sentiment?.average_score || 0}/100`}
                        icon={<Psychology />}
                        color="secondary"
                        trend="+5 pts"
                    />
                </Grid>
            </Grid>

            {/* Charts Section */}
            <Grid container spacing={3}>
                <Grid item xs={12} lg={8}>
                    <GlassPaper sx={{ p: 4, height: '450px' }}>
                        <Typography variant="h6" fontWeight="800" mb={3}>
                            Tendance de Présence (%)
                        </Typography>
                        <ResponsiveContainer width="100%" height="80%">
                            <AreaChart data={attendanceHistory}>
                                <defs>
                                    <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} />
                                <ChartTooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="rate"
                                    stroke={theme.palette.primary.main}
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorRate)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </GlassPaper>
                </Grid>

                <Grid item xs={12} lg={4}>
                    <GlassPaper sx={{ p: 4, height: '450px' }}>
                        <Typography variant="h6" fontWeight="800" mb={3}>
                            Répartition par Département
                        </Typography>
                        <ResponsiveContainer width="100%" height="80%">
                            <PieChart>
                                <Pie
                                    data={departmentData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {departmentData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <ChartTooltip />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </GlassPaper>
                </Grid>

                {/* AI Risk Alerts Section */}
                <Grid item xs={12}>
                    <GlassPaper sx={{ p: 4 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                            <Box display="flex" alignItems="center" gap={1.5}>
                                <Avatar sx={{ bgcolor: 'error.light', color: 'error.main' }}>
                                    <NotificationsActive />
                                </Avatar>
                                <Box>
                                    <Typography variant="h6" fontWeight="800">Alertes de Risque IA</Typography>
                                    <Typography variant="body2" color="text.secondary">Détection préventive des comportements à risque</Typography>
                                </Box>
                            </Box>
                            <Chip
                                label={`${alerts.length} Alertes`}
                                color="error"
                                variant="filled"
                                sx={{ fontWeight: 700, borderRadius: '8px' }}
                            />
                        </Box>

                        {alerts.length === 0 ? (
                            <Typography textAlign="center" py={4} color="text.secondary">
                                ✅ Aucun risque critique détecté ce mois-ci.
                            </Typography>
                        ) : (
                            <Grid container spacing={2}>
                                {alerts.map((alert, idx) => (
                                    <Grid item xs={12} md={6} key={idx}>
                                        <Box sx={{
                                            p: 2,
                                            border: '1px solid rgba(244, 67, 54, 0.2)',
                                            borderRadius: 3,
                                            bgcolor: 'rgba(244, 67, 54, 0.02)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 2
                                        }}>
                                            <Warning color="error" />
                                            <Box>
                                                <Typography variant="subtitle2" fontWeight="700">
                                                    Salarié ID: {alert.employee_id}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Score de sentiment critique: {alert.overall_score}/100 - {alert.recommendations}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Grid>
                                ))}
                            </Grid>
                        )}
                    </GlassPaper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default DashboardPage;

