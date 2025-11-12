import React, { useEffect, useState } from 'react';
import { Todo } from '../types/Todo';
import { formatDate, isOverdue, formatDateForInput } from '../utils/dateHelpers';
import { addSubItem, updateSubItem, deleteSubItem } from '../firebase-service';
import { TimelineView } from './TimelineView';
import { storageAdapter } from '../services/storageAdapter';

interface TaskTableViewProps {
    todos: Todo[];
    onToggleTodo: (id: string) => Promise<void>;
    onDeleteTodo: (id: string) => Promise<void>;
    onSelectTodo: (id: string) => void;
    onUpdateTodo: (id: string, updates: Partial<Todo>) => Promise<void>;
    selectedTodoId: string | null;
}

// Legacy status grouping (kept for reference but unused)

// Custom group model (Monday.com style)
interface CustomGroup {
    id: string;
    name: string;
    color?: string; // group accent color
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
    const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
    const [expandedTasks, setExpandedTasks] = useState<string[]>([]);
    const [hoveredTask, setHoveredTask] = useState<string | null>(null);
    const [editingDueDate, setEditingDueDate] = useState<string | null>(null);
    const [tempDueDate, setTempDueDate] = useState<string>('');
    const [addingSubItemToTask, setAddingSubItemToTask] = useState<string | null>(null);
    const [newSubItemText, setNewSubItemText] = useState<string>('');
    const [currentView, setCurrentView] = useState<'table' | 'timeline'>('table');

