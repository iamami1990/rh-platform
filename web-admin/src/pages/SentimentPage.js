import React, { useEffect, useState } from 'react';
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
    Avatar,
    LinearProgress,
    Tooltip,
    IconButton,
} from '@mui/material';
import { SentimentSatisfied, SentimentNeutral, SentimentDissatisfied, Warning, AutoAwesome, Timeline, Insights, FileDownload } from '@mui/icons-material';
import { sentimentAPI } from '../services/api';
import GlassPaper from '../components/GlassPaper';
import ModernStatCard from '../components/ModernStatCard';

const SentimentPage = () => {
    const [sentiments, setSentiments] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [avgScore, setAvgScore] = useState(0);

    useEffect(() => {
        fetchSentiment();
    }, []);

    const fetchSentiment = async () => {
        try {
            setLoading(true);
            const response = await sentimentAPI.getAll({});
            const data = response.data.sentiments || [];
            setSentiments(data);

            const alertsResponse = await sentimentAPI.getAlerts({});
            setAlerts(alertsResponse.data.alerts || []);

            if (data.length > 0) {
                const avg = data.reduce((sum, s) => sum + s.overall_score, 0) / data.length;
                setAvgScore(avg);
            }
        } catch (error) {
            console.error('Failed to fetch sentiment:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExportReport = async (employeeId) => {
        try {
            const response = await sentimentAPI.exportReport(employeeId);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Behavioral_Report_${employeeId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Failed to export report:', error);
            alert('Erreur lors de l\'export du rapport');
        }
    };

    const getSentimentIcon = (sentiment) => {
        switch (sentiment) {
            case 'good': return <SentimentSatisfied sx={{ color: 'success.main', fontSize: 24 }} />;
            case 'neutral': return <SentimentNeutral sx={{ color: 'warning.main', fontSize: 24 }} />;
            case 'poor': return <SentimentDissatisfied sx={{ color: 'error.main', fontSize: 24 }} />;
            default: return null;
        }
    };

    const getRiskVariant = (risk) => {
        switch (risk) {
            case 'low': return { color: 'success', label: 'Faible' };
            case 'medium': return { color: 'warning', label: 'Modéré' };
            case 'high': return { color: 'error', label: 'Élevé' };
            default: return { color: 'default', label: risk };
        }
    };

    return (
        <Box sx={{ animation: 'fadeIn 0.5s ease-in' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h4" fontWeight="800" color="text.primary">
                        🤖 Analyse IA Sentiment
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Intelligence artificielle pour l'engagement et la rétention
                    </Typography>
                </Box>
                <GlassPaper sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(99, 102, 241, 0.1)' }}>
                    <AutoAwesome color="primary" />
                    <Typography variant="caption" fontWeight="700" color="primary">AI ENGINE ACTIVE</Typography>
                </GlassPaper>
            </Box>

            {/* Summary Cards */}
            <Grid container spacing={3} mb={4}>
                <Grid item xs={12} sm={6}>
                    <ModernStatCard
                        title="Score Moyen Engagement"
                        value={`${avgScore.toFixed(1)}%`}
                        icon={<Insights />}
                        color="primary"
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <ModernStatCard
                        title="Alertes Turnover"
                        value={alerts.length}
                        icon={<Warning />}
                        color="error"
                    />
                </Grid>
            </Grid>

            {/* Sentiment Detail Table */}
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                    <CircularProgress color="primary" thickness={5} size={60} />
                </Box>
            ) : (
                <TableContainer component={GlassPaper} sx={{ p: 0, overflow: 'hidden', mb: 4 }}>
                    <Box p={2.5} sx={{ bgcolor: 'rgba(99, 102, 241, 0.04)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Timeline color="primary" />
                        <Typography variant="h6" fontWeight="800">Historique des Analyses</Typography>
                    </Box>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700 }}>Période</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Score Global</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Climat</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Risque Turnover</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>KPIs (Présence / Ponct. / Assid.)</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sentiments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                                        <Typography color="text.secondary">Aucune analyse disponible pour le moment</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sentiments.map((s) => {
                                    const risk = getRiskVariant(s.risk_level);
                                    return (
                                        <TableRow key={s.sentiment_id} hover>
                                            <TableCell>
                                                <Chip label={s.month} size="small" variant="filled" sx={{ fontWeight: 700, bgcolor: 'rgba(0,0,0,0.05)' }} />
                                            </TableCell>
                                            <TableCell>
                                                <Box display="flex" alignItems="center" gap={2}>
                                                    <Typography variant="body2" fontWeight="800" sx={{ minWidth: 40 }}>
                                                        {s.overall_score}%
                                                    </Typography>
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={s.overall_score}
                                                        sx={{ width: 100, borderRadius: 5, height: 6, bgcolor: 'rgba(0,0,0,0.05)' }}
                                                        color={s.overall_score > 70 ? 'success' : s.overall_score > 40 ? 'warning' : 'error'}
                                                    />
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    {getSentimentIcon(s.sentiment)}
                                                    <Typography variant="body2" fontWeight="600" sx={{ textTransform: 'capitalize' }}>
                                                        {s.sentiment === 'good' ? 'Positif' : s.sentiment === 'neutral' ? 'Stable' : 'Négatif'}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={risk.label} color={risk.color} size="small" sx={{ fontWeight: 700 }} />
                                            </TableCell>
                                            <TableCell>
                                                <Box display="flex" gap={1}>
                                                    <Tooltip title="Présence">
                                                        <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem', bgcolor: 'primary.light' }}>{s.attendance_score}</Avatar>
                                                    </Tooltip>
                                                    <Tooltip title="Ponctualité">
                                                        <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem', bgcolor: 'warning.light' }}>{s.punctuality_score}</Avatar>
                                                    </Tooltip>
                                                    <Tooltip title="Assiduité">
                                                        <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem', bgcolor: 'error.light' }}>{s.assiduity_score}</Avatar>
                                                    </Tooltip>
                                                </Box>
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    onClick={() => handleExportReport(s.employee_id)}
                                                    sx={{ bgcolor: 'rgba(99, 102, 241, 0.08)' }}
                                                >
                                                    <FileDownload fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* AI Warning Alerts */}
            {alerts.length > 0 && (
                <GlassPaper sx={{ p: 0, overflow: 'hidden', border: '1px solid rgba(244, 67, 54, 0.3)', bgcolor: 'rgba(244, 67, 54, 0.02)' }}>
                    <Box p={2.5} sx={{ bgcolor: 'rgba(244, 67, 54, 0.1)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Warning color="error" />
                        <Typography variant="h6" fontWeight="800" color="error.dark">Intervention Requise</Typography>
                    </Box>
                    <Box p={3}>
                        <Typography variant="body2" color="text.secondary" mb={2}>
                            L'IA a détecté <strong>{alerts.length} collaborateurs</strong> présentant un risque de désengagement critique :
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={1}>
                            {alerts.map((a, i) => (
                                <Chip
                                    key={i}
                                    label={`Alerte #0${i + 1} : Score ${a.overall_score}%`}
                                    variant="outlined"
                                    color="error"
                                    sx={{ fontWeight: 700 }}
                                />
                            ))}
                        </Box>
                    </Box>
                </GlassPaper>
            )}
        </Box>
    );
};

export default SentimentPage;

