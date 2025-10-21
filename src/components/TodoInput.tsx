import { useState } from 'react';
import { TodoFormData } from '../types/Todo';

interface TodoInputProps {
    onAddTodo: (todoData: TodoFormData) => Promise<void>;
    loading: boolean;
}

export const TodoInput = ({ onAddTodo, loading }: TodoInputProps) => {
    const [inputValue, setInputValue] = useState('');
    const [dueDateValue, setDueDateValue] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (inputValue.trim() === '') return;

        setIsSubmitting(true);
        try {
            await onAddTodo({
                text: inputValue,
                dueDate: dueDateValue || undefined,
            });
            setInputValue('');
            setDueDateValue('');
        } catch (error) {
            // Error is handled by the parent component
            console.error('Failed to add todo:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isSubmitting) {
            handleSubmit();
        }
    };

    const isDisabled = loading || isSubmitting;

    return (
        <div className="todo-input">
            <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Add a new todo..."
                onKeyPress={handleKeyPress}
                disabled={isDisabled}
            />
            <input
                type="date"
                value={dueDateValue}
                onChange={(e) => setDueDateValue(e.target.value)}
                className="date-input"
                title="Due date (optional)"
                disabled={isDisabled}
            />
            <button onClick={handleSubmit} disabled={isDisabled || !inputValue.trim()}>
                {isSubmitting ? 'Adding...' : 'Add'}
            </button>
        </div>
    );
};