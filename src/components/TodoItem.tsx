import React, { useState } from 'react';
import { Todo } from '../types/Todo';
import { formatDate, isOverdue } from '../utils/dateHelpers';
import { SubItemComponent } from './SubItemComponent';
import { AddSubItem } from './AddSubItem';
import { addSubItem, updateSubItem, deleteSubItem } from '../firebase-service';

interface TodoItemProps {
    todo: Todo;
    isSelected: boolean;
    onToggle: (id: string) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    onSelect: (id: string) => void;
}

export const TodoItem = ({ todo, isSelected, onToggle, onDelete, onSelect }: TodoItemProps) => {
    const [showSubItems, setShowSubItems] = useState(false);
    const [isAddingSubItem, setIsAddingSubItem] = useState(false);

    const handleToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        try {
            await onToggle(todo.id);
        } catch (error) {
            console.error('Failed to toggle todo:', error);
        }
    };

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await onDelete(todo.id);
        } catch (error) {
            console.error('Failed to delete todo:', error);
        }
    };

    const handleAddSubItem = async (text: string, dueDate?: string) => {
        try {
            await addSubItem(todo.id, text, dueDate);
            setIsAddingSubItem(false);
            setShowSubItems(true);
        } catch (error) {
            console.error('Failed to add sub-item:', error);
        }
    };

    const handleToggleSubItem = async (subItemId: string) => {
        try {
            const subItem = todo.subItems?.find(item => item.id === subItemId);
            if (subItem) {
                await updateSubItem(todo.id, subItemId, { completed: !subItem.completed });
            }
        } catch (error) {
            console.error('Failed to toggle sub-item:', error);
        }
    };

    const handleDeleteSubItem = async (subItemId: string) => {
        try {
            await deleteSubItem(todo.id, subItemId);
        } catch (error) {
            console.error('Failed to delete sub-item:', error);
        }
    };

    const handleEditSubItem = async (subItemId: string, newText: string) => {
        try {
            await updateSubItem(todo.id, subItemId, { text: newText });
        } catch (error) {
            console.error('Failed to edit sub-item:', error);
        }
    };

    const handleUpdateSubItemDueDate = async (subItemId: string, dueDate: string) => {
        try {
            await updateSubItem(todo.id, subItemId, { dueDate: dueDate || undefined });
        } catch (error) {
            console.error('Failed to update sub-item due date:', error);
        }
    };

    const toggleSubItems = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowSubItems(!showSubItems);
    };

    const handleAddSubItemClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsAddingSubItem(true);
        setShowSubItems(true);
    };

    const subItemsCount = todo.subItems?.length || 0;
    const completedSubItems = todo.subItems?.filter(item => item.completed).length || 0;

    const className = [
        todo.completed ? 'completed' : '',
        isSelected ? 'selected' : '',
        isOverdue(todo.dueDate) && !todo.completed ? 'overdue' : '',
    ].filter(Boolean).join(' ');

    return (
        <div style={styles.todoContainer}>
            <div
                className={className}
                onClick={() => onSelect(todo.id)}
                style={{
                    ...styles.todoItem,
                    // Override CSS border with our inline styles
                    border: isSelected ? '2px solid #61dafb' :
                        (isOverdue(todo.dueDate) && !todo.completed ? '2px solid #dc3545' : '1px solid #e9ecef'),
                    // Ensure consistent width regardless of content
                    width: '100%',
                    boxSizing: 'border-box',
                }}
            >
                <div style={styles.todoMain}>
                    <input
                        type="checkbox"
                        checked={todo.completed}
                        onChange={handleToggle}
                        style={styles.checkbox}
                    />
                    <div className="todo-content" style={styles.todoContent}>
                        <span className="todo-text" style={styles.todoText}>{todo.text}</span>
                        {todo.dueDate && (
                            <span className="due-date" style={styles.dueDate}>
                                Due: {formatDate(todo.dueDate)}
                            </span>
                        )}
                        {subItemsCount > 0 && (
                            <span style={styles.subItemsCounter}>
                                {completedSubItems}/{subItemsCount} sub-items
                            </span>
                        )}
                    </div>
                    <div style={styles.todoActions}>
                        {subItemsCount > 0 && (
                            <button
                                onClick={toggleSubItems}
                                style={styles.expandButton}
                                title={showSubItems ? "Hide sub-items" : "Show sub-items"}
                            >
                                {showSubItems ? "▼" : "▶"}
                            </button>
                        )}
                        <button
                            onClick={handleAddSubItemClick}
                            style={styles.addSubItemButton}
                            title="Add sub-item"
                        >
                            +
                        </button>
                        <button
                            onClick={handleDelete}
                            className="delete-btn"
                            style={styles.deleteButton}
                            title="Delete todo"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>

            {showSubItems && (
                <div style={styles.subItemsContainer}>
                    {todo.subItems?.map(subItem => (
                        <SubItemComponent
                            key={subItem.id}
                            subItem={subItem}
                            onToggle={handleToggleSubItem}
                            onDelete={handleDeleteSubItem}
                            onEdit={handleEditSubItem}
                            onUpdateDueDate={handleUpdateSubItemDueDate}
                        />
                    ))}
                </div>
            )}

            {isAddingSubItem && (
                <AddSubItem
                    onAdd={handleAddSubItem}
                    onCancel={() => setIsAddingSubItem(false)}
                />
            )}
        </div>
    );
};

const styles = {
    todoContainer: {
        marginBottom: '8px',
        width: '100%',
    },
    todoItem: {
        listStyle: 'none',
        margin: 0,
        padding: '15px',
        backgroundColor: '#3a3f47',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        width: '100%',
        boxSizing: 'border-box' as const,
        display: 'block',
    },
    todoMain: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        width: '100%',
    },
    checkbox: {
        width: '18px',
        height: '18px',
        margin: 0,
        cursor: 'pointer',
        flexShrink: 0,
    },
    todoContent: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '4px',
        textAlign: 'left' as const,
        minWidth: 0, // Allow text to wrap
    },
    todoText: {
        color: 'white',
        fontSize: '1rem',
        wordWrap: 'break-word' as const,
        overflow: 'hidden',
    },
    dueDate: {
        fontSize: '0.85rem',
        color: '#ccc',
    },
    subItemsCounter: {
        fontSize: '0.8rem',
        color: '#61dafb',
        fontWeight: 'bold',
    },
    todoActions: {
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        flexShrink: 0,
    },
    expandButton: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '0.9rem',
        color: '#ccc',
        transition: 'background-color 0.2s',
    },
    addSubItemButton: {
        background: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '50%',
        width: '28px',
        height: '28px',
        cursor: 'pointer',
        fontSize: '1.2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 0.2s',
        flexShrink: 0,
    },
    deleteButton: {
        background: '#dc3545',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        padding: '6px 12px',
        cursor: 'pointer',
        fontSize: '0.85rem',
        transition: 'background-color 0.2s',
        flexShrink: 0,
    },
    subItemsContainer: {
        marginTop: '4px',
        paddingLeft: '12px',
        width: '100%',
        boxSizing: 'border-box' as const,
    },
};