    // Custom groups state (for now: single group contains all tasks)
    const [groups, setGroups] = useState<CustomGroup[]>([]);
    const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
    const [tempGroupName, setTempGroupName] = useState<string>('');
    const [groupAssignments, setGroupAssignments] = useState<Record<string, string>>({});
    const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null); // highlights for task drop OR group reorder
    const [draggingGroupId, setDraggingGroupId] = useState<string | null>(null); // currently dragged group
    const [colorMenuGroupId, setColorMenuGroupId] = useState<string | null>(null); // which group's color menu is open
    // Per-group task add state (always-visible input per group)
    const [newTaskTextByGroup, setNewTaskTextByGroup] = useState<Record<string, string>>({});
    // Track pending adds so we can assign new tasks to their group once ID known
    const [pendingAdds, setPendingAdds] = useState<{ groupId: string; beforeIds: Set<string> }[]>([]);

    const FINISHED_GROUP_ID = 'finished';

    // Keys for persistence
    const EXPANDED_STORAGE_KEY = 'expandedTaskGroups';

    // Load groups from localStorage or initialize default (and restore expanded state, forcing Finished expanded if absent)
    useEffect(() => {
        try {
            const raw = localStorage.getItem('customTaskGroups');
            if (raw) {
                const parsed: CustomGroup[] = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    // Ensure Finished group exists
                    const hasFinished = parsed.some(g => g.id === FINISHED_GROUP_ID);
                    const nextGroups = hasFinished ? parsed : [...parsed, { id: FINISHED_GROUP_ID, name: 'Finished' }];
                    // Ensure each group has a color
                    const colored = nextGroups.map(g => ({
                        ...g,
                        color: g.color || (g.id === FINISHED_GROUP_ID ? '#22c55e' : '#7c5dfa')
                    }));
                    setGroups(colored);
                    // Restore expanded state if available
                    try {
                        const storedExpanded = localStorage.getItem(EXPANDED_STORAGE_KEY);
                        if (storedExpanded) {
                            const parsedExpanded: string[] = JSON.parse(storedExpanded);
                            if (Array.isArray(parsedExpanded)) {
                                // Respect user's previous choice exactly; do not force-finish open
                                setExpandedGroups(parsedExpanded);
                            } else {
                                // Default: expand all non-finished groups, keep Finished collapsed
                                setExpandedGroups(colored.filter(g => g.id !== FINISHED_GROUP_ID).map(g => g.id));
                            }
                        } else {
                            // Default: expand all non-finished groups, keep Finished collapsed
                            setExpandedGroups(colored.filter(g => g.id !== FINISHED_GROUP_ID).map(g => g.id));
                        }
                    } catch {
                        // Default fallback: expand all non-finished groups
                        setExpandedGroups(colored.filter(g => g.id !== FINISHED_GROUP_ID).map(g => g.id));
                    }
                    localStorage.setItem('customTaskGroups', JSON.stringify(colored));
                    return;
                }
            }
        } catch (e) {
            console.warn('Failed to parse customTaskGroups; initializing default.');
        }
        const id1 = `g-${Date.now()}`;
        const initial: CustomGroup[] = [
            { id: id1, name: 'All Tasks', color: '#7c5dfa' },
            { id: FINISHED_GROUP_ID, name: 'Finished', color: '#22c55e' }
        ];
        setGroups(initial);
        // Default: expand all non-finished groups; keep Finished collapsed
        setExpandedGroups(initial.filter(g => g.id !== FINISHED_GROUP_ID).map(g => g.id));
        localStorage.setItem('customTaskGroups', JSON.stringify(initial));
    }, []);

    // Load group assignments
    useEffect(() => {
        try {
            const raw = localStorage.getItem('taskGroupAssignments');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed === 'object') {
                    setGroupAssignments(parsed);
                }
            }
        } catch { }
    }, []);

    const saveGroups = (next: CustomGroup[]) => {
        setGroups(next);
        try {
            localStorage.setItem('customTaskGroups', JSON.stringify(next));
        } catch { }
    };

    const saveAssignments = (next: Record<string, string>) => {
        setGroupAssignments(next);
        try {
            localStorage.setItem('taskGroupAssignments', JSON.stringify(next));
        } catch { }
    };

    const addNewGroup = () => {
        const idx = groups.length + 1;
        const newGroup: CustomGroup = { id: `g-${Date.now()}`, name: `New Group ${idx}` };
        const next = [...groups, newGroup];
        saveGroups(next);
        setExpandedGroups(prev => [...prev, newGroup.id]);
    };

    const startRenameGroup = (groupId: string, currentName: string) => {
        // Used when clicking the group title to initiate rename
        setEditingGroupId(groupId);
        setTempGroupName(currentName);
    };

    const commitRenameGroup = () => {
        if (!editingGroupId) return;
        const trimmed = tempGroupName.trim() || 'Untitled Group';
        const next = groups.map(g => (g.id === editingGroupId ? { ...g, name: trimmed } : g));
        saveGroups(next);
        setEditingGroupId(null);
        setTempGroupName('');
    };

    const updateGroupColor = (groupId: string, color: string) => {
        const next = groups.map(g => (g.id === groupId ? { ...g, color } : g));
        saveGroups(next);
        setColorMenuGroupId(null);
    };

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

    // Sort helper: chronological by due date (undated tasks at the end)
    const sortByDueDateAsc = (a: Todo, b: Todo) => {
        const toLocalDateMs = (dateString?: string): number => {
            if (!dateString) return Number.POSITIVE_INFINITY; // undated last
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
                const [y, m, d] = dateString.split('-').map(Number);
                return new Date(y, m - 1, d).getTime();
            }
            const t = new Date(dateString).getTime();
            return isNaN(t) ? Number.POSITIVE_INFINITY : t;
        };
        return toLocalDateMs(a.dueDate) - toLocalDateMs(b.dueDate);
    };

    const toggleGroup = (groupId: string) => {
        setExpandedGroups(prev => {
            const next = prev.includes(groupId)
                ? prev.filter(id => id !== groupId)
                : [...prev, groupId];
            // Persist expanded state
            try {
                localStorage.setItem(EXPANDED_STORAGE_KEY, JSON.stringify(next));
            } catch { }
            return next;
        });
    };

    const assignTaskToGroup = (todoId: string, groupId: string) => {
        const next = { ...groupAssignments, [todoId]: groupId };
        saveAssignments(next);
    };

    const handleDragStart = (e: React.DragEvent, todoId: string) => {
        e.dataTransfer.setData('text/plain', todoId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOverGroup = (e: React.DragEvent, groupId: string) => {
        e.preventDefault();
        // Distinguish between group reordering and task assignment via custom mime type
        const isGroupDrag = e.dataTransfer.types.includes('application/x-group-id');
        if (isGroupDrag) {
            e.dataTransfer.dropEffect = 'move';
            if (draggingGroupId !== groupId) setDragOverGroupId(groupId);
            return;
        }
        // Task drag
        e.dataTransfer.dropEffect = 'move';
        setDragOverGroupId(groupId);
    };

    const handleDragLeaveGroup = (_e: React.DragEvent, groupId: string) => {
        if (dragOverGroupId === groupId) setDragOverGroupId(null);
    };

    const reorderGroups = (sourceId: string, targetId: string) => {
        if (sourceId === targetId) return;
        const sourceIndex = groups.findIndex(g => g.id === sourceId);
        const targetIndex = groups.findIndex(g => g.id === targetId);
        if (sourceIndex < 0 || targetIndex < 0) return;
        const newGroups = [...groups];
        const [moved] = newGroups.splice(sourceIndex, 1);
        newGroups.splice(targetIndex, 0, moved);
        saveGroups(newGroups);
    };

    const handleDropOnGroup = async (e: React.DragEvent, groupId: string) => {
        e.preventDefault();
        const isGroupDrag = e.dataTransfer.types.includes('application/x-group-id');
        if (isGroupDrag) {
            const sourceId = e.dataTransfer.getData('application/x-group-id');
            reorderGroups(sourceId, groupId);
            setDraggingGroupId(null);
            setDragOverGroupId(null);
            return;
        }
        const todoId = e.dataTransfer.getData('text/plain');
        setDragOverGroupId(null);
        if (!todoId) return;
        if (groupId === FINISHED_GROUP_ID) {
            const todo = todos.find(t => t.id === todoId);
            if (todo && !todo.completed) {
                try { await onToggleTodo(todoId); } catch { }
            }
        }
        assignTaskToGroup(todoId, groupId);
    };

    const handleGroupDragStart = (e: React.DragEvent, groupId: string) => {
        setDraggingGroupId(groupId);
        e.dataTransfer.setData('application/x-group-id', groupId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleGroupDragEnd = () => {
        setDraggingGroupId(null);
        setDragOverGroupId(null);
    };

    const cancelAddTaskToGroup = (groupId: string) => {
        setNewTaskTextByGroup(prev => ({ ...prev, [groupId]: '' }));
    };

    const saveNewTaskToGroup = async (groupId: string) => {
        const text = newTaskTextByGroup[groupId] || '';
        const trimmed = text.trim();
        if (!trimmed) return;
        // Capture existing IDs so we can diff after creation
        const beforeIds = new Set(todos.map(t => t.id));
        setPendingAdds(prev => [...prev, { groupId, beforeIds }]);
        try {
            await storageAdapter.addTodo({ text: trimmed });
        } catch (e) {
            console.error('Failed to add task:', e);
        }
        // Clear this group's input after attempting to add
        setNewTaskTextByGroup(prev => ({ ...prev, [groupId]: '' }));
    };

    const handleAddTaskKeyDown = (e: React.KeyboardEvent, groupId: string) => {
        if (e.key === 'Enter') {
            saveNewTaskToGroup(groupId);
        } else if (e.key === 'Escape') {
            cancelAddTaskToGroup(groupId);
        }
    };

    // Effect to assign newly created tasks to intended group once they appear in todos list
    useEffect(() => {
        if (pendingAdds.length === 0) return;
        setPendingAdds(prev => {
            const remaining: typeof prev = [];
            let assignmentsMade: Record<string, string> | null = null;
            prev.forEach(p => {
                const newTask = todos.find(t => !p.beforeIds.has(t.id));
                if (newTask) {
                    if (!assignmentsMade) assignmentsMade = { ...groupAssignments };
                    assignmentsMade[newTask.id] = p.groupId;
                } else {
                    remaining.push(p); // still waiting
                }
            });
            if (assignmentsMade) {
                saveAssignments(assignmentsMade);
            }
            return remaining;
        });
    }, [todos]);

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
                <div style={styles.tableOuter}>
                    <div style={styles.tableScroll}>
                        <div style={styles.tableInner}>
                            <div style={styles.tableHeader}>
                                <div style={styles.nameColumn}>📝 Name</div>
                                <div style={styles.dueDateColumn}>📅 Due Date</div>
                                <div style={styles.statusColumn}>🏷️ Status</div>
                                <div style={styles.actionsColumn}>⚙️ Actions</div>
                            </div>

                            {groups.map((group) => {
                                // Build tasks for this group
                                const groupTasks = todos
                                    .filter(t => {
                                        if (t.completed) return group.id === FINISHED_GROUP_ID; // completed -> finished
                                        const assigned = groupAssignments[t.id];
                                        const defaultGroupId = groups[0]?.id;
                                        const target = assigned || defaultGroupId;
                                        return group.id === target && group.id !== FINISHED_GROUP_ID;
                                    })
                                    .slice()
                                    .sort(sortByDueDateAsc);
                                const groupColor = group.color || '#7c5dfa';
                                return (
                                    <div key={group.id} style={styles.groupContainer}
                                        onDragOver={(e) => handleDragOverGroup(e, group.id)}
                                        onDragLeave={(e) => handleDragLeaveGroup(e, group.id)}
                                        onDrop={(e) => handleDropOnGroup(e, group.id)}
                                    >
                                        <div
                                            style={{
                                                ...styles.groupHeader,
                                                ...(dragOverGroupId === group.id ? styles.groupHeaderDragOver : {})
                                            }}
                                            draggable
                                            onDragStart={(e) => handleGroupDragStart(e, group.id)}
                                            onDragEnd={handleGroupDragEnd}
                                            onClick={() => toggleGroup(group.id)}
                                        >
                                            <span style={{ ...styles.colorStrip, backgroundColor: groupColor }} />
                                            <span style={styles.expandIcon}>
                                                {expandedGroups.includes(group.id) ? '▼' : '▶'}
                                            </span>
                                            {editingGroupId === group.id ? (
                                                <input
                                                    value={tempGroupName}
                                                    onChange={(e) => setTempGroupName(e.target.value)}
                                                    onBlur={commitRenameGroup}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') commitRenameGroup();
                                                        if (e.key === 'Escape') {
                                                            setEditingGroupId(null);
                                                            setTempGroupName('');
                                                        }
                                                    }}
                                                    style={styles.groupNameInput}
                                                    autoFocus
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            ) : (
                                                <span
                                                    style={styles.groupName}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        startRenameGroup(group.id, group.name);
                                                    }}
                                                    title="Click to rename group"
                                                >{group.name}</span>
                                            )}
                                            <span style={styles.taskCount}>{groupTasks.length}</span>
                                            {/* Pencil icon removed; title click triggers rename */}
                                            {/* Color menu trigger */}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setColorMenuGroupId(prev => prev === group.id ? null : group.id); }}
                                                style={styles.moreButton}
                                                title="Change group color"
                                            >
                                                ⋯
                                            </button>
                                            {colorMenuGroupId === group.id && (
                                                <div style={styles.colorMenu} onMouseLeave={() => setColorMenuGroupId(null)}>
                                                    {['#7c5dfa', '#22c55e', '#ef4444', '#eab308', '#06b6d4', '#f472b6', '#8b5cf6', '#f97316', '#10b981', '#3b82f6', '#a855f7', '#f43f5e'].map(c => (
                                                        <button key={c} onClick={(e) => { e.stopPropagation(); updateGroupColor(group.id, c); }} style={{ ...styles.colorSwatch, backgroundColor: c, borderColor: c === groupColor ? 'white' : 'transparent' }} />
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {expandedGroups.includes(group.id) && (
                                            <div style={styles.tasksContainer}>
                                                {groupTasks.map(todo => {
                                                    const status = getTaskStatus(todo);
                                                    const statusInfo = STATUS_TYPES[status as keyof typeof STATUS_TYPES];
                                                    const subItemsCount = todo.subItems?.length || 0;
                                                    const completedSubItems = todo.subItems?.filter(item => item.completed).length || 0;
                                                    const isTaskExpanded = expandedTasks.includes(todo.id);

                                                    return (
                                                        <div key={todo.id} style={styles.taskContainer} draggable onDragStart={(e) => handleDragStart(e, todo.id)}>
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
                                                                <span style={{ ...styles.colorStrip, backgroundColor: groupColor }} />
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
                                                                            <span style={{ ...styles.colorStrip, backgroundColor: groupColor }} />
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
                                                                            <span style={{ ...styles.colorStrip, backgroundColor: groupColor }} />
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

                                                {groupTasks.length === 0 && (
                                                    <div style={styles.emptyGroup}>
                                                        No tasks in this group
                                                    </div>
                                                )}
                                                {/* Inline Add Item row (always visible, except Finished) */}
                                                {group.id !== FINISHED_GROUP_ID && (
                                                    <div style={styles.addTaskRow}>
                                                        <span style={{ ...styles.colorStrip, backgroundColor: groupColor }} />
                                                        <div style={styles.nameCell}>
                                                            <span style={styles.addItemPrefix}>➕</span>
                                                            <input
                                                                type="text"
                                                                value={newTaskTextByGroup[group.id] || ''}
                                                                onChange={(e) => setNewTaskTextByGroup(prev => ({ ...prev, [group.id]: e.target.value }))}
                                                                onKeyDown={(e) => handleAddTaskKeyDown(e, group.id)}
                                                                placeholder="New item name..."
                                                                style={styles.addTaskInput}
                                                            />
                                                        </div>
                                                        <div style={styles.dueDateCell}>
                                                            <span style={styles.noDueDate}>—</span>
                                                        </div>
                                                        {/* Status column intentionally left blank for new item row */}
                                                        <div style={styles.statusCell}></div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}

                            {/* Add new group */}
                            <div style={styles.addGroupContainer}>
                                <button style={styles.addGroupButton} onClick={addNewGroup}>+ Add new group</button>
                            </div>

                            {todos.length === 0 && (
                                <div style={styles.emptyState}>
                                    <div style={styles.emptyStateIcon}>📝</div>
                                    <h3 style={styles.emptyStateTitle}>No tasks yet</h3>
                                    <p style={styles.emptyStateText}>Create your first task above to get started!</p>
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
        overflow: 'hidden',
        boxSizing: 'border-box' as const,
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 20px',
        backgroundColor: '#181b34',
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
    tableOuter: {
        backgroundColor: '#181b34',
        paddingLeft: '16px',
        paddingTop: '12px',
    },
    tableScroll: {
        overflowX: 'auto',
        overflowY: 'hidden',
        width: '100%',
    } as React.CSSProperties,
    tableInner: {
        minWidth: '920px',
    },
    tableHeader: {
        display: 'grid',
        gridTemplateColumns: '1fr 150px 120px 120px',
        gap: '16px',
        padding: '12px 20px',
        backgroundColor: '#181b34',
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
        margin: '18px 0',
        paddingBottom: '6px',
    },
    groupHeader: {
        display: 'flex',
        alignItems: 'center',
        // Increase left padding so the title is clearly left-aligned after the color strip
        padding: '12px 20px 12px 28px',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        backgroundColor: '#181b34',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '8px',
        position: 'relative',
    } as React.CSSProperties,
    groupTitleCenter: {
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        fontWeight: 'bold',
        color: 'white',
        pointerEvents: 'none',
        fontSize: '0.95rem',
        letterSpacing: '0.5px',
    } as React.CSSProperties,
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
    },
    groupNameInput: {
        backgroundColor: '#1a1d23',
        border: '1px solid #434954',
        color: 'white',
        borderRadius: '4px',
        padding: '4px 8px',
        flex: 1,
    } as React.CSSProperties,
    taskCount: {
        fontSize: '0.8rem',
        color: '#ccc',
        backgroundColor: '#33354b',
        border: '1px solid #2a2e35',
        padding: '2px 8px',
        borderRadius: '12px',
        marginLeft: '8px',
    },
    renameGroupButton: {
        background: 'none',
        border: 'none',
        color: '#ccc',
        cursor: 'pointer',
        marginLeft: '8px',
        fontSize: '0.9rem',
    },
    tasksContainer: {
        backgroundColor: '#181b34',
    },
    addTaskRow: {
        display: 'grid',
        gridTemplateColumns: '1fr 150px 120px 120px',
        gap: '16px',
        padding: '10px 20px',
        borderTop: '1px dashed #2a2e35',
        backgroundColor: '#181b34',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '8px',
        position: 'relative',
    } as React.CSSProperties,
    addTaskRowStatic: {
        display: 'none',
    },
    addItemPrefix: {
        color: '#61dafb',
        opacity: 0.8,
    },
    addTaskInput: {
        backgroundColor: '#181b34',
        border: '1px solid #33354b',
        borderRadius: '4px',
        color: 'white',
        padding: '8px 12px',
        fontSize: '0.9rem',
        width: '100%',
        outline: 'none',
    } as React.CSSProperties,
    addTaskButton: {
        display: 'none',
    },
    taskRow: {
        display: 'grid',
        gridTemplateColumns: '1fr 150px 120px 120px',
        gap: '16px',
        padding: '12px 20px',
        borderBottom: '1px solid #2a2e35',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '8px',
        backgroundColor: '#33354b',
        position: 'relative',
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
    addGroupContainer: {
        display: 'flex',
        justifyContent: 'center',
        padding: '16px',
        borderTop: '1px dashed #2a2e35',
    },
    addGroupButton: {
        backgroundColor: '#181b34',
        color: '#61dafb',
        border: '1px solid #33354b',
        borderRadius: '6px',
        padding: '8px 12px',
        cursor: 'pointer',
    },
    groupHeaderDragOver: {
        backgroundColor: '#2d3b47',
        outline: '1px solid #61dafb',
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
        backgroundColor: '#181b34',
        borderTop: '1px solid #2a2e35',
        paddingLeft: '40px',
    },
    subItemRow: {
        display: 'grid',
        gridTemplateColumns: '1fr 150px 120px 120px',
        gap: '16px',
        padding: '8px 20px 8px 0',
        borderBottom: '1px solid #2a2e35',
        backgroundColor: '#181b34',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '8px',
        position: 'relative',
    } as React.CSSProperties,
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
    moreButton: {
        background: 'none',
        border: '1px solid #33354b',
        color: '#ccc',
        cursor: 'pointer',
        padding: '2px 6px',
        marginLeft: '6px',
        borderRadius: '4px',
        fontSize: '0.85rem',
    },
    colorMenu: {
        position: 'absolute' as const,
        marginTop: '34px',
        left: '10%px',
        backgroundColor: '#181b34',
        border: '1px solid #33354b',
        borderRadius: '8px',
        padding: '8px',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 20px)',
        gap: '6px',
        zIndex: 20,
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
    },
    colorSwatch: {
        width: '20px',
        height: '20px',
        borderRadius: '4px',
        border: '2px solid transparent',
        cursor: 'pointer',
        padding: 0,
    } as React.CSSProperties,
    colorStrip: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: '6px',
        borderTopLeftRadius: '8px',
        borderBottomLeftRadius: '8px',
    } as React.CSSProperties,
};