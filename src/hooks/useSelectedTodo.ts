import { useState } from 'react';
import { Todo } from '../types/Todo';

interface UseSelectedTodoReturn {
    selectedTodoId: string | null;
    selectedTodo: Todo | null;
    selectTodo: (id: string, todos: Todo[]) => void;
    clearSelection: () => void;
}

export const useSelectedTodo = (): UseSelectedTodoReturn => {
    const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null);
    const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);

    const selectTodo = (id: string, todos: Todo[]) => {
        if (selectedTodoId === id) {
            // Deselect if clicking the same todo
            setSelectedTodoId(null);
            setSelectedTodo(null);
        } else {
            // Select new todo
            const todo = todos.find(t => t.id === id);
            setSelectedTodoId(id);
            setSelectedTodo(todo || null);
        }
    };

    const clearSelection = () => {
        setSelectedTodoId(null);
        setSelectedTodo(null);
    };

    return {
        selectedTodoId,
        selectedTodo,
        selectTodo,
        clearSelection,
    };
};