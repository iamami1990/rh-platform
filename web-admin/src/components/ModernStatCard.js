import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import GlassPaper from './GlassPaper';

const ModernStatCard = ({ title, value, icon, color, trend }) => {
    return (
        <GlassPaper>
            <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                    <Typography variant="body2" color="text.secondary" fontWeight="600" gutterBottom>
                        {title}
                    </Typography>
                    <Typography variant="h4" fontWeight="800" color="text.primary">
                        {value}
                    </Typography>
                    {trend && (
                        <Box display="flex" alignItems="center" mt={1}>
                            <Typography
                                variant="caption"
                                fontWeight="700"
                                sx={{
                                    color: trend.startsWith('+') ? 'success.main' : 'error.main',
                                    bgcolor: trend.startsWith('+') ? 'success.light' : 'error.light',
                                    px: 1,
                                    py: 0.2,
                                    borderRadius: 1,
                                    opacity: 0.8
                                }}
                            >
                                {trend}
                            </Typography>
                            <Typography variant="caption" color="text.disabled" sx={{ ml: 1 }}>
                                vs mois dernier
                            </Typography>
                        </Box>
                    )}
                </Box>
                <Avatar
                    sx={{
                        bgcolor: `${color}.light`,
                        color: `${color}.main`,
                        width: 56,
                        height: 56,
                        borderRadius: 3,
                        boxShadow: `0 8px 20px -6px ${color === 'primary' ? 'rgba(99, 102, 241, 0.4)' : 'rgba(0,0,0,0.1)'}`
                    }}
                >
                    {React.cloneElement(icon, { fontSize: 'medium' })}
                </Avatar>
            </Box>
        </GlassPaper>
    );
};

export default ModernStatCard;
