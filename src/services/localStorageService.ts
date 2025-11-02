import { Todo, SubItem } from '../types/Todo';
import { Timestamp } from 'firebase/firestore';

const TODOS_STORAGE_KEY = 'todos';
const STORAGE_VERSION_KEY = 'todosVersion';
const CURRENT_VERSION = '1.0';

// Create a Timestamp-like object for local storage
const createLocalTimestamp = (date: Date = new Date()) => ({
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: (date.getTime() % 1000) * 1000000,
    toDate: () => date,
    toMillis: () => date.getTime(),
    isEqual: (other: any) => date.getTime() === other.toMillis?.() || date.getTime() === other
}) as Timestamp;

// Initialize storage version
const initializeStorage = () => {
    const version = localStorage.getItem(STORAGE_VERSION_KEY);
    if (!version) {
        localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION);
        localStorage.setItem(TODOS_STORAGE_KEY, JSON.stringify([]));
    }
};

// Generate unique ID
const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Get all todos from localStorage
export const getTodosFromStorage = (): Todo[] => {
    try {
        initializeStorage();
        const todosJson = localStorage.getItem(TODOS_STORAGE_KEY);
        return todosJson ? JSON.parse(todosJson) : [];
    } catch (error) {
        console.error('Error reading todos from localStorage:', error);
        return [];
    }
};

// Save todos to localStorage
const saveTodosToStorage = (todos: Todo[]): void => {
    try {
        localStorage.setItem(TODOS_STORAGE_KEY, JSON.stringify(todos));
    } catch (error) {
        console.error('Error saving todos to localStorage:', error);
        throw new Error('Failed to save data locally');
    }
};

// Add a new todo
export const addTodoToStorage = async (text: string, dueDate?: string): Promise<void> => {
    const todos = getTodosFromStorage();
    const newTodo: Todo = {
        id: generateId(),
        text: text.trim(),
        completed: false,
        createdAt: createLocalTimestamp(),
        updatedAt: createLocalTimestamp(),
        subItems: []
    };

    // Add dueDate if provided
    if (dueDate && dueDate.trim()) {
        newTodo.dueDate = dueDate.trim();
    }

    todos.unshift(newTodo); // Add to beginning
    saveTodosToStorage(todos);
};

// Update an existing todo
export const updateTodoInStorage = async (id: string, updates: Partial<Todo>): Promise<void> => {
    const todos = getTodosFromStorage();
    const todoIndex = todos.findIndex(todo => todo.id === id);

    if (todoIndex === -1) {
        throw new Error('Todo not found');
    }

    todos[todoIndex] = {
        ...todos[todoIndex],
        ...updates,
        updatedAt: createLocalTimestamp()
    };

    saveTodosToStorage(todos);
};

// Delete a todo
export const deleteTodoFromStorage = async (id: string): Promise<void> => {
    const todos = getTodosFromStorage();
    const filteredTodos = todos.filter(todo => todo.id !== id);
    saveTodosToStorage(filteredTodos);
};

// Update sub-items for a todo
export const updateSubItemsInStorage = async (todoId: string, subItems: SubItem[]): Promise<void> => {
    const todos = getTodosFromStorage();
    const todoIndex = todos.findIndex(todo => todo.id === todoId);

    if (todoIndex === -1) {
        throw new Error('Todo not found');
    }

    todos[todoIndex].subItems = subItems.map(item => ({
        ...item,
        id: item.id || generateId()
    }));
    todos[todoIndex].updatedAt = createLocalTimestamp();

    saveTodosToStorage(todos);
};

// Subscribe to storage changes (for real-time updates across tabs)
export const subscribeToStorageChanges = (
    callback: (todos: Todo[]) => void,
    errorCallback?: (error: Error) => void
): (() => void) => {
    const handleStorageChange = (e: StorageEvent) => {
        if (e.key === TODOS_STORAGE_KEY) {
            try {
                const todos = getTodosFromStorage();
                callback(todos);
            } catch (error) {
                errorCallback?.(error as Error);
            }
        }
    };

    window.addEventListener('storage', handleStorageChange);

    // Initial load
    setTimeout(() => {
        try {
            const todos = getTodosFromStorage();
            callback(todos);
        } catch (error) {
            errorCallback?.(error as Error);
        }
    }, 0);

    // Return unsubscribe function
    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };
};

// Clear all todos (useful for testing)
export const clearTodosStorage = (): void => {
    localStorage.removeItem(TODOS_STORAGE_KEY);
    localStorage.removeItem(STORAGE_VERSION_KEY);
};