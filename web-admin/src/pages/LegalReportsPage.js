import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Grid,
    Card,
    CardContent,
    CardActions,
    TextField,
    MenuItem,
    Alert,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider
} from '@mui/material';
import {
    FileDownload as DownloadIcon,
    Description as DocumentIcon,
    Assessment as ReportIcon,
    AccountBalance as BankIcon,
    LocalAtm as MoneyIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const LegalReportsPage = () => {
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [alert, setAlert] = useState({ show: false, type: 'success', message: '' });
    const [loading, setLoading] = useState(false);

    const token = localStorage.getItem('token');
    const axiosConfig = {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
    };

    const showAlert = (type, message) => {
        setAlert({ show: true, type, message });
        setTimeout(() => setAlert({ show: false, type: '', message: '' }), 5000);
    };

    const downloadFile = (blob, filename) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    };

    const handleDownloadCNSS = async () => {
        if (!selectedMonth) {
            showAlert('warning', 'Veuillez sélectionner un mois');
            return;
        }
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/legal/cnss/${selectedMonth}`, axiosConfig);
            downloadFile(res.data, `CNSS_Bordereau_${selectedMonth}.xlsx`);
            showAlert('success', 'Bordereau CNSS téléchargé');
        } catch (error) {
            showAlert('error', error.response?.data?.message || 'Erreur téléchargement');
        }
        setLoading(false);
    };

    const handleDownloadIRannual = async () => {
        if (!selectedYear) {
            showAlert('warning', 'Veuillez sélectionner une année');
            return;
        }
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/legal/ir-annual/${selectedYear}`, axiosConfig);
            downloadFile(res.data, `IR_Annual_${selectedYear}.xlsx`);
            showAlert('success', 'Déclaration IR téléchargée');
        } catch (error) {
            showAlert('error', error.response?.data?.message || 'Erreur téléchargement');
        }
        setLoading(false);
    };

    const handleDownloadWorkCertificate = async () => {
        if (!selectedEmployee) {
            showAlert('warning', 'Veuillez sélectionner un employé');
            return;
        }
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/legal/work-certificate/${selectedEmployee}`, axiosConfig);
            downloadFile(res.data, `Attestation_Travail_${selectedEmployee}.pdf`);
            showAlert('success', 'Attestation de travail téléchargée');
        } catch (error) {
            showAlert('error', error.response?.data?.message || 'Erreur téléchargement');
        }
        setLoading(false);
    };

    const handleDownloadSalaryCertificate = async () => {
        if (!selectedEmployee) {
            showAlert('warning', 'Veuillez sélectionner un employé');
            return;
        }
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/legal/salary-certificate/${selectedEmployee}`, axiosConfig);
            downloadFile(res.data, `Certificat_Salaire_${selectedEmployee}.pdf`);
            showAlert('success', 'Certificat de salaire téléchargé');
        } catch (error) {
            showAlert('error', error.response?.data?.message || 'Erreur téléchargement');
        }
        setLoading(false);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Déclarations Légales & Documents Officiels
            </Typography>

            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Générez et téléchargez les documents légaux conformes à la réglementation tunisienne
            </Typography>

            {alert.show && (
                <Alert severity={alert.type} onClose={() => setAlert({ show: false })} sx={{ mb: 2 }}>
                    {alert.message}
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* CNSS Monthly Report */}
                <Grid item xs={12} md={6}>
                    <Card elevation={3}>
                        <CardContent>
                            <Box display="flex" alignItems="center" mb={2}>
                                <BankIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                                <Typography variant="h6">
                                    Bordereau CNSS Mensuel
                                </Typography>
                            </Box>
                            <Typography variant="body2" color="textSecondary" paragraph>
                                Déclaration mensuelle des cotisations CNSS (employé 9.18% + employeur 16.57%)
                            </Typography>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle2" gutterBottom>Contenu:</Typography>
                            <List dense>
                                <ListItem>
                                    <ListItemIcon><ReportIcon fontSize="small" /></ListItemIcon>
                                    <ListItemText primary="Liste tous les employés du mois" />
                                </ListItem>
                                <ListItem>
                                    <ListItemIcon><MoneyIcon fontSize="small" /></ListItemIcon>
                                    <ListItemText primary="Salaires bruts + cotisations détaillées" />
                                </ListItem>
                                <ListItem>
                                    <ListItemIcon><DocumentIcon fontSize="small" /></ListItemIcon>
                                    <ListItemText primary="Total à payer CNSS" />
                                </ListItem>
                            </List>
                            <TextField
                                fullWidth
                                label="Sélectionner le mois"
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                sx={{ mt: 2 }}
                            />
                        </CardContent>
                        <CardActions>
                            <Button
                                fullWidth
                                variant="contained"
                                color="primary"
                                startIcon={<DownloadIcon />}
                                onClick={handleDownloadCNSS}
                                disabled={loading || !selectedMonth}
                            >
                                Télécharger Excel
                            </Button>
                        </CardActions>
                    </Card>
                </Grid>

                {/* IR Annual Declaration */}
                <Grid item xs={12} md={6}>
                    <Card elevation={3}>
                        <CardContent>
                            <Box display="flex" alignItems="center" mb={2}>
                                <AssessmentIcon color="success" sx={{ fontSize: 40, mr: 2 }} />
                                <Typography variant="h6">
                                    Déclaration IR Annuelle
                                </Typography>
                            </Box>
                            <Typography variant="body2" color="textSecondary" paragraph>
                                Récapitulatif annuel des retenues IRPP (Impôt sur le Revenu des Personnes Physiques)
                            </Typography>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle2" gutterBottom>Contenu:</Typography>
                            <List dense>
                                <ListItem>
                                    <ListItemIcon><ReportIcon fontSize="small" /></ListItemIcon>
                                    <ListItemText primary="Revenus annuels par employé" />
                                </ListItem>
                                <ListItem>
                                    <ListItemIcon><MoneyIcon fontSize="small" /></ListItemIcon>
                                    <ListItemText primary="IRPP retenu à la source" />
                                </ListItem>
                                <ListItem>
                                    <ListItemIcon><DocumentIcon fontSize="small" /></ListItemIcon>
                                    <ListItemText primary="Conforme loi de finances 2025" />
                                </ListItem>
                            </List>
                            <TextField
                                fullWidth
                                label="Sélectionner l'année"
                                type="number"
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                inputProps={{ min: 2020, max: 2100 }}
                                sx={{ mt: 2 }}
                            />
                        </CardContent>
                        <CardActions>
                            <Button
                                fullWidth
                                variant="contained"
                                color="success"
                                startIcon={<DownloadIcon />}
                                onClick={handleDownloadIRannual}
                                disabled={loading || !selectedYear}
                            >
                                Télécharger Excel
                            </Button>
                        </CardActions>
                    </Card>
                </Grid>

                {/* Work Certificate */}
                <Grid item xs={12} md={6}>
                    <Card elevation={3}>
                        <CardContent>
                            <Box display="flex" alignItems="center" mb={2}>
                                <DocumentIcon color="info" sx={{ fontSize: 40, mr: 2 }} />
                                <Typography variant="h6">
                                    Attestation de Travail
                                </Typography>
                            </Box>
                            <Typography variant="body2" color="textSecondary" paragraph>
                                Document officiel certifiant l'emploi d'un salarié
                            </Typography>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle2" gutterBottom>Informations incluses:</Typography>
                            <List dense>
                                <ListItem>
                                    <ListItemText primary="Identité employé (nom, CIN, adresse)" />
                                </ListItem>
                                <ListItem>
                                    <ListItemText primary="Poste et département" />
                                </ListItem>
                                <ListItem>
                                    <ListItemText primary="Date d'embauche et ancienneté" />
                                </ListItem>
                            </List>
                            <TextField
                                fullWidth
                                label="ID Employé"
                                placeholder="Entrer l'ID de l'employé"
                                value={selectedEmployee}
                                onChange={(e) => setSelectedEmployee(e.target.value)}
                                sx={{ mt: 2 }}
                            />
                        </CardContent>
                        <CardActions>
                            <Button
                                fullWidth
                                variant="contained"
                                color="info"
                                startIcon={<DownloadIcon />}
                                onClick={handleDownloadWorkCertificate}
                                disabled={loading || !selectedEmployee}
                            >
                                Télécharger PDF
                            </Button>
                        </CardActions>
                    </Card>
                </Grid>

                {/* Salary Certificate */}
                <Grid item xs={12} md={6}>
                    <Card elevation={3}>
                        <CardContent>
                            <Box display="flex" alignItems="center" mb={2}>
                                <MoneyIcon color="warning" sx={{ fontSize: 40, mr: 2 }} />
                                <Typography variant="h6">
                                    Certificat de Salaire
                                </Typography>
                            </Box>
                            <Typography variant="body2" color="textSecondary" paragraph>
                                Attestation officielle du salaire net perçu (moyenne 3 derniers mois)
                            </Typography>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle2" gutterBottom>Informations incluses:</Typography>
                            <List dense>
                                <ListItem>
                                    <ListItemText primary="Salaire net moyen mensuel" />
                                </ListItem>
                                <ListItem>
                                    <ListItemText primary="Détail des 3 derniers mois" />
                                </ListItem>
                                <ListItem>
                                    <ListItemText primary="Cachet et signature entreprise" />
                                </ListItem>
                            </List>
                            <TextField
                                fullWidth
                                label="ID Employé"
                                placeholder="Entrer l'ID de l'employé"
                                value={selectedEmployee}
                                onChange={(e) => setSelectedEmployee(e.target.value)}
                                sx={{ mt: 2 }}
                            />
                        </CardContent>
                        <CardActions>
                            <Button
                                fullWidth
                                variant="contained"
                                color="warning"
                                startIcon={<DownloadIcon />}
                                onClick={handleDownloadSalaryCertificate}
                                disabled={loading || !selectedEmployee}
                            >
                                Télécharger PDF
                            </Button>
                        </CardActions>
                    </Card>
                </Grid>
            </Grid>

            {/* Information Banner */}
            <Paper sx={{ p: 2, mt: 3, bgcolor: 'info.light' }}>
                <Typography variant="subtitle2" gutterBottom>
                    ℹ️ Informations Importantes
                </Typography>
                <Typography variant="body2">
                    • Les bordereaux CNSS et déclarations IR sont générés automatiquement à partir des données de paie<br />
                    • Les attestations sont conformes aux standards de l'administration tunisienne<br />
                    • Tous les documents sont horodatés et sécurisés<br />
                    • Pour toute demande spécifique, contactez le service RH
                </Typography>
            </Paper>
        </Box>
    );
};

// Missing import
import { Assessment as AssessmentIcon } from '@mui/icons-material';

export default LegalReportsPage;
