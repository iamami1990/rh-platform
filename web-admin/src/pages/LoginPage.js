import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    CircularProgress,
    InputAdornment,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Link,
    Alert,
} from '@mui/material';
import { Visibility, VisibilityOff, Lock, Email, Info } from '@mui/icons-material';
import { login, clearError } from '../store/authSlice';
import { authAPI } from '../services/api';

const LoginPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error } = useSelector((state) => state.auth);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [forgotDialogOpen, setForgotDialogOpen] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetSent, setResetSent] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });

        if (error) {
            dispatch(clearError());
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await dispatch(login(formData));
        if (result.type === 'auth/login/fulfilled') {
            navigate('/dashboard');
        }
    };

    const handleForgotSubmit = async (e) => {
        e.preventDefault();
        try {
            setResetLoading(true);
            await authAPI.forgotPassword(resetEmail);
            setResetSent(true);
        } catch (err) {
            console.error('Forgot password error:', err);
            alert('Une erreur est survenue. Veuillez réessayer.');
        } finally {
            setResetLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                background: 'radial-gradient(circle at 50% 50%, #6366f1 0%, #4f46e5 100%)',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    width: '150%',
                    height: '150%',
                    background: 'url("https://www.transparenttextures.com/patterns/cubes.png")',
                    opacity: 0.1,
                    animation: 'spin 60s linear infinite',
                },
                '@keyframes spin': {
                    from: { transform: 'rotate(0deg)' },
                    to: { transform: 'rotate(360deg)' },
                }
            }}
        >
            {/* Animated Shapes */}
            <Box sx={{ position: 'absolute', top: '10%', left: '10%', width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', filter: 'blur(40px)' }} />
            <Box sx={{ position: 'absolute', bottom: '10%', right: '10%', width: 300, height: 300, borderRadius: '50%', background: 'rgba(99, 102, 241, 0.2)', filter: 'blur(50px)' }} />

            <Container maxWidth="xs" sx={{ position: 'relative', zIndex: 1 }}>
                <Paper
                    elevation={0}
                    sx={{
                        p: 5,
                        borderRadius: 5,
                        background: 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                    }}
                >
                    {/* Header */}
                    <Box sx={{ textAlign: 'center', mb: 5 }}>
                        <Typography variant="h4" fontWeight="900" sx={{ backgroundImage: 'linear-gradient(45deg, #4f46e5, #ec4899)', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent', mb: 1 }}>
                            OLYMPIA HR
                        </Typography>
                        <Typography variant="body2" color="text.secondary" fontWeight="500">
                            Accédez à votre espace sécurisé
                        </Typography>
                    </Box>

                    {/* Error Alert */}
                    {error && (
                        <Alert severity="error" variant="outlined" sx={{ mb: 3, borderRadius: 2, bgcolor: 'rgba(211, 47, 47, 0.05)' }}>
                            {error}
                        </Alert>
                    )}

                    {/* Login Form */}
                    <Box component="form" onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            label="Email Professionnel"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            margin="normal"
                            required
                            variant="outlined"
                            InputProps={{
                                sx: { borderRadius: 3, bgcolor: 'white' },
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Email sx={{ color: 'primary.main', fontSize: 20 }} />
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <TextField
                            fullWidth
                            label="Mot de passe"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password}
                            onChange={handleChange}
                            margin="normal"
                            required
                            InputProps={{
                                sx: { borderRadius: 3, bgcolor: 'white' },
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Lock sx={{ color: 'primary.main', fontSize: 20 }} />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOff sx={{ fontSize: 20 }} /> : <Visibility sx={{ fontSize: 20 }} />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                            <Link
                                component="button"
                                variant="caption"
                                onClick={() => setForgotDialogOpen(true)}
                                sx={{ color: 'primary.main', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                            >
                                Mot de passe oublié ?
                            </Link>
                        </Box>

                        <Button
                            fullWidth
                            type="submit"
                            variant="contained"
                            size="large"
                            disabled={loading}
                            sx={{
                                mt: 4,
                                py: 2,
                                borderRadius: 3,
                                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.4)',
                                '&:hover': {
                                    boxShadow: '0 20px 25px -5px rgba(99, 102, 241, 0.4)',
                                },
                            }}
                        >
                            {loading ? (
                                <CircularProgress size={24} color="inherit" />
                            ) : (
                                <Typography fontWeight="700">Se connecter</Typography>
                            )}
                        </Button>
                    </Box>

                    {/* Footer */}
                    <Box sx={{ mt: 5, textAlign: 'center' }}>
                        <Typography variant="caption" color="text.disabled" fontWeight="600">
                            Version 1.0.0 • © 2025 Olympia Intelligent Systems
                        </Typography>
                    </Box>
                </Paper>
            </Container>

            {/* Forgot Password Dialog */}
            <Dialog
                open={forgotDialogOpen}
                onClose={() => setForgotDialogOpen(false)}
                PaperProps={{ sx: { borderRadius: 4, p: 1, maxWidth: 400 } }}
            >
                <form onSubmit={handleForgotSubmit}>
                    <DialogTitle sx={{ fontWeight: 800 }}>Récupérer le compte</DialogTitle>
                    <DialogContent>
                        {resetSent ? (
                            <Box sx={{ py: 2, textAlign: 'center' }}>
                                <Info color="success" sx={{ fontSize: 40, mb: 2 }} />
                                <Typography variant="body2">
                                    Un email de réinitialisation a été envoyé à <strong>{resetEmail}</strong> s'il existe dans notre base.
                                </Typography>
                            </Box>
                        ) : (
                            <>
                                <Typography variant="body2" color="text.secondary" mb={3}>
                                    Saisissez votre adresse email professionnelle pour recevoir un lien de réinitialisation.
                                </Typography>
                                <TextField
                                    fullWidth
                                    label="Email"
                                    type="email"
                                    required
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    variant="outlined"
                                    InputProps={{ sx: { borderRadius: 3 } }}
                                />
                            </>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ p: 3 }}>
                        <Button onClick={() => setForgotDialogOpen(false)} color="inherit">
                            {resetSent ? 'Fermer' : 'Annuler'}
                        </Button>
                        {!resetSent && (
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={resetLoading}
                                sx={{ borderRadius: 2, px: 3 }}
                            >
                                {resetLoading ? <CircularProgress size={20} /> : 'Envoyer le lien'}
                            </Button>
                        )}
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
};


export default LoginPage;
