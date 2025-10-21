import { Todo } from '../types/Todo';
import { formatDate, isOverdue } from '../utils/dateHelpers';

interface TodoItemProps {
    todo: Todo;
    isSelected: boolean;
    onToggle: (id: string) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    onSelect: (id: string) => void;
}

export const TodoItem = ({ todo, isSelected, onToggle, onDelete, onSelect }: TodoItemProps) => {
    const handleToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        try {
            await onToggle(todo.id);
        } catch (error) {
            console.error('Failed to toggle todo:', error);
        }
    };

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await onDelete(todo.id);
        } catch (error) {
            console.error('Failed to delete todo:', error);
        }
    };

    const className = [
        todo.completed ? 'completed' : '',
        isSelected ? 'selected' : '',
        isOverdue(todo.dueDate) && !todo.completed ? 'overdue' : '',
    ].filter(Boolean).join(' ');

    return (
        <li className={className} onClick={() => onSelect(todo.id)}>
            <input
                type="checkbox"
                checked={todo.completed}
                onChange={handleToggle}
            />
            <div className="todo-content">
                <span className="todo-text">{todo.text}</span>
                {todo.dueDate && (
                    <span className="due-date">
                        Due: {formatDate(todo.dueDate)}
                    </span>
                )}
            </div>
            <button
                onClick={handleDelete}
                className="delete-btn"
                title="Delete todo"
            >
                Delete
            </button>
        </li>
    );
};