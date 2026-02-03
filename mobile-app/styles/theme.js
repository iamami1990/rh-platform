// Thème et couleurs globaux de l'application
export const Colors = {
    primary: '#667eea',
    primaryDark: '#5568d3',
    primaryLight: '#7c8ef0',
    secondary: '#764ba2',

    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
    info: '#2196f3',

    background: '#f5f5f5',
    surface: '#ffffff',
    text: '#333333',
    textSecondary: '#666666',
    textLight: '#999999',

    border: '#e0e0e0',
    divider: '#eeeeee',

    // Status colors
    statusPresent: '#4caf50',
    statusLate: '#ff9800',
    statusAbsent: '#f44336',
    statusPending: '#ff9800',
    statusApproved: '#4caf50',
    statusRejected: '#f44336',
};

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
};

export const FontSizes = {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 24,
    xxxl: 32,
};

export const BorderRadius = {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 20,
    round: 999,
};

export const Shadows = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
};
