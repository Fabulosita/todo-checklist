import React, { useState } from 'react';
import { Todo } from '../types/Todo';
import { isOverdue } from '../utils/dateHelpers';

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

    // Get the current month and year
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

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
                                    ...(hasTodos ? styles.dayWithTodos : {})
                                }}
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
        padding: '20px',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        padding: '0 10px',
    },
    navigationSection: {
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
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
        minWidth: '200px',
        textAlign: 'center' as const,
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
    },
    dayHeaders: {
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '1px',
        marginBottom: '1px',
    },
    dayHeader: {
        padding: '12px',
        backgroundColor: '#2a2e35',
        color: '#ccc',
        textAlign: 'center' as const,
        fontWeight: 'bold',
        fontSize: '14px',
    },
    calendarGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '1px',
        backgroundColor: '#434954',
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
};