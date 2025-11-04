import React, { useState } from 'react';
import { Todo } from '../types/Todo';
import { formatDate, isOverdue, formatDateForInput } from '../utils/dateHelpers';
import { addSubItem, updateSubItem, deleteSubItem } from '../firebase-service';
import { TimelineView } from './TimelineView';

interface TaskTableViewProps {
    todos: Todo[];
    onToggleTodo: (id: string) => Promise<void>;
    onDeleteTodo: (id: string) => Promise<void>;
    onSelectTodo: (id: string) => void;
    onUpdateTodo: (id: string, updates: Partial<Todo>) => Promise<void>;
    selectedTodoId: string | null;
}

interface TaskGroup {
    name: string;
    tasks: Todo[];
    color: string;
    icon: string;
}

const STATUS_TYPES = {
    NEW: { label: 'New', color: '#6b7280', icon: '⚪' },
    IN_PROGRESS: { label: 'In Progress', color: '#f59e0b', icon: '🔄' },
    COMPLETED: { label: 'Completed', color: '#10b981', icon: '✅' },
    OVERDUE: { label: 'Overdue', color: '#ef4444', icon: '🔴' },
};

export const TaskTableView: React.FC<TaskTableViewProps> = ({
    todos,
    onToggleTodo,
    onDeleteTodo,
    onSelectTodo,
    onUpdateTodo,
    selectedTodoId
}) => {
    const [expandedGroups, setExpandedGroups] = useState<string[]>(['Current Tasks']);
    const [expandedTasks, setExpandedTasks] = useState<string[]>([]);
    const [hoveredTask, setHoveredTask] = useState<string | null>(null);
    const [editingDueDate, setEditingDueDate] = useState<string | null>(null);
    const [tempDueDate, setTempDueDate] = useState<string>('');
    const [addingSubItemToTask, setAddingSubItemToTask] = useState<string | null>(null);
    const [newSubItemText, setNewSubItemText] = useState<string>('');
    const [currentView, setCurrentView] = useState<'table' | 'timeline'>('table');

    const handleAddSubItem = async (todoId: string) => {
        // Show inline text field instead of prompt
        setAddingSubItemToTask(todoId);
        setNewSubItemText('');
        // Automatically expand the task to show the input field
        setExpandedTasks(prev =>
            prev.includes(todoId) ? prev : [...prev, todoId]
        );
    };

    const handleSaveNewSubItem = async (todoId: string) => {
        if (newSubItemText.trim()) {
            try {
                await addSubItem(todoId, newSubItemText.trim());
                // Clear the input and hide it
                setAddingSubItemToTask(null);
                setNewSubItemText('');
            } catch (error) {
                console.error('Error adding sub-item:', error);
                alert('Failed to add sub-item. Please try again.');
            }
        }
    };

    const handleCancelAddSubItem = () => {
        setAddingSubItemToTask(null);
        setNewSubItemText('');
    };

    const handleSubItemInputKeyPress = (e: React.KeyboardEvent, todoId: string) => {
        if (e.key === 'Enter') {
            handleSaveNewSubItem(todoId);
        } else if (e.key === 'Escape') {
            handleCancelAddSubItem();
        }
    };

    const handleToggleSubItem = async (todoId: string, subItemId: string) => {
        try {
            const todo = todos.find(t => t.id === todoId);
            const subItem = todo?.subItems?.find(item => item.id === subItemId);
            if (subItem) {
                await updateSubItem(todoId, subItemId, { completed: !subItem.completed });
            }
        } catch (error) {
            console.error('Failed to toggle sub-item:', error);
        }
    };

    const handleDeleteSubItem = async (todoId: string, subItemId: string) => {
        try {
            await deleteSubItem(todoId, subItemId);
        } catch (error) {
            console.error('Failed to delete sub-item:', error);
        }
    };

    const handleTaskClick = (todoId: string) => {
        onSelectTodo(todoId);
        // Toggle sub-items visibility when clicking on a task
        setExpandedTasks(prev =>
            prev.includes(todoId)
                ? prev.filter(id => id !== todoId)
                : [...prev, todoId]
        );
    };

    const handleDueDateClick = (todoId: string, currentDueDate?: string) => {
        setEditingDueDate(todoId);
        setTempDueDate(formatDateForInput(currentDueDate));
    };

    const handleDueDateSave = async (todoId: string) => {
        try {
            await onUpdateTodo(todoId, { dueDate: tempDueDate || undefined });
            setEditingDueDate(null);
            setTempDueDate('');
        } catch (error) {
            console.error('Failed to update due date:', error);
        }
    };

    const handleDueDateCancel = () => {
        setEditingDueDate(null);
        setTempDueDate('');
    };

    const handleDueDateKeyPress = (e: React.KeyboardEvent, todoId: string) => {
        if (e.key === 'Enter') {
            handleDueDateSave(todoId);
        } else if (e.key === 'Escape') {
            handleDueDateCancel();
        }
    };

    const handleSubItemDueDateClick = (todoId: string, subItemId: string, currentDueDate?: string) => {
        setEditingDueDate(`${todoId}-${subItemId}`);
        setTempDueDate(formatDateForInput(currentDueDate));
    };

    const handleSubItemDueDateSave = async (todoId: string, subItemId: string) => {
        try {
            await updateSubItem(todoId, subItemId, { dueDate: tempDueDate || undefined });
            setEditingDueDate(null);
            setTempDueDate('');
        } catch (error) {
            console.error('Failed to update sub-item due date:', error);
        }
    };

    const handleSubItemDueDateKeyPress = (e: React.KeyboardEvent, todoId: string, subItemId: string) => {
        if (e.key === 'Enter') {
            handleSubItemDueDateSave(todoId, subItemId);
        } else if (e.key === 'Escape') {
            handleDueDateCancel();
        }
    };

    const getTaskStatus = (todo: Todo) => {
        if (todo.completed) return 'COMPLETED';
        if (isOverdue(todo.dueDate)) return 'OVERDUE';
        if (todo.subItems && todo.subItems.length > 0) {
            const completedSubItems = todo.subItems.filter(item => item.completed).length;
            if (completedSubItems > 0 && completedSubItems < todo.subItems.length) {
                return 'IN_PROGRESS';
            }
        }
        return 'NEW';
    };

    const groupTasksByStatus = (): TaskGroup[] => {
        const groups: TaskGroup[] = [
            {
                name: 'Current Tasks',
                tasks: todos.filter(todo => !todo.completed && !isOverdue(todo.dueDate)),
                color: '#3b82f6',
                icon: '📋'
            },
            {
                name: 'Overdue Tasks',
                tasks: todos.filter(todo => !todo.completed && isOverdue(todo.dueDate)),
                color: '#ef4444',
                icon: '⚠️'
            },
            {
                name: 'Completed Tasks',
                tasks: todos.filter(todo => todo.completed),
                color: '#10b981',
                icon: '✅'
            }
        ];

        return groups.filter(group => group.tasks.length > 0);
    };

    const toggleGroup = (groupName: string) => {
        setExpandedGroups(prev =>
            prev.includes(groupName)
                ? prev.filter(name => name !== groupName)
                : [...prev, groupName]
        );
    };

    const taskGroups = groupTasksByStatus();

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h2 style={styles.title}>📋 Tasks</h2>
                <div style={styles.viewOptions}>
                    <button
                        style={{
                            ...styles.viewButton,
                            ...(currentView === 'table' ? styles.activeViewButton : {})
                        }}
                        onClick={() => setCurrentView('table')}
                    >
                        📊 All Tasks
                    </button>
                    <button
                        style={{
                            ...styles.viewButton,
                            ...(currentView === 'timeline' ? styles.activeViewButton : {})
                        }}
                        onClick={() => setCurrentView('timeline')}
                    >
                        📅 Timeline
                    </button>
                </div>
            </div>

            {currentView === 'timeline' ? (
                <TimelineView
                    todos={todos}
                    onToggleTodo={onToggleTodo}
                    onToggleSubItem={handleToggleSubItem}
                    onDeleteTodo={onDeleteTodo}
                    onSelectTodo={onSelectTodo}
                    selectedTodoId={selectedTodoId}
                />
            ) : (
                <div style={styles.tableContainer}>
                    <div style={styles.tableHeader}>
                        <div style={styles.nameColumn}>📝 Name</div>
                        <div style={styles.dueDateColumn}>📅 Due Date</div>
                        <div style={styles.statusColumn}>🏷️ Status</div>
                        <div style={styles.actionsColumn}>⚙️ Actions</div>
                    </div>

                    {taskGroups.map(group => (
                        <div key={group.name} style={styles.groupContainer}>
                            <div
                                style={{
                                    ...styles.groupHeader,
                                    backgroundColor: `${group.color}15`
                                }}
                                onClick={() => toggleGroup(group.name)}
                            >
                                <span style={styles.expandIcon}>
                                    {expandedGroups.includes(group.name) ? '▼' : '▶'}
                                </span>
                                <span style={styles.groupIcon}>{group.icon}</span>
                                <span style={styles.groupName}>{group.name}</span>
                                <span style={styles.taskCount}>({group.tasks.length})</span>
                            </div>

                            {expandedGroups.includes(group.name) && (
                                <div style={styles.tasksContainer}>
                                    {group.tasks.map(todo => {
                                        const status = getTaskStatus(todo);
                                        const statusInfo = STATUS_TYPES[status as keyof typeof STATUS_TYPES];
                                        const subItemsCount = todo.subItems?.length || 0;
                                        const completedSubItems = todo.subItems?.filter(item => item.completed).length || 0;
                                        const isTaskExpanded = expandedTasks.includes(todo.id);

                                        return (
                                            <div key={todo.id} style={styles.taskContainer}>
                                                <div
                                                    style={{
                                                        ...styles.taskRow,
                                                        ...(selectedTodoId === todo.id ? styles.selectedTaskRow : {}),
                                                        ...(hoveredTask === todo.id ? styles.hoveredTaskRow : {})
                                                    }}
                                                    onClick={() => handleTaskClick(todo.id)}
                                                    onMouseEnter={() => setHoveredTask(todo.id)}
                                                    onMouseLeave={() => setHoveredTask(null)}
                                                >
                                                    <div style={styles.nameCell}>
                                                        <input
                                                            type="checkbox"
                                                            checked={todo.completed}
                                                            onChange={(e) => {
                                                                e.stopPropagation();
                                                                onToggleTodo(todo.id);
                                                            }}
                                                            style={styles.checkbox}
                                                        />
                                                        <span
                                                            style={{
                                                                ...styles.taskText,
                                                                ...(todo.completed ? styles.completedTaskText : {})
                                                            }}
                                                        >
                                                            {todo.text}
                                                        </span>
                                                        {subItemsCount > 0 && (
                                                            <span style={styles.subItemsBadge}>
                                                                {completedSubItems}/{subItemsCount} sub-items
                                                            </span>
                                                        )}
                                                        {subItemsCount > 0 && (
                                                            <span style={styles.expandIndicator}>
                                                                {isTaskExpanded ? '▼' : '▶'}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div style={styles.dueDateCell}>
                                                        {editingDueDate === todo.id ? (
                                                            <input
                                                                type="date"
                                                                value={tempDueDate}
                                                                onChange={(e) => setTempDueDate(e.target.value)}
                                                                onKeyDown={(e) => handleDueDateKeyPress(e, todo.id)}
                                                                onBlur={() => handleDueDateSave(todo.id)}
                                                                style={styles.dueDateInput}
                                                                autoFocus
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
                                                        ) : todo.dueDate ? (
                                                            <span
                                                                style={{
                                                                    ...styles.dueDate,
                                                                    ...(isOverdue(todo.dueDate) && !todo.completed ? styles.overdueDueDate : {}),
                                                                    cursor: 'pointer'
                                                                }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDueDateClick(todo.id, todo.dueDate);
                                                                }}
                                                                title="Click to edit due date"
                                                            >
                                                                {formatDate(todo.dueDate)}
                                                            </span>
                                                        ) : (
                                                            <span
                                                                style={{
                                                                    ...styles.noDueDate,
                                                                    cursor: 'pointer'
                                                                }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDueDateClick(todo.id);
                                                                }}
                                                                title="Click to add due date"
                                                            >
                                                                Add due date
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div style={styles.statusCell}>
                                                        <span
                                                            style={{
                                                                ...styles.statusBadge,
                                                                backgroundColor: `${statusInfo.color}20`,
                                                                color: statusInfo.color,
                                                                border: `1px solid ${statusInfo.color}40`
                                                            }}
                                                        >
                                                            {statusInfo.icon} {statusInfo.label}
                                                        </span>
                                                    </div>

                                                    <div style={styles.actionsCell}>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleAddSubItem(todo.id);
                                                            }}
                                                            style={styles.addSubItemButton}
                                                            title="Add sub-item"
                                                        >
                                                            ➕
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onDeleteTodo(todo.id);
                                                            }}
                                                            style={styles.deleteButton}
                                                            title="Delete task"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                </div>

                                                {isTaskExpanded && (subItemsCount > 0 || addingSubItemToTask === todo.id) && (
                                                    <div style={styles.subItemsSection}>
                                                        {todo.subItems?.map(subItem => (
                                                            <div key={subItem.id} style={styles.subItemRow}>
                                                                <div style={styles.subItemNameCell}>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={subItem.completed}
                                                                        onChange={() => handleToggleSubItem(todo.id, subItem.id)}
                                                                        style={styles.checkbox}
                                                                    />
                                                                    <span
                                                                        style={{
                                                                            ...styles.subItemText,
                                                                            ...(subItem.completed ? styles.completedTaskText : {})
                                                                        }}
                                                                    >
                                                                        {subItem.text}
                                                                    </span>
                                                                </div>

                                                                <div style={styles.subItemDueDateCell}>
                                                                    {editingDueDate === `${todo.id}-${subItem.id}` ? (
                                                                        <input
                                                                            type="date"
                                                                            value={tempDueDate}
                                                                            onChange={(e) => setTempDueDate(e.target.value)}
                                                                            onKeyDown={(e) => handleSubItemDueDateKeyPress(e, todo.id, subItem.id)}
                                                                            onBlur={() => handleSubItemDueDateSave(todo.id, subItem.id)}
                                                                            style={styles.dueDateInput}
                                                                            autoFocus
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        />
                                                                    ) : subItem.dueDate ? (
                                                                        <span
                                                                            style={{
                                                                                ...styles.dueDate,
                                                                                ...(isOverdue(subItem.dueDate) && !subItem.completed ? styles.overdueDueDate : {}),
                                                                                cursor: 'pointer'
                                                                            }}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleSubItemDueDateClick(todo.id, subItem.id, subItem.dueDate);
                                                                            }}
                                                                            title="Click to edit due date"
                                                                        >
                                                                            {formatDate(subItem.dueDate)}
                                                                        </span>
                                                                    ) : (
                                                                        <span
                                                                            style={{
                                                                                ...styles.noDueDate,
                                                                                cursor: 'pointer'
                                                                            }}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleSubItemDueDateClick(todo.id, subItem.id);
                                                                            }}
                                                                            title="Click to add due date"
                                                                        >
                                                                            Add due date
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <div style={styles.subItemStatusCell}>
                                                                    <span style={{
                                                                        ...styles.statusBadge,
                                                                        backgroundColor: subItem.completed ? '#10b98120' : '#6b728020',
                                                                        color: subItem.completed ? '#10b981' : '#6b7280',
                                                                        border: `1px solid ${subItem.completed ? '#10b981' : '#6b7280'}40`
                                                                    }}>
                                                                        {subItem.completed ? '✅ Done' : '⚪ Todo'}
                                                                    </span>
                                                                </div>

                                                                <div style={styles.subItemActionsCell}>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleDeleteSubItem(todo.id, subItem.id);
                                                                        }}
                                                                        style={styles.deleteButton}
                                                                        title="Delete sub-item"
                                                                    >
                                                                        🗑️
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}

                                                        {addingSubItemToTask === todo.id && (
                                                            <div style={styles.subItemRow}>
                                                                <div style={styles.subItemNameCell}>
                                                                    <input
                                                                        type="text"
                                                                        value={newSubItemText}
                                                                        onChange={(e) => setNewSubItemText(e.target.value)}
                                                                        onKeyDown={(e) => handleSubItemInputKeyPress(e, todo.id)}
                                                                        onBlur={() => handleCancelAddSubItem()}
                                                                        placeholder="Enter sub-item text..."
                                                                        style={styles.subItemInput}
                                                                        autoFocus
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    />
                                                                </div>
                                                                <div style={styles.subItemDueDateCell}>
                                                                    <span style={styles.noDueDate}>—</span>
                                                                </div>
                                                                <div style={styles.subItemStatusCell}>
                                                                    <span style={{
                                                                        ...styles.statusBadge,
                                                                        backgroundColor: '#6b728020',
                                                                        color: '#6b7280',
                                                                        border: '1px solid #6b728040'
                                                                    }}>
                                                                        ⚪ Todo
                                                                    </span>
                                                                </div>
                                                                <div style={styles.subItemActionsCell}>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleSaveNewSubItem(todo.id);
                                                                        }}
                                                                        style={styles.saveButton}
                                                                        title="Save sub-item"
                                                                    >
                                                                        ✓
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleCancelAddSubItem();
                                                                        }}
                                                                        style={styles.cancelButton}
                                                                        title="Cancel"
                                                                    >
                                                                        ✕
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {group.tasks.length === 0 && (
                                        <div style={styles.emptyGroup}>
                                            No tasks in this group
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}

                    {todos.length === 0 && (
                        <div style={styles.emptyState}>
                            <div style={styles.emptyStateIcon}>📝</div>
                            <h3 style={styles.emptyStateTitle}>No tasks yet</h3>
                            <p style={styles.emptyStateText}>Create your first task above to get started!</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const styles = {
    container: {
        width: '100%',
        maxWidth: '100%',
        margin: '0 auto',
        backgroundColor: '#1a1d23',
        borderRadius: '8px',
        overflow: 'hidden',
        boxSizing: 'border-box' as const,
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 20px',
        backgroundColor: '#2a2e35',
        borderBottom: '1px solid #434954',
    },
    title: {
        fontSize: '1.5rem',
        fontWeight: 'bold',
        color: 'white',
        margin: 0,
    },
    viewOptions: {
        display: 'flex',
        gap: '12px',
    },
    viewButton: {
        padding: '6px 12px',
        backgroundColor: '#3a3f47',
        color: '#ccc',
        border: 'none',
        borderRadius: '6px',
        fontSize: '0.85rem',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
    },
    activeViewButton: {
        backgroundColor: '#61dafb',
        color: '#1a1d23',
    },
    tableContainer: {
        backgroundColor: '#1a1d23',
    },
    tableHeader: {
        display: 'grid',
        gridTemplateColumns: '1fr 150px 120px 120px',
        gap: '16px',
        padding: '12px 20px',
        backgroundColor: '#2a2e35',
        borderBottom: '1px solid #434954',
        fontSize: '0.85rem',
        fontWeight: 'bold',
        color: '#ccc',
    },
    nameColumn: {
        display: 'flex',
        alignItems: 'center',
        textAlign: 'left' as const,
    },
    dueDateColumn: {
        display: 'flex',
        alignItems: 'center',
    },
    statusColumn: {
        display: 'flex',
        alignItems: 'center',
    },
    actionsColumn: {
        display: 'flex',
        alignItems: 'center',
    },
    groupContainer: {
        marginBottom: '8px',
    },
    groupHeader: {
        display: 'flex',
        alignItems: 'center',
        padding: '12px 20px',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        borderLeft: '4px solid transparent',
    },
    expandIcon: {
        marginRight: '8px',
        fontSize: '0.8rem',
        color: '#ccc',
    },
    groupIcon: {
        marginRight: '8px',
        fontSize: '1rem',
    },
    groupName: {
        fontWeight: 'bold',
        color: 'white',
        flex: 1,
    },
    taskCount: {
        fontSize: '0.85rem',
        color: '#999',
    },
    tasksContainer: {
        backgroundColor: '#1a1d23',
    },
    taskRow: {
        display: 'grid',
        gridTemplateColumns: '1fr 150px 120px 120px',
        gap: '16px',
        padding: '12px 20px',
        borderBottom: '1px solid #2a2e35',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        ':hover': {
            backgroundColor: '#252930',
        },
    } as React.CSSProperties,
    selectedTaskRow: {
        backgroundColor: '#2a3a4a',
        borderLeft: '4px solid #61dafb',
    },
    hoveredTaskRow: {
        backgroundColor: '#252930',
    },
    nameCell: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        textAlign: 'left' as const,
    },
    checkbox: {
        width: '16px',
        height: '16px',
        cursor: 'pointer',
        flexShrink: 0,
    },
    taskText: {
        color: 'white',
        fontSize: '0.9rem',
        flex: 1,
        textAlign: 'left' as const,
    },
    completedTaskText: {
        textDecoration: 'line-through',
        opacity: 0.6,
    },
    subItemsBadge: {
        fontSize: '0.75rem',
        color: '#61dafb',
        backgroundColor: '#1e3a4a',
        padding: '2px 6px',
        borderRadius: '10px',
        marginLeft: '8px',
    },
    dueDateCell: {
        display: 'flex',
        alignItems: 'center',
    },
    dueDate: {
        fontSize: '0.85rem',
        color: '#ccc',
    },
    overdueDueDate: {
        color: '#ff6b6b',
        fontWeight: 'bold',
    },
    noDueDate: {
        fontSize: '0.85rem',
        color: '#666',
    },
    statusCell: {
        display: 'flex',
        alignItems: 'center',
    },
    statusBadge: {
        fontSize: '0.75rem',
        padding: '4px 8px',
        borderRadius: '12px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
    },
    actionsCell: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
    },
    addSubItemButton: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '4px',
        borderRadius: '4px',
        fontSize: '0.9rem',
        opacity: 0.6,
        transition: 'opacity 0.2s',
        color: '#61dafb',
    },
    deleteButton: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '4px',
        borderRadius: '4px',
        fontSize: '0.9rem',
        opacity: 0.6,
        transition: 'opacity 0.2s',
    },
    emptyGroup: {
        padding: '20px',
        textAlign: 'center' as const,
        color: '#666',
        fontStyle: 'italic',
    },
    emptyState: {
        padding: '60px 20px',
        textAlign: 'center' as const,
    },
    emptyStateIcon: {
        fontSize: '3rem',
        marginBottom: '16px',
    },
    emptyStateTitle: {
        color: 'white',
        fontSize: '1.25rem',
        fontWeight: 'bold',
        marginBottom: '8px',
    },
    emptyStateText: {
        color: '#999',
        fontSize: '0.9rem',
    },
    taskContainer: {
        marginBottom: '0',
    },
    expandIndicator: {
        fontSize: '0.8rem',
        color: '#61dafb',
        marginLeft: '8px',
        transition: 'transform 0.2s',
    },
    subItemsSection: {
        backgroundColor: '#1a1d23',
        borderTop: '1px solid #2a2e35',
        paddingLeft: '40px',
    },
    subItemRow: {
        display: 'grid',
        gridTemplateColumns: '1fr 150px 120px 120px',
        gap: '16px',
        padding: '8px 20px 8px 0',
        borderBottom: '1px solid #2a2e35',
        backgroundColor: '#1a1d23',
    },
    subItemCell: {
        display: 'flex',
        alignItems: 'center',
    },
    subItemNameCell: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        textAlign: 'left' as const,
    },
    subItemText: {
        color: '#ccc',
        fontSize: '0.85rem',
        flex: 1,
        textAlign: 'left' as const,
    },
    subItemDueDateCell: {
        display: 'flex',
        alignItems: 'center',
    },
    subItemStatusCell: {
        display: 'flex',
        alignItems: 'center',
    },
    subItemActionsCell: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
    },
    dueDateInput: {
        backgroundColor: '#3a3f47',
        border: '1px solid #61dafb',
        borderRadius: '4px',
        color: 'white',
        padding: '4px 8px',
        fontSize: '0.85rem',
        width: '120px',
    },
    subItemInput: {
        backgroundColor: '#3a3f47',
        border: '1px solid #61dafb',
        borderRadius: '4px',
        color: 'white',
        padding: '8px 12px',
        fontSize: '0.85rem',
        width: '100%',
        outline: 'none',
    },
    saveButton: {
        background: '#10b981',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        padding: '4px 8px',
        fontSize: '0.85rem',
        transition: 'background-color 0.2s',
    },
    cancelButton: {
        background: '#ef4444',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        padding: '4px 8px',
        fontSize: '0.85rem',
        transition: 'background-color 0.2s',
    },
};