import React, { useEffect, useState } from 'react';
import {
    Box,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Avatar,
    Tooltip,
    Stack,
    Divider,
} from '@mui/material';
import { CheckCircle, Cancel, Visibility, BeachAccess, Sick, ChildCare, EventNote, CalendarMonth, FilePresent } from '@mui/icons-material';
import { leavesAPI } from '../services/api';
import { format } from '../utils/dateHelpers';
import GlassPaper from '../components/GlassPaper';

const LeavesPage = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [calendarData, setCalendarData] = useState([]);

    const fetchLeaves = async () => {
        try {
            setLoading(true);
            const response = await leavesAPI.getAll({ status: 'pending' });
            setLeaves(response.data.leaves || []);
        } catch (error) {
            console.error('Failed to fetch leaves:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCalendar = async () => {
        try {
            const response = await leavesAPI.getCalendar();
            setCalendarData(response.data.calendar || []);
            setCalendarOpen(true);
        } catch (error) {
            console.error('Failed to fetch calendar:', error);
        }
    };

    useEffect(() => {
        fetchLeaves();
    }, []);

    const handleApprove = async (leaveId) => {
        try {
            await leavesAPI.approve(leaveId);
            fetchLeaves(); // Refresh list
        } catch (error) {
            console.error('Failed to approve leave:', error);
        }
    };

    const handleReject = async (leaveId) => {
        try {
            await leavesAPI.reject(leaveId);
            fetchLeaves(); // Refresh list
        } catch (error) {
            console.error('Failed to reject leave:', error);
        }
    };

    const getLeaveIcon = (type) => {
        switch (type) {
            case 'annual': return <BeachAccess color="primary" />;
            case 'sick': return <Sick color="error" />;
            case 'maternity': return <ChildCare color="secondary" />;
            default: return <EventNote color="action" />;
        }
    };

    const getLeaveTypeLabel = (type) => {
        const types = {
            annual: 'Congés Annuels',
            sick: 'Maladie',
            maternity: 'Maternité',
            unpaid: 'Sans Solde',
        };
        return types[type] || type;
    };

    return (
        <Box sx={{ animation: 'fadeIn 0.5s ease-in' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h4" fontWeight="800" color="text.primary">
                        🏖️ Gestion des Congés
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Validation des demandes d'absence et suivi des soldes
                    </Typography>
                </Box>
                <Button
                    variant="outlined"
                    startIcon={<CalendarMonth />}
                    onClick={fetchCalendar}
                    sx={{ borderRadius: 3, fontWeight: 700 }}
                >
                    Vue Calendrier
                </Button>
            </Box>

            {/* Leaves Table */}
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
                                <TableCell sx={{ fontWeight: 700 }}>Type de Congé</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Période</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Durée</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Statut</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>Décision</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {leaves.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                                        <Typography color="text.secondary" variant="h6">
                                            Aucune demande de congé en attente
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                leaves.map((leave) => (
                                    <TableRow key={leave.leave_id} hover>
                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={2}>
                                                <Avatar sx={{ bgcolor: 'secondary.light', color: 'secondary.main', fontWeight: 700, width: 32, height: 32, fontSize: '0.8rem' }}>
                                                    {leave.employee_name?.split(' ').map(n => n[0]).join('')}
                                                </Avatar>
                                                <Typography variant="body2" fontWeight="600">
                                                    {leave.employee_name || 'Collaborateur'}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                {getLeaveIcon(leave.leave_type)}
                                                <Typography variant="body2">{getLeaveTypeLabel(leave.leave_type)}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="600">
                                                {format(new Date(leave.start_date), 'dd MMM')} - {format(new Date(leave.end_date), 'dd MMM yyyy')}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={`${leave.days_requested} Jours`} size="small" variant="outlined" sx={{ fontWeight: 700, borderRadius: 1.5 }} />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label="En attente"
                                                color="warning"
                                                size="small"
                                                sx={{ fontWeight: 700 }}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                <Tooltip title="Voir détails">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => {
                                                            setSelectedLeave(leave);
                                                            setDetailsOpen(true);
                                                        }}
                                                        sx={{ bgcolor: 'rgba(0,0,0,0.04)' }}
                                                    >
                                                        <Visibility fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Approuver">
                                                    <IconButton
                                                        size="small"
                                                        color="success"
                                                        onClick={() => handleApprove(leave.leave_id)}
                                                        sx={{ bgcolor: 'rgba(76, 175, 80, 0.1)' }}
                                                    >
                                                        <CheckCircle fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Refuser">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleReject(leave.leave_id)}
                                                        sx={{ bgcolor: 'rgba(244, 67, 54, 0.1)' }}
                                                    >
                                                        <Cancel fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Details Dialog */}
            <Dialog
                open={detailsOpen}
                onClose={() => setDetailsOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 4, p: 1 } }}
            >
                <DialogTitle sx={{ fontWeight: 800 }}>Détails de la demande</DialogTitle>
                <DialogContent>
                    {selectedLeave && (
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Typography variant="subtitle2" color="text.secondary">Employé</Typography>
                                <Typography variant="body1" fontWeight="700">{selectedLeave.employee_name}</Typography>
                            </Box>
                            <Divider />
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Typography variant="subtitle2" color="text.secondary">Type</Typography>
                                <Chip label={getLeaveTypeLabel(selectedLeave.leave_type)} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                            </Box>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Typography variant="subtitle2" color="text.secondary">Période</Typography>
                                <Typography variant="body2" fontWeight="600">
                                    Du {format(new Date(selectedLeave.start_date), 'dd/MM/yyyy')} au {format(new Date(selectedLeave.end_date), 'dd/MM/yyyy')}
                                </Typography>
                            </Box>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Typography variant="subtitle2" color="text.secondary">Durée totale</Typography>
                                <Typography variant="h6" color="primary.main" fontWeight="800">{selectedLeave.days_requested} Jours</Typography>
                            </Box>
                            <Divider />
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Motif de la demande</Typography>
                                <GlassPaper sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.02)', boxShadow: 'none' }}>
                                    <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                                        {selectedLeave.reason || "Aucune raison spécifiée par le collaborateur."}
                                    </Typography>
                                </GlassPaper>
                            </Box>
                            {selectedLeave.justification && (
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Justificatif</Typography>
                                    <Button
                                        variant="outlined"
                                        startIcon={<FilePresent />}
                                        href={selectedLeave.justification}
                                        target="_blank"
                                        fullWidth
                                        sx={{ borderRadius: 2 }}
                                    >
                                        Voir le justificatif
                                    </Button>
                                </Box>
                            )}
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setDetailsOpen(false)} color="inherit">Fermer</Button>
                    <Button
                        variant="contained"
                        color="success"
                        onClick={() => {
                            handleApprove(selectedLeave.leave_id);
                            setDetailsOpen(false);
                        }}
                        sx={{ borderRadius: 2 }}
                    >
                        Approuver
                    </Button>
                </DialogActions>
            </Dialog>
            {/* Calendar View Dialog */}
            <Dialog
                open={calendarOpen}
                onClose={() => setCalendarOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { borderRadius: 4, p: 1 } }}
            >
                <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarMonth color="primary" /> Calendrier des Absences
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        {calendarData.length === 0 ? (
                            <Typography textAlign="center" py={5} color="text.secondary">
                                Aucun congé approuvé pour les mois à venir.
                            </Typography>
                        ) : (
                            <TableContainer component={GlassPaper} variant="outlined" sx={{ boxShadow: 'none' }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 700 }}>Collaborateur</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Période</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {calendarData.map((event, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell fontWeight="600">{event.title}</TableCell>
                                                <TableCell>{event.start} au {event.end}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={getLeaveTypeLabel(event.type)}
                                                        size="small"
                                                        variant="outlined"
                                                        color={event.type === 'sick' ? 'error' : 'primary'}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setCalendarOpen(false)}>Fermer</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default LeavesPage;

