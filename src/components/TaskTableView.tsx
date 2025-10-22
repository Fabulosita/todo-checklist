import React, { useState } from 'react';
import { Todo } from '../types/Todo';
import { formatDate, isOverdue } from '../utils/dateHelpers';
import { addSubItem } from '../firebase-service';

interface TaskTableViewProps {
    todos: Todo[];
    onToggleTodo: (id: string) => Promise<void>;
    onDeleteTodo: (id: string) => Promise<void>;
    onSelectTodo: (id: string) => void;
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
    selectedTodoId
}) => {
    const [expandedGroups, setExpandedGroups] = useState<string[]>(['Current Tasks']);
    const [hoveredTask, setHoveredTask] = useState<string | null>(null);

    const handleAddSubItem = async (todoId: string) => {
        const subItemText = prompt('Enter sub-item text:');
        if (subItemText && subItemText.trim()) {
            try {
                await addSubItem(todoId, subItemText.trim());
                // The real-time subscription will update the UI automatically
            } catch (error) {
                console.error('Error adding sub-item:', error);
                alert('Failed to add sub-item. Please try again.');
            }
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
                    <span style={styles.viewButton}>📊 All Tasks</span>
                    <span style={styles.viewButton}>📅 Timeline</span>
                    <span style={styles.viewButton}>📈 By Status</span>
                </div>
            </div>

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

                                    return (
                                        <div
                                            key={todo.id}
                                            style={{
                                                ...styles.taskRow,
                                                ...(selectedTodoId === todo.id ? styles.selectedTaskRow : {}),
                                                ...(hoveredTask === todo.id ? styles.hoveredTaskRow : {})
                                            }}
                                            onClick={() => onSelectTodo(todo.id)}
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
                                            </div>

                                            <div style={styles.dueDateCell}>
                                                {todo.dueDate ? (
                                                    <span
                                                        style={{
                                                            ...styles.dueDate,
                                                            ...(isOverdue(todo.dueDate) && !todo.completed ? styles.overdueDueDate : {})
                                                        }}
                                                    >
                                                        {formatDate(todo.dueDate)}
                                                    </span>
                                                ) : (
                                                    <span style={styles.noDueDate}>—</span>
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
        </div>
    );
};

const styles = {
    container: {
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        backgroundColor: '#1a1d23',
        borderRadius: '8px',
        overflow: 'hidden',
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
        borderRadius: '6px',
        fontSize: '0.85rem',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
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
};