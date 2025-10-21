import { useState, useEffect } from 'react';
import { Todo, TodoFormData, TodoUpdateData } from '../types/Todo';
import {
    addTodo as firebaseAddTodo,
    updateTodo as firebaseUpdateTodo,
    deleteTodo as firebaseDeleteTodo,
    subscribeTodos,
} from '../firebase-service';

interface UseTodosReturn {
    todos: Todo[];
    loading: boolean;
    error: string | null;
    addTodo: (todoData: TodoFormData) => Promise<void>;
    updateTodo: (id: string, updates: TodoUpdateData) => Promise<void>;
    deleteTodo: (id: string) => Promise<void>;
    clearError: () => void;
}

export const useTodos = (): UseTodosReturn => {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Subscribe to Firebase data changes
    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        // Set a timeout to detect connection issues
        timeoutId = setTimeout(() => {
            if (loading) {
                setLoading(false);
                setError('Unable to connect to Firebase. You can still use the app, but changes won\'t be saved.');
            }
        }, 10000); // 10 second timeout

        const unsubscribe = subscribeTodos(
            (todosFromFirebase) => {
                clearTimeout(timeoutId);
                setTodos(todosFromFirebase);
                setLoading(false);
                setError(null);
            },
            (firebaseError) => {
                clearTimeout(timeoutId);
                setLoading(false);
                setError('Failed to load todos from Firebase. Working in offline mode.');
                console.error('Firebase subscription error:', firebaseError);
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
            await firebaseAddTodo(todoData.text, todoData.dueDate);
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
            };

            await firebaseUpdateTodo(id, updatedData);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update todo';
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    };

    const deleteTodo = async (id: string): Promise<void> => {
        try {
            setError(null);
            await firebaseDeleteTodo(id);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete todo';
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    };

    const clearError = (): void => {
        setError(null);
    };

    return {
        todos,
        loading,
        error,
        addTodo,
        updateTodo,
        deleteTodo,
        clearError,
    };
};