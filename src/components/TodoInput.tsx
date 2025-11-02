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



    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    const isDisabled = loading || isSubmitting;

    return (
        <div className="todo-input">
            <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}

                placeholder="Add a new todo..."
                disabled={isDisabled}
                style={{
                    minWidth: '500px',
                    minHeight: '40px',
                    padding: '12px 15px',
                    fontSize: '16px',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    backgroundColor: 'white',
                    color: '#333'
                }}
            />
            <input
                type="date"
                value={dueDateValue}
                onChange={(e) => setDueDateValue(e.target.value)}
                className="date-input"
                title="Due date (optional)"
                disabled={isDisabled}
                style={{
                    maxWidth: '150px',
                    minHeight: '40px',
                    padding: '12px 15px',
                    fontSize: '16px',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    backgroundColor: 'white',
                    color: '#333'
                }}
            />
            <button onClick={handleSubmit} disabled={isDisabled || !inputValue.trim()}>
                {isSubmitting ? 'Adding...' : 'Add'}
            </button>
        </div>
    );
};