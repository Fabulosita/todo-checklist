import React, { useState } from 'react';
import { Todo } from '../types/Todo';
import { isOverdue } from '../utils/dateHelpers';

// Add CSS keyframes for sidebar animation
const sidebarStyles = `
@keyframes slideIn {
    from {
        transform: translateX(100%);
    }
    to {
        transform: translateX(0);
    }
}
`;

interface TimelineViewProps {
    todos: Todo[];
    onToggleTodo: (id: string) => Promise<void>;
    onDeleteTodo: (id: string) => Promise<void>;
    onSelectTodo: (id: string) => void;
    selectedTodoId: string | null;
}

interface CalendarDay {
    date: Date;
    dateString: string;
    isCurrentMonth: boolean;
    todos: Todo[];
}

export const TimelineView: React.FC<TimelineViewProps> = ({
    todos,
    onToggleTodo,
    onDeleteTodo,
    onSelectTodo,
    selectedTodoId
}) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [sidebarVisible, setSidebarVisible] = useState(false);

    // Get the current month and year
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Handle date click for sidebar
    const handleDateClick = (dateString: string) => {
        setSelectedDate(dateString);
        setSidebarVisible(true);
    };

    // Handle sidebar close
    const handleSidebarClose = () => {
        setSidebarVisible(false);
        setSelectedDate(null);
    };

    // Get todos for selected date
    const getSelectedDateTodos = (): Todo[] => {
        if (!selectedDate) return [];
        return getTodosForDate(selectedDate);
    };

    // Format date for display
    const formatSelectedDate = (): string => {
        if (!selectedDate) return '';
        const date = new Date(selectedDate + 'T00:00:00');
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Helper function to get all todos for a specific date
    const getTodosForDate = (dateString: string): Todo[] => {
        return todos.filter(todo => {
            if (!todo.dueDate) return false;
            return todo.dueDate === dateString;
        });
    };

    // Generate calendar days
    const generateCalendarDays = (): CalendarDay[] => {
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
        const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday

        const days: CalendarDay[] = [];

        // Add previous month's trailing days
        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
            const date = new Date(currentYear, currentMonth, -i);
            const dateString = date.toISOString().split('T')[0];
            days.push({
                date,
                dateString,
                isCurrentMonth: false,
                todos: getTodosForDate(dateString)
            });
        }

        // Add current month's days
        for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
            const date = new Date(currentYear, currentMonth, day);
            const dateString = date.toISOString().split('T')[0];
            days.push({
                date,
                dateString,
                isCurrentMonth: true,
                todos: getTodosForDate(dateString)
            });
        }

        // Add next month's leading days to complete the week
        const remainingDays = 42 - days.length; // 6 weeks * 7 days
        for (let day = 1; day <= remainingDays; day++) {
            const date = new Date(currentYear, currentMonth + 1, day);
            const dateString = date.toISOString().split('T')[0];
            days.push({
                date,
                dateString,
                isCurrentMonth: false,
                todos: getTodosForDate(dateString)
            });
        }

        return days;
    };

    const calendarDays = generateCalendarDays();

    const goToPreviousMonth = () => {
        setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div style={styles.container}>
            {/* Inject CSS for animations */}
            <style>{sidebarStyles}</style>

            <div style={styles.header}>
                <div style={styles.navigationSection}>
                    <button onClick={goToPreviousMonth} style={styles.navButton}>
                        ◀
                    </button>
                    <div style={styles.monthYear}>
                        {monthNames[currentMonth]} {currentYear}
                    </div>
                    <button onClick={goToNextMonth} style={styles.navButton}>
                        ▶
                    </button>
                </div>
                <button onClick={goToToday} style={styles.todayButton}>
                    Today
                </button>
            </div>

            <div style={styles.calendar}>
                {/* Day headers */}
                <div style={styles.dayHeaders}>
                    {dayNames.map(day => (
                        <div key={day} style={styles.dayHeader}>
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar grid */}
                <div style={styles.calendarGrid}>
                    {calendarDays.map((calendarDay, index) => {
                        const isToday = calendarDay.dateString === new Date().toISOString().split('T')[0];
                        const hasTodos = calendarDay.todos.length > 0;

                        return (
                            <div
                                key={index}
                                style={{
                                    ...styles.calendarDay,
                                    ...(calendarDay.isCurrentMonth ? {} : styles.otherMonthDay),
                                    ...(isToday ? styles.todayDay : {}),
                                    ...(hasTodos ? styles.dayWithTodos : {}),
                                    ...(selectedDate === calendarDay.dateString ? styles.selectedDay : {})
                                }}
                                onClick={() => handleDateClick(calendarDay.dateString)}
                            >
                                <div style={styles.dayNumber}>
                                    {calendarDay.date.getDate()}
                                </div>

                                {calendarDay.todos.length > 0 && (
                                    <div style={styles.todosContainer}>
                                        {calendarDay.todos.map(todo => (
                                            <div
                                                key={todo.id}
                                                style={{
                                                    ...styles.todoItem,
                                                    ...(todo.completed ? styles.completedTodo : {}),
                                                    ...(isOverdue(todo.dueDate) && !todo.completed ? styles.overdueTodo : {}),
                                                    ...(selectedTodoId === todo.id ? styles.selectedTodo : {})
                                                }}
                                                onClick={() => onSelectTodo(todo.id)}
                                                title={todo.text}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={todo.completed}
                                                    onChange={(e) => {
                                                        e.stopPropagation();
                                                        onToggleTodo(todo.id);
                                                    }}
                                                    style={styles.checkbox}
                                                />
                                                <span style={styles.todoText}>
                                                    {todo.text.length > 20 ? `${todo.text.substring(0, 20)}...` : todo.text}
                                                </span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDeleteTodo(todo.id);
                                                    }}
                                                    style={styles.deleteButton}
                                                    title="Delete todo"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                        {calendarDay.todos.length > 3 && (
                                            <div style={styles.moreTodos}>
                                                +{calendarDay.todos.length - 3} more
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Date Details Sidebar */}
            {sidebarVisible && (
                <div style={styles.sidebarOverlay} onClick={handleSidebarClose}>
                    <div style={styles.sidebar} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.sidebarHeader}>
                            <h3 style={styles.sidebarTitle}>{formatSelectedDate()}</h3>
                            <button
                                style={styles.closeButton}
                                onClick={handleSidebarClose}
                                title="Close"
                            >
                                ✕
                            </button>
                        </div>

                        <div style={styles.sidebarContent}>
                            {getSelectedDateTodos().length > 0 ? (
                                <div>
                                    <h4 style={styles.sectionTitle}>
                                        Tasks for this day ({getSelectedDateTodos().length})
                                    </h4>
                                    <div style={styles.todosList}>
                                        {getSelectedDateTodos().map(todo => (
                                            <div
                                                key={todo.id}
                                                style={{
                                                    ...styles.sidebarTodoItem,
                                                    ...(todo.completed ? styles.completedSidebarTodo : {}),
                                                    ...(isOverdue(todo.dueDate) && !todo.completed ? styles.overdueSidebarTodo : {}),
                                                    ...(selectedTodoId === todo.id ? styles.selectedSidebarTodo : {})
                                                }}
                                                onClick={() => onSelectTodo(todo.id)}
                                            >
                                                <div style={styles.sidebarTodoHeader}>
                                                    <input
                                                        type="checkbox"
                                                        checked={todo.completed}
                                                        onChange={(e) => {
                                                            e.stopPropagation();
                                                            onToggleTodo(todo.id);
                                                        }}
                                                        style={styles.sidebarCheckbox}
                                                    />
                                                    <span style={styles.sidebarTodoText}>
                                                        {todo.text}
                                                    </span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onDeleteTodo(todo.id);
                                                        }}
                                                        style={styles.sidebarDeleteButton}
                                                        title="Delete task"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>

                                                {/* Show sub-items if any */}
                                                {todo.subItems && todo.subItems.length > 0 && (
                                                    <div style={styles.subItemsSection}>
                                                        <div style={styles.subItemsTitle}>
                                                            Sub-items ({todo.subItems.length})
                                                        </div>
                                                        {todo.subItems.map(subItem => (
                                                            <div
                                                                key={subItem.id}
                                                                style={{
                                                                    ...styles.sidebarSubItem,
                                                                    ...(subItem.completed ? styles.completedSidebarTodo : {})
                                                                }}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={subItem.completed}
                                                                    readOnly
                                                                    style={styles.sidebarCheckbox}
                                                                />
                                                                <span style={styles.sidebarSubItemText}>
                                                                    {subItem.text}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div style={styles.emptyState}>
                                    <div style={styles.emptyStateIcon}>📅</div>
                                    <p style={styles.emptyStateText}>No tasks scheduled for this day</p>
                                </div>
                            )}
                        </div>
                    </div>
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
        padding: '20px',
        boxSizing: 'border-box' as const,
        overflow: 'hidden',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        padding: '0 10px',
        flexWrap: 'wrap' as const,
        gap: '10px',
    },
    navigationSection: {
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        flexWrap: 'wrap' as const,
    },
    navButton: {
        background: '#3a3f47',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        padding: '8px 12px',
        cursor: 'pointer',
        fontSize: '16px',
        transition: 'background-color 0.2s',
    },
    monthYear: {
        fontSize: '1.5rem',
        fontWeight: 'bold',
        color: 'white',
        minWidth: '150px',
        textAlign: 'center' as const,
        flex: '0 0 auto',
    },
    todayButton: {
        background: '#61dafb',
        color: '#1a1d23',
        border: 'none',
        borderRadius: '6px',
        padding: '8px 16px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 'bold',
        transition: 'background-color 0.2s',
    },
    calendar: {
        width: '100%',
        overflow: 'hidden',
    },
    dayHeaders: {
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '1px',
        marginBottom: '1px',
        width: '100%',
    },
    dayHeader: {
        padding: '12px',
        backgroundColor: '#2a2e35',
        color: '#ccc',
        textAlign: 'center' as const,
        fontWeight: 'bold',
        fontSize: '14px',
        minWidth: 0, // Allow shrinking
    },
    calendarGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '1px',
        backgroundColor: '#434954',
        width: '100%',
    },
    calendarDay: {
        minHeight: '120px',
        backgroundColor: '#2a2e35',
        padding: '8px',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        position: 'relative' as const,
        display: 'flex',
        flexDirection: 'column' as const,
        minWidth: 0, // Allow shrinking
        overflow: 'hidden',
        boxSizing: 'border-box' as const,
    },
    otherMonthDay: {
        backgroundColor: '#1a1d23',
        opacity: 0.5,
    },
    todayDay: {
        backgroundColor: '#2a3a4a',
        border: '2px solid #61dafb',
    },
    dayWithTodos: {
        backgroundColor: '#2a2e35',
    },
    dayNumber: {
        color: 'white',
        fontSize: '14px',
        fontWeight: 'bold',
        marginBottom: '4px',
    },
    todosContainer: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '2px',
        overflow: 'hidden',
    },
    todoItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 4px',
        backgroundColor: '#3a3f47',
        borderRadius: '3px',
        fontSize: '11px',
        border: '1px solid transparent',
        transition: 'all 0.2s',
        cursor: 'pointer',
    },
    completedTodo: {
        opacity: 0.6,
        textDecoration: 'line-through',
    },
    overdueTodo: {
        backgroundColor: '#ef444420',
        borderColor: '#ef4444',
    },
    selectedTodo: {
        backgroundColor: '#61dafb20',
        borderColor: '#61dafb',
    },
    checkbox: {
        width: '10px',
        height: '10px',
        margin: 0,
        cursor: 'pointer',
        flexShrink: 0,
    },
    todoText: {
        color: 'white',
        flex: 1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap' as const,
    },
    deleteButton: {
        background: 'none',
        border: 'none',
        color: '#ef4444',
        cursor: 'pointer',
        fontSize: '10px',
        opacity: 0,
        transition: 'opacity 0.2s',
        flexShrink: 0,
    },
    moreTodos: {
        fontSize: '10px',
        color: '#61dafb',
        fontStyle: 'italic',
        textAlign: 'center' as const,
        padding: '2px',
    },
    // Selected day style
    selectedDay: {
        backgroundColor: '#61dafb15',
        border: '2px solid #61dafb',
    },
    // Sidebar styles
    sidebarOverlay: {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'stretch',
    },
    sidebar: {
        width: '400px',
        maxWidth: '90vw',
        backgroundColor: '#1a1d23',
        borderLeft: '1px solid #3a3f47',
        display: 'flex',
        flexDirection: 'column' as const,
        overflow: 'hidden',
        transform: 'translateX(0)',
        transition: 'transform 0.3s ease-out',
    },
    sidebarHeader: {
        padding: '20px',
        borderBottom: '1px solid #3a3f47',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#2a2e35',
    },
    sidebarTitle: {
        color: 'white',
        fontSize: '1.2rem',
        fontWeight: 'bold',
        margin: 0,
    },
    closeButton: {
        background: 'none',
        border: 'none',
        color: '#ccc',
        cursor: 'pointer',
        fontSize: '18px',
        padding: '4px',
        borderRadius: '4px',
        transition: 'background-color 0.2s, color 0.2s',
    },
    sidebarContent: {
        flex: 1,
        padding: '20px',
        overflow: 'auto',
    },
    sectionTitle: {
        color: '#61dafb',
        fontSize: '1rem',
        fontWeight: 'bold',
        margin: '0 0 15px 0',
    },
    todosList: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '10px',
    },
    sidebarTodoItem: {
        backgroundColor: '#2a2e35',
        borderRadius: '8px',
        padding: '15px',
        border: '1px solid #3a3f47',
        transition: 'all 0.2s',
        cursor: 'pointer',
    },
    completedSidebarTodo: {
        opacity: 0.7,
        backgroundColor: '#1f2937',
    },
    overdueSidebarTodo: {
        borderColor: '#ef4444',
        backgroundColor: '#ef444410',
    },
    selectedSidebarTodo: {
        borderColor: '#61dafb',
        backgroundColor: '#61dafb10',
    },
    sidebarTodoHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
    },
    sidebarCheckbox: {
        width: '16px',
        height: '16px',
        cursor: 'pointer',
        flexShrink: 0,
    },
    sidebarTodoText: {
        color: 'white',
        flex: 1,
        fontSize: '14px',
        textDecoration: 'none',
    },
    sidebarDeleteButton: {
        background: 'none',
        border: 'none',
        color: '#ef4444',
        cursor: 'pointer',
        fontSize: '16px',
        padding: '4px',
        borderRadius: '4px',
        transition: 'background-color 0.2s',
        flexShrink: 0,
    },
    subItemsSection: {
        marginTop: '10px',
        paddingTop: '10px',
        borderTop: '1px solid #3a3f47',
    },
    subItemsTitle: {
        color: '#9ca3af',
        fontSize: '12px',
        fontWeight: 'bold',
        marginBottom: '8px',
    },
    sidebarSubItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '5px 0',
        marginLeft: '10px',
    },
    sidebarSubItemText: {
        color: '#ccc',
        fontSize: '13px',
        flex: 1,
    },
    emptyState: {
        textAlign: 'center' as const,
        padding: '40px 20px',
        color: '#6b7280',
    },
    emptyStateIcon: {
        fontSize: '48px',
        marginBottom: '16px',
    },
    emptyStateText: {
        fontSize: '16px',
        margin: 0,
    },
};