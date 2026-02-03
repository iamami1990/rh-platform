import moment from 'moment';

/**
 * Format a date to display format (DD/MM/YYYY)
 */
export const formatDate = (date) => {
    if (!date) return '-';
    return moment(date).format('DD/MM/YYYY');
};

/**
 * Format a time to display format (HH:mm)
 */
export const formatTime = (date) => {
    if (!date) return '-';
    return moment(date).format('HH:mm');
};

/**
 * Format a datetime to display format (DD/MM/YYYY à HH:mm)
 */
export const formatDateTime = (date) => {
    if (!date) return '-';
    return moment(date).format('DD/MM/YYYY à HH:mm');
};

/**
 * Get relative time (il y a 2 heures, etc.)
 */
export const getRelativeTime = (date) => {
    if (!date) return '-';
    return moment(date).fromNow();
};

/**
 * Format currency in TND
 */
export const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '-';
    return `${Number(amount).toFixed(3)} TND`;
};

/**
 * Get status color based on status value
 */
export const getStatusColor = (status) => {
    const statusColors = {
        present: '#4caf50',
        late: '#ff9800',
        absent: '#f44336',
        pending: '#ff9800',
        approved: '#4caf50',
        rejected: '#f44336',
    };
    return statusColors[status?.toLowerCase()] || '#666666';
};

/**
 * Get status label in French
 */
export const getStatusLabel = (status) => {
    const statusLabels = {
        present: 'Présent',
        late: 'Retard',
        absent: 'Absent',
        pending: 'En attente',
        approved: 'Approuvé',
        rejected: 'Rejeté',
        annual: 'Congé annuel',
        sick: 'Congé maladie',
        maternity: 'Congé maternité',
        unpaid: 'Congé sans solde',
    };
    return statusLabels[status?.toLowerCase()] || status;
};

/**
 * Calculate number of days between two dates
 */
export const calculateDaysBetween = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    const start = moment(startDate);
    const end = moment(endDate);
    return end.diff(start, 'days') + 1;
};
