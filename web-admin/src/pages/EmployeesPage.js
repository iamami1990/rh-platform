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
    TextField,
    InputAdornment,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    MenuItem,
    Avatar,
    Tooltip,
} from '@mui/material';
import {
    Add,
    Edit,
    Delete,
    Search,
    Email,
    Phone,
    Business,
    Work,
    FileUpload,
} from '@mui/icons-material';
import { employeesAPI } from '../services/api';
import GlassPaper from '../components/GlassPaper';

const DEPARTMENTS = ['IT', 'RH', 'Finance', 'Operations', 'Ventes', 'Marketing'];
const CONTRACT_TYPES = ['CDI', 'CDD', 'SIVP', 'Freelance'];

const EmployeesPage = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDept, setFilterDept] = useState('All');
    const [filterContract, setFilterContract] = useState('All');

    // Dialog State
    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        department: '',
        position: '',
        salary_brut: '',
        contract_type: 'CDI',
        status: 'active',
        hireDate: new Date().toISOString().split('T')[0],
        marital_status: 'single',
        children_count: 0,
        cin: '',
        cnss_number: '',
    });

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const response = await employeesAPI.getAll({});
            setEmployees(response.data.employees || []);
        } catch (error) {
            console.error('Failed to fetch employees:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpen = (employee = null) => {
        if (employee) {
            setEditMode(true);
            setSelectedEmployee(employee);
            setFormData({
                firstName: employee.firstName || '',
                lastName: employee.lastName || '',
                email: employee.email || '',
                phone: employee.phone || '',
                department: employee.department || '',
                position: employee.position || '',
                salary_brut: employee.salary_brut || '',
                contract_type: employee.contract_type || 'CDI',
                status: employee.status || 'active',
                hireDate: employee.hireDate ? new Date(employee.hireDate).toISOString().split('T')[0] : '',
                marital_status: employee.marital_status || 'single',
                children_count: employee.children_count || 0,
                cin: employee.cin || '',
                cnss_number: employee.cnss_number || '',
            });
        } else {
            setEditMode(false);
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                department: '',
                position: '',
                salary_brut: '',
                contract_type: 'CDI',
                status: 'active',
                hireDate: new Date().toISOString().split('T')[0],
                marital_status: 'single',
                children_count: 0,
                cin: '',
                cnss_number: '',
            });
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setEditMode(false);
        setSelectedEmployee(null);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editMode) {
                await employeesAPI.update(selectedEmployee._id || selectedEmployee.employee_id || selectedEmployee.id, formData);
            } else {
                await employeesAPI.create(formData);
            }
            fetchEmployees();
            handleClose();
        } catch (error) {
            console.error('Error saving employee:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cet employé ?')) {
            try {
                await employeesAPI.delete(id);
                fetchEmployees();
            } catch (error) {
                console.error('Error deleting employee:', error);
            }
        }
    };

    const handleDocumentUpload = async (id, file) => {
        if (!file) return;
        const formData = new FormData();
        formData.append('document', file);
        formData.append('type', 'contract'); // Default type

        try {
            await employeesAPI.uploadDocument(id, formData);
            alert('Document téléchargé avec succès !');
        } catch (error) {
            console.error('Error uploading document:', error);
            alert('Échec du téléchargement du document');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'success';
            case 'on_leave': return 'warning';
            case 'inactive': return 'error';
            default: return 'default';
        }
    };

    const filteredEmployees = employees.filter((emp) => {
        const matchesSearch = `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.matricule?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesDept = filterDept === 'All' || emp.department === filterDept;
        const matchesContract = filterContract === 'All' || emp.contract_type === filterContract;

        return matchesSearch && matchesDept && matchesContract;
    });

    return (
        <Box sx={{ animation: 'fadeIn 0.5s ease-in' }}>
            {/* Header Area */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h4" fontWeight="800" color="text.primary">
                        👨‍💼 Collaborateurs
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Gérez les informations de vos {employees.length} employés
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => handleOpen()}
                    sx={{
                        borderRadius: 3,
                        px: 3,
                        py: 1.2,
                        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                        boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)',
                    }}
                >
                    Ajouter un employé
                </Button>
            </Box>

            {/* Filters Area */}
            <GlassPaper sx={{ mb: 4, p: 2 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            placeholder="Rechercher par nom, email ou matricule..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            variant="outlined"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search color="primary" />
                                    </InputAdornment>
                                ),
                                sx: { borderRadius: 3, bgcolor: 'rgba(255,255,255,0.5)' }
                            }}
                        />
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <TextField
                            fullWidth
                            select
                            size="small"
                            label="Service"
                            value={filterDept}
                            onChange={(e) => setFilterDept(e.target.value)}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                        >
                            <MenuItem value="All">Tous les services</MenuItem>
                            {DEPARTMENTS.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                        </TextField>
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <TextField
                            fullWidth
                            select
                            size="small"
                            label="Type Contrat"
                            value={filterContract}
                            onChange={(e) => setFilterContract(e.target.value)}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                        >
                            <MenuItem value="All">Tous les contrats</MenuItem>
                            {CONTRACT_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                        </TextField>
                    </Grid>
                </Grid>
            </GlassPaper>

            {/* Employees List */}
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
                                <TableCell sx={{ fontWeight: 700 }}>Département & Poste</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Contact</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Type & Statut</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredEmployees.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                                        <Typography color="text.secondary" variant="h6">
                                            {searchTerm ? 'Aucun résultat correspondant' : 'Aucun employé enregistré'}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredEmployees.map((emp) => (
                                    <TableRow key={emp._id || emp.employee_id || emp.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={2}>
                                                <Avatar sx={{ bgcolor: 'primary.light', fontWeight: 700 }}>
                                                    {emp.firstName?.charAt(0)}{emp.lastName?.charAt(0)}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="body1" fontWeight="700">
                                                        {emp.firstName} {emp.lastName}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Recruté le {new Date(emp.hireDate).toLocaleDateString()}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Box display="flex" flexDirection="column">
                                                <Box display="flex" alignItems="center" gap={0.5}>
                                                    <Business sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                    <Typography variant="body2" fontWeight="600">{emp.department}</Typography>
                                                </Box>
                                                <Box display="flex" alignItems="center" gap={0.5}>
                                                    <Work sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                    <Typography variant="caption" color="text.secondary">{emp.position}</Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Box display="flex" flexDirection="column">
                                                <Box display="flex" alignItems="center" gap={0.5}>
                                                    <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                    <Typography variant="body2">{emp.email}</Typography>
                                                </Box>
                                                <Box display="flex" alignItems="center" gap={0.5}>
                                                    <Phone sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                    <Typography variant="caption" color="text.secondary">{emp.phone}</Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Chip label={emp.contract_type} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                                                <Chip
                                                    label={emp.status === 'active' ? 'Actif' : emp.status === 'on_leave' ? 'En congé' : 'Inactif'}
                                                    color={getStatusColor(emp.status)}
                                                    size="small"
                                                    sx={{ fontWeight: 700 }}
                                                />
                                            </Box>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Tooltip title="Uploader Document">
                                                <IconButton
                                                    color="secondary"
                                                    component="label"
                                                    sx={{ bgcolor: 'rgba(156, 39, 176, 0.08)', mr: 1 }}
                                                >
                                                    <FileUpload fontSize="small" />
                                                    <input
                                                        type="file"
                                                        hidden
                                                        onChange={(e) => handleDocumentUpload(emp._id || emp.employee_id || emp.id, e.target.files[0])}
                                                    />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Modifier">
                                                <IconButton color="primary" onClick={() => handleOpen(emp)} sx={{ bgcolor: 'rgba(99, 102, 241, 0.08)', mr: 1 }}>
                                                    <Edit fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Supprimer">
                                                <IconButton color="error" onClick={() => handleDelete(emp._id || emp.employee_id || emp.id)} sx={{ bgcolor: 'rgba(239, 68, 68, 0.08)' }}>
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Add/Edit Dialog */}
            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 4, p: 2 } }}>
                <form onSubmit={handleSubmit}>
                    <DialogTitle sx={{ fontWeight: 800 }}>
                        {editMode ? 'Modifier le Collaborateur' : 'Nouveau Collaborateur'}
                    </DialogTitle>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Prénom" name="firstName" value={formData.firstName} onChange={handleChange} required variant="outlined" />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Nom" name="lastName" value={formData.lastName} onChange={handleChange} required variant="outlined" />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Email professionnel" name="email" type="email" value={formData.email} onChange={handleChange} required variant="outlined" />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Téléphone" name="phone" value={formData.phone} onChange={handleChange} variant="outlined" />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth select label="Département" name="department" value={formData.department} onChange={handleChange} required variant="outlined">
                                    {DEPARTMENTS.map((dept) => (
                                        <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Poste" name="position" value={formData.position} onChange={handleChange} required variant="outlined" />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Salaire Brut (TND)" name="salary_brut" type="number" value={formData.salary_brut} onChange={handleChange} required variant="outlined" />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Date d'embauche" name="hireDate" type="date" value={formData.hireDate} onChange={handleChange} required variant="outlined" InputLabelProps={{ shrink: true }} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth select label="Type de contrat" name="contract_type" value={formData.contract_type} onChange={handleChange} required variant="outlined">
                                    {CONTRACT_TYPES.map((type) => (
                                        <MenuItem key={type} value={type}>{type}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth select label="Statut" name="status" value={formData.status} onChange={handleChange} required variant="outlined">
                                    <MenuItem value="active">Actif</MenuItem>
                                    <MenuItem value="on_leave">En congé</MenuItem>
                                    <MenuItem value="inactive">Inactif</MenuItem>
                                </TextField>
                            </Grid>

                            {/* Tunisian Market Specifics */}
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" sx={{ mb: 1, mt: 2, fontWeight: 700, color: 'primary.main' }}>
                                    Information Administrative (Tunisie)
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Carte d'Identité (CIN)" name="cin" value={formData.cin} onChange={handleChange} variant="outlined" />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Matricule CNSS" name="cnss_number" value={formData.cnss_number} onChange={handleChange} variant="outlined" />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth select label="Situation Familiale" name="marital_status" value={formData.marital_status} onChange={handleChange} required variant="outlined">
                                    <MenuItem value="single">Célibataire</MenuItem>
                                    <MenuItem value="married">Marié(e)</MenuItem>
                                    <MenuItem value="divorced">Divorcé(e)</MenuItem>
                                    <MenuItem value="widowed">Veuf/Veuve</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Nombre d'enfants" name="children_count" type="number" value={formData.children_count} onChange={handleChange} variant="outlined" />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ p: 3 }}>
                        <Button onClick={handleClose} color="inherit" sx={{ fontWeight: 600 }}>Annuler</Button>
                        <Button type="submit" variant="contained" sx={{ borderRadius: 2, px: 4, py: 1, fontWeight: 700 }}>
                            {editMode ? 'Mettre à jour' : 'Enregistrer'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
};

export default EmployeesPage;

