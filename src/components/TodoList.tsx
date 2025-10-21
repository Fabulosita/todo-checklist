import { Todo } from '../types/Todo';
import { TodoItem } from './TodoItem';

interface TodoListProps {
    todos: Todo[];
    selectedTodoId: string | null;
    onToggleTodo: (id: string) => Promise<void>;
    onDeleteTodo: (id: string) => Promise<void>;
    onSelectTodo: (id: string) => void;
}

export const TodoList = ({
    todos,
    selectedTodoId,
    onToggleTodo,
    onDeleteTodo,
    onSelectTodo
}: TodoListProps) => {
    if (todos.length === 0) {
        return <p className="empty-state">No todos yet. Add one above!</p>;
    }

    return (
        <ul className="todo-list">
            {todos.map(todo => (
                <TodoItem
                    key={todo.id}
                    todo={todo}
                    isSelected={selectedTodoId === todo.id}
                    onToggle={onToggleTodo}
                    onDelete={onDeleteTodo}
                    onSelect={onSelectTodo}
                />
            ))}
        </ul>
    );
};