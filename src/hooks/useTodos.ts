import { useState, useEffect } from 'react';
import { Todo, TodoFormData, TodoUpdateData, SubItem } from '../types/Todo';
import { storageAdapter } from '../services/storageAdapter';

interface UseTodosReturn {
    todos: Todo[];
    loading: boolean;
    error: string | null;
    addTodo: (todoData: TodoFormData) => Promise<void>;
    updateTodo: (id: string, updates: TodoUpdateData) => Promise<void>;
    deleteTodo: (id: string) => Promise<void>;
    updateSubItems: (todoId: string, subItems: SubItem[]) => Promise<void>;
    clearError: () => void;
}

export const useTodos = (): UseTodosReturn => {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Subscribe to data changes using storage adapter
    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        // Set a timeout to detect connection issues (shorter for web)
        const timeoutDuration = storageAdapter.getStorageType() === 'localStorage' ? 5000 : 8000;
        timeoutId = setTimeout(() => {
            if (loading) {
                setLoading(false);
                setError(`Unable to connect to ${storageAdapter.getStorageType()}. Working in offline mode.`);
            }
        }, timeoutDuration);

        const unsubscribe = storageAdapter.subscribeTodos(
            (todosFromStorage: Todo[]) => {
                clearTimeout(timeoutId);
                setTodos(todosFromStorage);
                setLoading(false);
                setError(null);
            },
            (storageError: Error) => {
                clearTimeout(timeoutId);
                setLoading(false);
                setError(`Failed to load todos from ${storageAdapter.getStorageType()}. Working in offline mode.`);
                console.error('Storage subscription error:', storageError);
            }
        );

        // Cleanup subscription on unmount
        return () => {
            clearTimeout(timeoutId);
            unsubscribe();
        };
    }, [loading]);

    const addTodo = async (todoData: TodoFormData): Promise<void> => {
        if (!todoData.text.trim()) {
            throw new Error('Todo text cannot be empty');
        }

        try {
            setError(null);
            await storageAdapter.addTodo(todoData);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to add todo';
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    };

    const updateTodo = async (id: string, updates: TodoUpdateData): Promise<void> => {
        try {
            setError(null);
            const todo = todos.find(t => t.id === id);
            if (!todo) {
                throw new Error('Todo not found');
            }

            // Merge current todo data with updates
            const updatedData = {
                text: updates.text ?? todo.text,
                completed: updates.completed ?? todo.completed,
                dueDate: updates.dueDate ?? todo.dueDate,
                subItems: updates.subItems ?? todo.subItems,
            };

            await storageAdapter.updateTodo(id, updatedData);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update todo';
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    };

    const deleteTodo = async (id: string): Promise<void> => {
        try {
            setError(null);
            await storageAdapter.deleteTodo(id);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete todo';
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    };

    const clearError = (): void => {
        setError(null);
    };

    const updateSubItems = async (todoId: string, subItems: SubItem[]): Promise<void> => {
        try {
            await storageAdapter.updateSubItems(todoId, subItems);
        } catch (error) {
            console.error('useTodos.updateSubItems error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to update sub-items';
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    };

    return {
        todos,
        loading,
        error,
        addTodo,
        updateTodo,
        deleteTodo,
        updateSubItems,
        clearError,
    };
};