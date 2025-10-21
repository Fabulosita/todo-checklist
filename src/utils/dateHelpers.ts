export const formatDate = (dateString?: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
};

export const isOverdue = (dueDate?: string): boolean => {
    if (!dueDate) return false;
    const today = new Date();
    const due = new Date(dueDate);
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    return due < today;
};

export const getTodayDateString = (): string => {
    const today = new Date();
    return today.toISOString().split('T')[0];
};