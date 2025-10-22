import React from 'react';
import { SubItem } from '../types/Todo';

interface SubItemComponentProps {
    subItem: SubItem;
    onToggle: (subItemId: string) => void;
    onDelete: (subItemId: string) => void;
    onEdit: (subItemId: string, newText: string) => void;
    onUpdateDueDate: (subItemId: string, dueDate: string) => void;
}

export const SubItemComponent: React.FC<SubItemComponentProps> = ({
    subItem,
    onToggle,
    onDelete,
    onEdit,
    onUpdateDueDate
}) => {
    const [isEditing, setIsEditing] = React.useState(false);
    const [editText, setEditText] = React.useState(subItem.text);
    const [isEditingDueDate, setIsEditingDueDate] = React.useState(false);
    const [editDueDate, setEditDueDate] = React.useState(subItem.dueDate || '');

    const handleEdit = () => {
        if (isEditing && editText.trim() !== subItem.text) {
            onEdit(subItem.id, editText.trim());
        }
        setIsEditing(!isEditing);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleEdit();
        } else if (e.key === 'Escape') {
            setEditText(subItem.text);
            setIsEditing(false);
        }
    };

    const handleDueDateEdit = () => {
        if (isEditingDueDate) {
            onUpdateDueDate(subItem.id, editDueDate);
        }
        setIsEditingDueDate(!isEditingDueDate);
    };

    const handleDueDateKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleDueDateEdit();
        } else if (e.key === 'Escape') {
            setEditDueDate(subItem.dueDate || '');
            setIsEditingDueDate(false);
        }
    };

    // Check if due date is overdue
    const isDueDateOverdue = () => {
        if (!subItem.dueDate) return false;
        const today = new Date();
        const dueDate = new Date(subItem.dueDate);
        return dueDate < today && !subItem.completed;
    };

    return (
        <div style={styles.subItem}>
            <div style={styles.subItemContent}>
                <input
                    type="checkbox"
                    checked={subItem.completed}
                    onChange={() => onToggle(subItem.id)}
                    style={styles.checkbox}
                />

                {isEditing ? (
                    <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={handleKeyPress}
                        onBlur={handleEdit}
                        style={styles.editInput}
                        autoFocus
                    />
                ) : (
                    <div style={styles.textContainer}>
                        <span
                            style={{
                                ...styles.subItemText,
                                ...(subItem.completed ? styles.completedText : {})
                            }}
                            onDoubleClick={() => setIsEditing(true)}
                        >
                            {subItem.text}
                        </span>
                        {subItem.dueDate && (
                            <span
                                style={{
                                    ...styles.dueDateText,
                                    ...(isDueDateOverdue() ? styles.overdueDateText : {})
                                }}
                                onDoubleClick={() => setIsEditingDueDate(true)}
                                title="Double-click to edit due date"
                            >
                                Due: {new Date(subItem.dueDate).toLocaleDateString()}
                            </span>
                        )}
                        {isEditingDueDate && (
                            <input
                                type="date"
                                value={editDueDate}
                                onChange={(e) => setEditDueDate(e.target.value)}
                                onKeyDown={handleDueDateKeyPress}
                                onBlur={handleDueDateEdit}
                                style={styles.dueDateInput}
                                autoFocus
                            />
                        )}
                    </div>
                )}
            </div>

            <div style={styles.subItemActions}>
                <button
                    onClick={handleEdit}
                    style={styles.actionButton}
                    title={isEditing ? "Save" : "Edit"}
                >
                    {isEditing ? "✓" : "✏️"}
                </button>
                <button
                    onClick={() => setIsEditingDueDate(!isEditingDueDate)}
                    style={{
                        ...styles.actionButton,
                        ...(subItem.dueDate ? styles.dueDateSetButton : {})
                    }}
                    title={subItem.dueDate ? "Edit due date" : "Add due date"}
                >
                    📅
                </button>
                <button
                    onClick={() => onDelete(subItem.id)}
                    style={{ ...styles.actionButton, ...styles.deleteButton }}
                    title="Delete"
                >
                    🗑️
                </button>
            </div>
        </div>
    );
};

const styles = {
    subItem: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        marginLeft: '24px',
        backgroundColor: '#2a2e35',
        border: '1px solid #434954',
        borderRadius: '6px',
        marginBottom: '4px',
        transition: 'all 0.2s ease',
        width: 'calc(100% - 24px)',
        boxSizing: 'border-box' as const,
    },
    subItemContent: {
        display: 'flex',
        alignItems: 'center',
        flex: 1,
        gap: '8px',
        minWidth: 0,
    },
    checkbox: {
        width: '16px',
        height: '16px',
        margin: 0,
        cursor: 'pointer',
        flexShrink: 0,
    },
    textContainer: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '2px',
        minWidth: 0,
    },
    subItemText: {
        fontSize: '0.9rem',
        color: '#ccc',
        cursor: 'pointer',
        wordWrap: 'break-word' as const,
        overflow: 'hidden',
    },
    dueDateText: {
        fontSize: '0.75rem',
        color: '#999',
        cursor: 'pointer',
        fontStyle: 'italic',
    },
    overdueDateText: {
        color: '#ff6b6b',
        fontWeight: 'bold',
    },
    completedText: {
        textDecoration: 'line-through',
        color: '#777',
        opacity: 0.7,
    },
    editInput: {
        flex: 1,
        padding: '4px 8px',
        border: '1px solid #007bff',
        borderRadius: '4px',
        fontSize: '0.9rem',
        outline: 'none',
        backgroundColor: '#434954',
        color: 'white',
        minWidth: 0,
    },
    dueDateInput: {
        padding: '2px 4px',
        border: '1px solid #007bff',
        borderRadius: '4px',
        fontSize: '0.75rem',
        outline: 'none',
        backgroundColor: '#434954',
        color: 'white',
        marginTop: '2px',
    },
    subItemActions: {
        display: 'flex',
        gap: '4px',
        opacity: 0.7,
        flexShrink: 0,
    },
    actionButton: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '4px',
        borderRadius: '4px',
        fontSize: '0.8rem',
        transition: 'background-color 0.2s',
        color: '#ccc',
    },
    dueDateSetButton: {
        color: '#007bff',
    },
    deleteButton: {
        opacity: 0.6,
    },
};