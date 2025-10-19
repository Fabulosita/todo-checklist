import React from 'react';
import { TodoItem as TodoItemType } from '../types';

interface Props {
    item: TodoItemType;
    onToggle: (id: number) => void;
    onDelete: (id: number) => void;
}

const TodoItem: React.FC<Props> = ({ item, onToggle, onDelete }) => {
    return (
        <li className={`task-item ${item.completed ? 'completed' : ''}`}>
            <input
                type="checkbox"
                className="task-checkbox"
                checked={item.completed}
                onChange={() => onToggle(item.id)}
            />
            <span className="task-text">{item.text}</span>
            <button
                className="task-delete"
                onClick={() => onDelete(item.id)}
            >
                Delete
            </button>
        </li>
    );
};

export default TodoItem;