import React, { useState } from 'react';

interface AddSubItemProps {
    onAdd: (text: string, dueDate?: string) => void;
    onCancel: () => void;
}

export const AddSubItem: React.FC<AddSubItemProps> = ({ onAdd, onCancel }) => {
    const [text, setText] = useState('');
    const [dueDate, setDueDate] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (text.trim()) {
            onAdd(text.trim(), dueDate || undefined);
            setText('');
            setDueDate('');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onCancel();
        }
    };

    return (
        <div style={styles.container}>
            <form onSubmit={handleSubmit} style={styles.form}>
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Add a sub-item..."
                    style={styles.input}
                    autoFocus
                />
                <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    onKeyDown={handleKeyPress}
                    style={styles.dateInput}
                    placeholder="Due date (optional)"
                />
                <div style={styles.actions}>
                    <button type="submit" style={styles.addButton} disabled={!text.trim()}>
                        Add
                    </button>
                    <button type="button" onClick={onCancel} style={styles.cancelButton}>
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

const styles = {
    container: {
        marginLeft: '24px',
        marginBottom: '8px',
        width: 'calc(100% - 24px)',
        boxSizing: 'border-box' as const,
    },
    form: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '8px',
        padding: '12px',
        backgroundColor: '#2a2e35',
        border: '2px dashed #434954',
        borderRadius: '6px',
        width: '100%',
        boxSizing: 'border-box' as const,
    },
    input: {
        padding: '8px 12px',
        border: '1px solid #434954',
        borderRadius: '4px',
        fontSize: '0.9rem',
        outline: 'none',
        transition: 'border-color 0.2s',
        backgroundColor: '#434954',
        color: 'white',
        width: '100%',
        boxSizing: 'border-box' as const,
    },
    dateInput: {
        padding: '6px 8px',
        border: '1px solid #434954',
        borderRadius: '4px',
        fontSize: '0.85rem',
        outline: 'none',
        transition: 'border-color 0.2s',
        backgroundColor: '#434954',
        color: 'white',
        width: '100%',
        boxSizing: 'border-box' as const,
    },
    actions: {
        display: 'flex',
        gap: '8px',
        justifyContent: 'flex-end',
    },
    addButton: {
        padding: '6px 12px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        fontSize: '0.85rem',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
    },
    cancelButton: {
        padding: '6px 12px',
        backgroundColor: 'transparent',
        color: '#ccc',
        border: '1px solid #434954',
        borderRadius: '4px',
        fontSize: '0.85rem',
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
};