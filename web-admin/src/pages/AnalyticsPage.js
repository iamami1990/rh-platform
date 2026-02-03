import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    CircularProgress,
    Tab,
    Tabs,
    Alert,
    LinearProgress,
    Stack,
} from '@mui/material';
import { TrendingUp, TrendingDown, TrendingFlat, Warning, CheckCircle, Assessment, PieChart, Insights, Groups } from '@mui/icons-material';
import { analyticsAPI } from '../services/api';
import GlassPaper from '../components/GlassPaper';
import ModernStatCard from '../components/ModernStatCard';

const AnalyticsPage = () => {
    const [loading, setLoading] = useState(true);
    const [tabValue, setTabValue] = useState(0);
    const [behavioralPatterns, setBehavioralPatterns] = useState(null);
    const [turnoverPredictions, setTurnoverPredictions] = useState([]);
    const [productivity, setProductivity] = useState({
        overall_punctuality: 0,
        late_percentage: 0,
        absent_percentage: 0,
        productivity_index: 0
    });
    const [teamDynamics, setTeamDynamics] = useState(null);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const [patterns, turnover, prod, team] = await Promise.all([
                analyticsAPI.getBehavioralPatterns(),
                analyticsAPI.getTurnoverPrediction(),
                analyticsAPI.getProductivityInsights(),
                analyticsAPI.getTeamDynamics(),
            ]);

            setBehavioralPatterns(patterns.data.patterns);
            setTurnoverPredictions(turnover.data.predictions || []);
            setProductivity({
                overall_punctuality: patterns.data.patterns?.productivity_trends?.[0]?.punctuality_rate || 0,
                late_percentage: prod.data.productivity?.late_percentage || 0,
                absent_percentage: prod.data.productivity?.absent_percentage || 0,
                productivity_index: prod.data.productivity?.productivity_index || 0
            });
            setTeamDynamics(team.data.dynamics);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                <CircularProgress color="primary" thickness={5} size={60} />
            </Box>
        );
    }

    return (
        <Box sx={{ animation: 'fadeIn 0.5s ease-in' }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight="800" color="text.primary">
                    📊 Analytics Stratégique
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Prévisions et insights prédictifs pour le pilotage RH
                </Typography>
            </Box>

            {/* Tabs */}
            <GlassPaper sx={{ p: 0, mb: 4, overflow: 'hidden' }}>
                <Tabs
                    value={tabValue}
                    onChange={(e, v) => setTabValue(v)}
                    variant="fullWidth"
                    sx={{
                        '& .MuiTab-root': { fontWeight: 700, py: 2 },
                        '& .Mui-selected': { color: 'primary.main' }
                    }}
                >
                    <Tab icon={<Assessment />} label="Performance" />
                    <Tab icon={<PieChart />} label="Turnover (IA)" />
                    <Tab icon={<Insights />} label="Productivité" />
                    <Tab icon={<Groups />} label="Équipes" />
                </Tabs>
            </GlassPaper>

            {/* Tab 0: Overview */}
            {tabValue === 0 && behavioralPatterns && (
                <Grid container spacing={3}>
                    <Grid item xs={12} sm={4}>
                        <ModernStatCard
                            title="Top Talents"
                            value={behavioralPatterns.attendance_clusters?.high_performers?.length || 0}
                            icon={<TrendingUp />}
                            color="success"
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <ModernStatCard
                            title="Attention Requise"
                            value={behavioralPatterns.attendance_clusters?.at_risk?.length || 0}
                            icon={<Warning />}
                            color="error"
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <ModernStatCard
                            title="Standards"
                            value={behavioralPatterns.attendance_clusters?.average_performers?.length || 0}
                            icon={<TrendingFlat />}
                            color="primary"
                        />
                    </Grid>
                    {behavioralPatterns.anomalies?.length > 0 && (
                        <Grid item xs={12}>
                            <Alert severity="warning" variant="outlined" sx={{ borderRadius: 3, border: '1px solid rgba(255, 152, 0, 0.4)', bgcolor: 'rgba(255, 152, 0, 0.05)' }}>
                                <Typography fontWeight="800">Anomalies Comportementales Détectées</Typography>
                                {behavioralPatterns.anomalies.length} schémas atypiques ont été identifiés dans les derniers logs de présence.
                            </Alert>
                        </Grid>
                    )}
                </Grid>
            )}

            {/* Tab 1: Turnover Prediction */}
            {tabValue === 1 && (
                <Box>
                    <TableContainer component={GlassPaper} sx={{ p: 0, overflow: 'hidden' }}>
                        <Box p={2.5} sx={{ bgcolor: 'rgba(244, 67, 54, 0.04)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Warning color="error" />
                            <Typography variant="h6" fontWeight="800" color="error.dark">Algorithme de Prédiction Turnover</Typography>
                        </Box>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700 }}>Risque Calculé</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Niveau</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Critères Déterminants</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Plan de Rétention (IA)</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {turnoverPredictions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center" sx={{ py: 10 }}>
                                            <CheckCircle color="success" sx={{ fontSize: 50, mb: 1.5, opacity: 0.8 }} />
                                            <Typography variant="h6" fontWeight="700" color="success.main">Stabilité Maximale</Typography>
                                            <Typography color="text.secondary">Aucun départ imminent n'est prédit par l'IA.</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    turnoverPredictions.map((pred, index) => (
                                        <TableRow key={index} hover>
                                            <TableCell>
                                                <Typography variant="h6" fontWeight="800" color={pred.risk_score > 70 ? 'error.main' : 'warning.main'}>
                                                    {pred.risk_score.toFixed(1)}%
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={pred.risk_level.toUpperCase()} color={pred.risk_level === 'high' ? 'error' : 'warning'} size="small" sx={{ fontWeight: 900 }} />
                                            </TableCell>
                                            <TableCell>
                                                <Box display="flex" flexWrap="wrap" gap={0.5}>
                                                    {pred.key_factors.map((f, i) => (
                                                        <Chip key={i} label={f} variant="outlined" size="small" sx={{ fontSize: '0.7rem' }} />
                                                    ))}
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                                                    {pred.recommended_actions[0]}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}

            {/* Tab 2: Productivity */}
            {tabValue === 2 && productivity && (
                <Grid container spacing={3}>
                    <Grid item xs={12} sm={3}>
                        <ModernStatCard title="Ponctualité" value={`${productivity.overall_punctuality}%`} icon={<TrendingUp />} color="success" />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <ModernStatCard title="Retards" value={`${productivity.late_percentage}%`} icon={<TrendingDown />} color="warning" />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <ModernStatCard title="Absentéisme" value={`${productivity.absent_percentage}%`} icon={<Warning />} color="error" />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <ModernStatCard title="Productivity Index" value={productivity.productivity_index} icon={<Insights />} color="primary" />
                    </Grid>
                </Grid>
            )}

            {/* Tab 3: Team Dynamics */}
            {tabValue === 3 && teamDynamics && (
                <Grid container spacing={4}>
                    <Grid item xs={12} md={7}>
                        <TableContainer component={GlassPaper} sx={{ p: 0, overflow: 'hidden' }}>
                            <Box p={2.5} sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                                <Typography variant="h6" fontWeight="800">Équilibres par Département</Typography>
                            </Box>
                            <Box p={3}>
                                {Object.entries(teamDynamics.department_distribution || {}).map(([dept, count]) => {
                                    const total = Object.values(teamDynamics.department_distribution).reduce((a, b) => a + b, 0);
                                    const percent = (count / total) * 100;
                                    return (
                                        <Box key={dept} mb={3}>
                                            <Box display="flex" justifyContent="space-between" mb={1}>
                                                <Typography variant="body2" fontWeight="700">{dept}</Typography>
                                                <Typography variant="body2" color="text.secondary">{count} personnes ({percent.toFixed(0)}%)</Typography>
                                            </Box>
                                            <LinearProgress variant="determinate" value={percent} sx={{ height: 8, borderRadius: 10, bgcolor: 'rgba(0,0,0,0.05)' }} />
                                        </Box>
                                    );
                                })}
                            </Box>
                        </TableContainer>
                    </Grid>
                    <Grid item xs={12} md={5}>
                        <Stack spacing={3}>
                            <GlassPaper sx={{ p: 3, bgcolor: 'primary.main', color: 'white' }}>
                                <Typography variant="h6" fontWeight="700" gutterBottom>Ancienneté Moyenne</Typography>
                                <Typography variant="h3" fontWeight="900" sx={{ opacity: 0.95 }}>{teamDynamics.avg_tenure_months} <Typography component="span" variant="h6">mois</Typography></Typography>
                                <Typography variant="caption" sx={{ opacity: 0.7 }}>Engagement à long terme</Typography>
                            </GlassPaper>
                            <GlassPaper sx={{ p: 3, bgcolor: 'secondary.main', color: 'white' }}>
                                <Typography variant="h6" fontWeight="700" gutterBottom>Index Diversité</Typography>
                                <Typography variant="h3" fontWeight="900" sx={{ opacity: 0.95 }}>{teamDynamics.diversity_score}%</Typography>
                                <Typography variant="caption" sx={{ opacity: 0.7 }}>Inclusivité et parité</Typography>
                            </GlassPaper>
                        </Stack>
                    </Grid>
                </Grid>
            )}
        </Box>
    );
};

export default AnalyticsPage;

