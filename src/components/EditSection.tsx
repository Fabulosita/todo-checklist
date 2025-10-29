import { useState } from 'react';

interface EditSectionProps {
    initialDueDate: string;
    onUpdate: (dueDate: string) => Promise<void>;
    onCancel: () => void;
}

export const EditSection = ({ initialDueDate, onUpdate, onCancel }: EditSectionProps) => {
    const [editingDueDate, setEditingDueDate] = useState(initialDueDate);
    const [isUpdating, setIsUpdating] = useState(false);

    const handleUpdate = async () => {
        setIsUpdating(true);
        try {
            await onUpdate(editingDueDate);
        } catch (error) {
            console.error('Failed to update due date:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="edit-section">
            <h3>Edit Due Date</h3>
            <div className="edit-due-date">
                <input
                    type="date"
                    value={editingDueDate}
                    onChange={(e) => setEditingDueDate(e.target.value)}
                    className="date-input"
                    disabled={isUpdating}
                />
                <button
                    onClick={handleUpdate}
                    className="update-btn"
                    disabled={isUpdating}
                >
                    {isUpdating ? 'Updating...' : 'Update'}
                </button>
                <button
                    onClick={onCancel}
                    className="cancel-btn"
                    disabled={isUpdating}
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};