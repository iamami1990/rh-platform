// Enable date-fns if not already installed
// For now, provide a simple formatting function
export const format = (date, formatStr) => {
    const d = new Date(date);

    if (formatStr === 'yyyy-MM-dd') {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    if (formatStr === 'dd/MM/yyyy') {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${day}/${month}/${year}`;
    }

    if (formatStr === 'HH:mm') {
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    return d.toISOString();
};
