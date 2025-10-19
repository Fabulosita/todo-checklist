import React from 'react';
import { TodoItem as TodoItemType } from '../types';
import TodoItem from './TodoItem';

interface Props {
    items: TodoItemType[];
    title: string;
    emptyMessage: string;
    onToggle: (id: number) => void;
    onDelete: (id: number) => void;
}

const TodoSection: React.FC<Props> = ({
    items,
    title,
    emptyMessage,
    onToggle,
    onDelete
}) => {
    return (
        <div className="list-section">
            <h2>{title}</h2>
            <ul className="task-list">
                {items.length === 0 ? (
                    <li className="empty-message">{emptyMessage}</li>
                ) : (
                    items.map(item => (
                        <TodoItem
                            key={item.id}
                            item={item}
                            onToggle={onToggle}
                            onDelete={onDelete}
                        />
                    ))
                )}
            </ul>
        </div>
    );
};

export default TodoSection;