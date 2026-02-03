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
    Tooltip,
} from '@mui/material';
import { CheckCircle, Cancel, Schedule, History, Person, Timer, WarningAmber } from '@mui/icons-material';
import { attendanceAPI } from '../services/api';
import { format } from '../utils/dateHelpers';
import GlassPaper from '../components/GlassPaper';
import ModernStatCard from '../components/ModernStatCard';

const AttendancePage = () => {
    const [attendance, setAttendance] = useState([]);
    const [stats, setStats] = useState({ present: 0, late: 0, absent: 0 });
    const [loading, setLoading] = useState(true);

    const fetchAttendance = async () => {
        try {
            setLoading(true);
            const today = format(new Date(), 'yyyy-MM-dd');
            const response = await attendanceAPI.getAll({ date: today });
            const records = response.data.attendance || [];

            setAttendance(records);

            // Calculate stats
            const present = records.filter(r => r.status === 'present').length;
            const late = records.filter(r => r.status === 'late').length;
            const absent = records.filter(r => r.status === 'absent').length;

            setStats({ present, late, absent });
        } catch (error) {
            console.error('Failed to fetch attendance:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendance();
    }, []);

    const getStatusIcon = (status) => {
        switch (status) {
            case 'present': return <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />;
            case 'late': return <Schedule sx={{ color: 'warning.main', fontSize: 20 }} />;
            case 'absent': return <Cancel sx={{ color: 'error.main', fontSize: 20 }} />;
            default: return null;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'present': return 'success';
            case 'late': return 'warning';
            case 'absent': return 'error';
            default: return 'default';
        }
    };

    return (
        <Box sx={{ animation: 'fadeIn 0.5s ease-in' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h4" fontWeight="800" color="text.primary">
                        🕐 Suivi de Présence
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Statistiques de présence en temps réel pour aujourd'hui
                    </Typography>
                </Box>
                <GlassPaper sx={{ p: 1, px: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <History color="primary" />
                    <Typography variant="body2" fontWeight="700">
                        {new Date().toLocaleDateString('fr-TN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </Typography>
                </GlassPaper>
            </Box>

            {/* Stats Cards */}
            <Grid container spacing={3} mb={4}>
                <Grid item xs={12} sm={4}>
                    <ModernStatCard
                        title="Présents"
                        value={stats.present}
                        icon={<Person />}
                        color="success"
                    />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <ModernStatCard
                        title="Retards"
                        value={stats.late}
                        icon={<Timer />}
                        color="warning"
                    />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <ModernStatCard
                        title="Absents"
                        value={stats.absent}
                        icon={<WarningAmber />}
                        color="error"
                    />
                </Grid>
            </Grid>

            {/* Attendance Table */}
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                    <CircularProgress color="primary" thickness={5} size={60} />
                </Box>
            ) : (
                <TableContainer component={GlassPaper} sx={{ p: 0, overflow: 'hidden' }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'rgba(99, 102, 241, 0.04)' }}>
                                <TableCell sx={{ fontWeight: 700 }}>Collaborateur</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Arrivée</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Départ</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Statut</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Retard / Écart</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>Détails</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {attendance.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                                        <Typography color="text.secondary" variant="h6">
                                            Aucun enregistrement de présence pour aujourd'hui
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                attendance.map((record) => (
                                    <TableRow key={record.attendance_id} hover>
                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={2}>
                                                <Avatar sx={{ bgcolor: 'primary.light', fontWeight: 700, width: 32, height: 32, fontSize: '0.8rem' }}>
                                                    {record.employee_name?.split(' ').map(n => n[0]).join('')}
                                                </Avatar>
                                                <Typography variant="body2" fontWeight="600">
                                                    {record.employee_name || 'Collaborateur'}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="700">
                                                {record.check_in_time ? format(new Date(record.check_in_time), 'HH:mm') : '--:--'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                {record.check_out_time ? format(new Date(record.check_out_time), 'HH:mm') : '--:--'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                {getStatusIcon(record.status)}
                                                <Chip
                                                    label={record.status === 'present' ? 'Présent' : record.status === 'late' ? 'Retard' : 'Absent'}
                                                    color={getStatusColor(record.status)}
                                                    size="small"
                                                    sx={{ fontWeight: 700, minWidth: 80 }}
                                                />
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            {record.delay_minutes > 0 ? (
                                                <Typography color="error.main" variant="body2" fontWeight="700">
                                                    +{record.delay_minutes} min
                                                </Typography>
                                            ) : (
                                                <Typography color="success.main" variant="body2">
                                                    Ponctuel
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell align="right">
                                            <Tooltip title="Voir les détails biométriques">
                                                <Typography variant="caption" color="primary" sx={{ cursor: 'pointer', textDecoration: 'underline' }}>
                                                    Logs face ID
                                                </Typography>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
};

export default AttendancePage;

