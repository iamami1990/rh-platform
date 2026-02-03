import { Paper, styled } from '@mui/material';

const GlassPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(3),
    borderRadius: theme.shape.borderRadius * 1.5,
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 12px 40px 0 rgba(31, 38, 135, 0.12)',
    },
}));

export default GlassPaper;
