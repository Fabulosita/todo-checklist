export const formatDate = (dateString?: string): string => {
    if (!dateString) return '';

    // Parse the date as a local date to avoid timezone issues
    // If the dateString is in YYYY-MM-DD format, create a local date
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day); // month is 0-indexed
        return date.toLocaleDateString();
    }

    // Fallback for other date formats
    const date = new Date(dateString);
    return date.toLocaleDateString();
};

export const isOverdue = (dueDate?: string): boolean => {
    if (!dueDate) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let due: Date;
    // Parse the date as a local date to avoid timezone issues
    if (dueDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dueDate.split('-').map(Number);
        due = new Date(year, month - 1, day); // month is 0-indexed
    } else {
        due = new Date(dueDate);
    }

    due.setHours(0, 0, 0, 0);
    return due < today;
};

export const getTodayDateString = (): string => {
    const today = new Date();
    return today.toISOString().split('T')[0];
};

export const formatDateForInput = (dateString?: string): string => {
    if (!dateString) return '';

    // If it's already in YYYY-MM-DD format, return as is
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateString;
    }

    // Try to parse and convert to YYYY-MM-DD format
    try {
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
        }
    } catch (error) {
        console.error('Error formatting date for input:', error);
    }

    return '';
};