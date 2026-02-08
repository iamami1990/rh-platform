import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Alert,
    Tooltip,
    Grid,
    Card,
    CardContent
} from '@mui/material';
import {
    Add as AddIcon,
    CheckCircle as ApproveIcon,
    Cancel as RejectIcon,
    Delete as DeleteIcon,
    Visibility as ViewIcon,
    FileDownload as ExportIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const OvertimePage = () => {
    const [overtimes, setOvertimes] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedOvertime, setSelectedOvertime] = useState(null);
    const [filters, setFilters] = useState({ month: '', status: '', employee_id: '' });
    const [formData, setFormData] = useState({
        employee_id: '',
        date: '',
        hours: '',
        rate_type: '125%',
        overtime_category: 'regular',
        reason: '',
        description: ''
    });
    const [alert, setAlert] = useState({ show: false, type: 'success', message: '' });

    const token = localStorage.getItem('token');
    const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

    useEffect(() => {
        fetchOvertimes();
        fetchEmployees();
    }, [filters]);

    const fetchOvertimes = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.month) params.append('month', filters.month);
            if (filters.status) params.append('status', filters.status);
            if (filters.employee_id) params.append('employee_id', filters.employee_id);

            const res = await axios.get(`${API_URL}/overtime?${params}`, axiosConfig);
            setOvertimes(res.data.overtimes || []);
        } catch (error) {
            showAlert('error', 'Erreur de chargement');
        }
        setLoading(false);
    };

    const fetchEmployees = async () => {
        try {
            const res = await axios.get(`${API_URL}/employees`, axiosConfig);
            setEmployees(res.data.employees || []);
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    };

    const handleCreateOvertime = async () => {
        try {
            await axios.post(`${API_URL}/overtime`, formData, axiosConfig);
            showAlert('success', 'Demande créée avec succès');
            setOpenDialog(false);
            resetForm();
            fetchOvertimes();
        } catch (error) {
            showAlert('error', error.response?.data?.message || 'Erreur de création');
        }
    };

    const handleApprove = async (id) => {
        if (!window.confirm('Approuver cette demande ?')) return;
        try {
            await axios.put(`${API_URL}/overtime/${id}/approve`, {}, axiosConfig);
            showAlert('success', 'Demande approuvée');
            fetchOvertimes();
        } catch (error) {
            showAlert('error', error.response?.data?.message || 'Erreur approbation');
        }
    };

    const handleReject = async (id) => {
        const reason = window.prompt('Raison du rejet :');
        if (!reason) return;
        try {
            await axios.put(`${API_URL}/overtime/${id}/reject`, { rejection_reason: reason }, axiosConfig);
            showAlert('success', 'Demande rejetée');
            fetchOvertimes();
        } catch (error) {
            showAlert('error', error.response?.data?.message || 'Erreur rejet');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Annuler cette demande ?')) return;
        try {
            await axios.delete(`${API_URL}/overtime/${id}`, axiosConfig);
            showAlert('success', 'Demande annulée');
            fetchOvertimes();
        } catch (error) {
            showAlert('error', error.response?.data?.message || 'Erreur suppression');
        }
    };

    const showAlert = (type, message) => {
        setAlert({ show: true, type, message });
        setTimeout(() => setAlert({ show: false, type: '', message: '' }), 5000);
    };

    const resetForm = () => {
        setFormData({
            employee_id: '',
            date: '',
            hours: '',
            rate_type: '125%',
            overtime_category: 'regular',
            reason: '',
            description: ''
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'success';
            case 'rejected': return 'error';
            case 'cancelled': return 'default';
            default: return 'warning';
        }
    };

    const getRateColor = (rate) => {
        if (rate === '200%') return 'error';
        if (rate === '150%') return 'warning';
        return 'info';
    };

    // Stats
    const stats = {
        total: overtimes.length,
        pending: overtimes.filter(o => o.status === 'pending').length,
        approved: overtimes.filter(o => o.status === 'approved').length,
        totalHours: overtimes.filter(o => o.status === 'approved').reduce((sum, o) => sum + o.hours, 0),
        totalAmount: overtimes.filter(o => o.status === 'approved').reduce((sum, o) => sum + o.amount, 0)
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Gestion des Heures Supplémentaires
            </Typography>

            {alert.show && (
                <Alert severity={alert.type} onClose={() => setAlert({ show: false })} sx={{ mb: 2 }}>
                    {alert.message}
                </Alert>
            )}

            {/* Stats Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={2.4}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>Total Demandes</Typography>
                            <Typography variant="h4">{stats.total}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>En Attente</Typography>
                            <Typography variant="h4" color="warning.main">{stats.pending}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>Approuvées</Typography>
                            <Typography variant="h4" color="success.main">{stats.approved}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>Heures Total</Typography>
                            <Typography variant="h4">{stats.totalHours}h</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>Montant Total</Typography>
                            <Typography variant="h4">{stats.totalAmount.toFixed(0)} TND</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Filters & Actions */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={3}>
                        <TextField
                            fullWidth
                            label="Mois"
                            type="month"
                            value={filters.month}
                            onChange={(e) => setFilters({ ...filters, month: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <TextField
                            fullWidth
                            select
                            label="Statut"
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        >
                            <MenuItem value="">Tous</MenuItem>
                            <MenuItem value="pending">En attente</MenuItem>
                            <MenuItem value="approved">Approuvé</MenuItem>
                            <MenuItem value="rejected">Rejeté</MenuItem>
                        </TextField>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <TextField
                            fullWidth
                            select
                            label="Employé"
                            value={filters.employee_id}
                            onChange={(e) => setFilters({ ...filters, employee_id: e.target.value })}
                        >
                            <MenuItem value="">Tous</MenuItem>
                            {employees.map(emp => (
                                <MenuItem key={emp._id || emp.employee_id} value={emp._id || emp.employee_id}>
                                    {emp.firstName} {emp.lastName}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Button
                            fullWidth
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => setOpenDialog(true)}
                        >
                            Nouvelle Demande
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Employé</TableCell>
                            <TableCell>Heures</TableCell>
                            <TableCell>Taux</TableCell>
                            <TableCell>Montant</TableCell>
                            <TableCell>Raison</TableCell>
                            <TableCell>Statut</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {overtimes.map((overtime) => (
                            <TableRow key={overtime.overtime_id}>
                                <TableCell>{overtime.date}</TableCell>
                                <TableCell>{employees.find(e => (e._id || e.employee_id) === overtime.employee_id)?.firstName || 'N/A'}</TableCell>
                                <TableCell>{overtime.hours}h</TableCell>
                                <TableCell>
                                    <Chip label={overtime.rate_type} color={getRateColor(overtime.rate_type)} size="small" />
                                </TableCell>
                                <TableCell>{overtime.amount?.toFixed(2)} TND</TableCell>
                                <TableCell>
                                    <Tooltip title={overtime.reason}>
                                        <span>{overtime.reason.substring(0, 30)}...</span>
                                    </Tooltip>
                                </TableCell>
                                <TableCell>
                                    <Chip label={overtime.status} color={getStatusColor(overtime.status)} size="small" />
                                </TableCell>
                                <TableCell align="right">
                                    {overtime.status === 'pending' && (
                                        <>
                                            <Tooltip title="Approuver">
                                                <IconButton color="success" onClick={() => handleApprove(overtime.overtime_id)}>
                                                    <ApproveIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Rejeter">
                                                <IconButton color="error" onClick={() => handleReject(overtime.overtime_id)}>
                                                    <RejectIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </>
                                    )}
                                    <Tooltip title="Supprimer">
                                        <IconButton color="default" onClick={() => handleDelete(overtime.overtime_id)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Create Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Nouvelle Demande Heures Supplémentaires</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                select
                                label="Employé"
                                value={formData.employee_id}
                                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                                required
                            >
                                {employees.map(emp => (
                                    <MenuItem key={emp._id || emp.employee_id} value={emp._id || emp.employee_id}>
                                        {emp.firstName} {emp.lastName}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Date"
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Heures"
                                type="number"
                                value={formData.hours}
                                onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                                inputProps={{ min: 0.5, max: 12, step: 0.5 }}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                select
                                label="Taux"
                                value={formData.rate_type}
                                onChange={(e) => setFormData({ ...formData, rate_type: e.target.value })}
                            >
                                <MenuItem value="125%">125% (Normal)</MenuItem>
                                <MenuItem value="150%">150% (Nuit/Dimanche)</MenuItem>
                                <MenuItem value="200%">200% (Férié)</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                select
                                label="Catégorie"
                                value={formData.overtime_category}
                                onChange={(e) => setFormData({ ...formData, overtime_category: e.target.value })}
                            >
                                <MenuItem value="regular">Normal</MenuItem>
                                <MenuItem value="night">Nuit</MenuItem>
                                <MenuItem value="sunday">Dimanche</MenuItem>
                                <MenuItem value="holiday">Férié</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Raison"
                                value={formData.reason}
                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                required
                                multiline
                                rows={2}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Description (optionnel)"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                multiline
                                rows={3}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Annuler</Button>
                    <Button onClick={handleCreateOvertime} variant="contained" color="primary">
                        Créer
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default OvertimePage;
