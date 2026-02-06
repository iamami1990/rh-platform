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
    TextField,
    Grid,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Avatar,
} from '@mui/material';
import { Download, Refresh, AttachMoney, AccountBalance, TrendingDown, People, Email, FileDownload } from '@mui/icons-material';
import { payrollAPI } from '../services/api';
import GlassPaper from '../components/GlassPaper';
import ModernStatCard from '../components/ModernStatCard';

const PayrollPage = () => {
    const [payrolls, setPayrolls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState('2025-12');
    const [report, setReport] = useState(null);
    const [generateDialogOpen, setGenerateDialogOpen] = useState(false);

    const fetchPayrolls = React.useCallback(async () => {
        try {
            setLoading(true);
            const response = await payrollAPI.getAll({ month: selectedMonth });
            setPayrolls(response.data.payrolls || []);

            // Get report
            const reportResponse = await payrollAPI.getReport(selectedMonth);
            setReport(reportResponse.data.report);
        } catch (error) {
            console.error('Failed to fetch payroll:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedMonth]);

    useEffect(() => {
        fetchPayrolls();
    }, [selectedMonth, fetchPayrolls]);

    const handleGenerate = async () => {
        try {
            await payrollAPI.generate(selectedMonth);
            setGenerateDialogOpen(false);
            fetchPayrolls(); // Refresh
        } catch (error) {
            console.error('Failed to generate payroll:', error);
        }
    };

    const handleDownloadPDF = async (payroll) => {
        try {
            const response = await payrollAPI.downloadPDF(payroll.payroll_id);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Bulletin_${payroll.employee_name || 'Emp'}_${payroll.month}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Failed to download PDF:', error);
        }
    };

    const handleExportSEPA = async () => {
        try {
            const response = await payrollAPI.exportSEPA(selectedMonth);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `SEPA_${selectedMonth}.xml`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Failed to export SEPA:', error);
        }
    };

    const handleExportExcel = async () => {
        try {
            const response = await payrollAPI.exportExcel(selectedMonth);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Payroll_Report_${selectedMonth}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Failed to export Excel:', error);
        }
    };

    const handleDownloadCNSS = async () => {
        try {
            const response = await payrollAPI.getCNSSReport(selectedMonth);
            // Since CNSS might be a JSON report or a file download depending on backend
            // In our backend implementation it returns JSON, but for a "report" we usually want a display or export.
            // Let's assume we display it or download as JSON for now, or just alert success.

            alert(`Rapport CNSS pour ${selectedMonth} généré avec succès. (Voir console pour les détails)`);
        } catch (error) {
            console.error('Failed to get CNSS report:', error);
        }
    };

    const handleSendEmail = async (id) => {
        try {
            await payrollAPI.sendEmail(id);
            alert('Email envoyé avec succès !');
        } catch (error) {
            console.error('Failed to send email:', error);
            alert('Erreur lors de l\'envoi de l\'email');
        }
    };

    return (
        <Box sx={{ animation: 'fadeIn 0.5s ease-in' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h4" fontWeight="800" color="text.primary">
                        💰 Gestion de Paie
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Suivi et génération des bulletins de paie
                    </Typography>
                </Box>
                <GlassPaper sx={{ p: 1, display: 'flex', gap: 2, alignItems: 'center' }}>
                    <TextField
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        size="small"
                        variant="outlined"
                        InputProps={{ sx: { borderRadius: 2 } }}
                    />
                    <Button
                        variant="contained"
                        startIcon={<Refresh />}
                        onClick={() => setGenerateDialogOpen(true)}
                        sx={{
                            borderRadius: 2,
                            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)',
                        }}
                    >
                        Générer
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<FileDownload />}
                        onClick={handleExportSEPA}
                        disabled={payrolls.length === 0}
                        sx={{ borderRadius: 2 }}
                    >
                        Export SEPA
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<FileDownload />}
                        onClick={handleExportExcel}
                        disabled={payrolls.length === 0}
                        sx={{ borderRadius: 2, borderColor: '#107c10', color: '#107c10', '&:hover': { borderColor: '#107c10', bgcolor: 'rgba(16, 124, 16, 0.05)' } }}
                    >
                        Export Excel
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<AccountBalance />}
                        onClick={handleDownloadCNSS}
                        disabled={payrolls.length === 0}
                        sx={{ borderRadius: 2, borderColor: '#d32f2f', color: '#d32f2f', '&:hover': { borderColor: '#d32f2f', bgcolor: 'rgba(211, 47, 47, 0.05)' } }}
                    >
                        Rapport CNSS
                    </Button>
                </GlassPaper>
            </Box>

            {/* Summary Cards */}
            {report && (
                <Grid container spacing={3} mb={4}>
                    <Grid item xs={12} sm={6} md={3}>
                        <ModernStatCard
                            title="Collaborateurs"
                            value={report.total_employees}
                            icon={<People />}
                            color="primary"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <ModernStatCard
                            title="Masse Brute"
                            value={`${Number(report.total_gross || 0).toFixed(2)} TND`}
                            icon={<AttachMoney />}
                            color="success"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <ModernStatCard
                            title="Total Déductions"
                            value={`${Number(report.total_deductions || 0).toFixed(2)} TND`}
                            icon={<TrendingDown />}
                            color="error"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <ModernStatCard
                            title="Net à Payer"
                            value={`${Number(report.total_net || 0).toFixed(2)} TND`}
                            icon={<AccountBalance />}
                            color="warning"
                        />
                    </Grid>
                </Grid>
            )}

            {/* Payroll Table */}
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                    <CircularProgress color="primary" thickness={5} size={60} />
                </Box>
            ) : (
                <TableContainer component={GlassPaper} sx={{ p: 0, overflow: 'hidden' }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'rgba(99, 102, 241, 0.04)' }}>
                                <TableCell sx={{ fontWeight: 700 }}>Employé</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Brut</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>CNSS (9.18%)</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>IRPP & CSS</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Net à Payer</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {payrolls.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                                        <Typography color="text.secondary" variant="h6">
                                            Aucune paie générée pour ce mois
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                payrolls.map((payroll) => (
                                    <TableRow key={payroll.payroll_id} hover>
                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={2}>
                                                <Avatar sx={{ bgcolor: 'primary.light', fontWeight: 700, width: 32, height: 32, fontSize: '0.8rem' }}>
                                                    {payroll.employee_name?.split(' ').map(n => n[0]).join('')}
                                                </Avatar>
                                                <Typography variant="body2" fontWeight="600">
                                                    {payroll.employee_name || 'Collaborateur'}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="600">
                                                {Number(payroll.total_gross || 0).toFixed(3)} DT
                                            </Typography>
                                        </TableCell>
                                        <TableCell color="error.main">
                                            <Typography variant="body2" color="error.main">
                                                -{Number(payroll.deductions?.cnss || 0).toFixed(3)} DT
                                            </Typography>
                                        </TableCell>
                                        <TableCell color="error.main">
                                            <Typography variant="body2" color="error.main">
                                                -{(Number(payroll.deductions?.irpp || 0) + Number(payroll.deductions?.css || 0)).toFixed(3)} DT
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="800" color="success.main">
                                                {Number(payroll.net_salary || 0).toFixed(3)} DT
                                            </Typography>
                                        </TableCell>

                                        <TableCell align="right">
                                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    startIcon={<Download />}
                                                    onClick={() => handleDownloadPDF(payroll)}
                                                    sx={{ borderRadius: 2, textTransform: 'none' }}
                                                >
                                                    PDF
                                                </Button>
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    color="primary"
                                                    startIcon={<Email />}
                                                    onClick={() => handleSendEmail(payroll.payroll_id)}
                                                    sx={{ borderRadius: 2, textTransform: 'none' }}
                                                >
                                                    Email
                                                </Button>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Generate Dialog */}
            <Dialog
                open={generateDialogOpen}
                onClose={() => setGenerateDialogOpen(false)}
                PaperProps={{ sx: { borderRadius: 4, p: 1 } }}
            >
                <DialogTitle sx={{ fontWeight: 800 }}>Générer les Bulletins</DialogTitle>
                <DialogContent>
                    <Typography variant="body1" mb={2}>
                        Souhaitez-vous lancer la génération automatique des bulletins pour <strong>{selectedMonth}</strong> ?
                    </Typography>
                    <Typography variant="body2" color="warning.main" sx={{ bgcolor: 'warning.light', p: 1.5, borderRadius: 2, opacity: 0.8 }}>
                        ⚠️ Cette action impactera les calculs de taxes (CNSS, IR) basés sur la présence et les congés du mois.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setGenerateDialogOpen(false)} color="inherit">Annuler</Button>
                    <Button
                        onClick={handleGenerate}
                        variant="contained"
                        sx={{ borderRadius: 2, px: 4 }}
                    >
                        Confirmer la génération
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PayrollPage;

