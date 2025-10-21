import './App.css';
import { useTodos } from './hooks/useTodos';
import { useSelectedTodo } from './hooks/useSelectedTodo';
import { ErrorMessage } from './components/ErrorMessage';
import { TodoInput } from './components/TodoInput';
import { TodoList } from './components/TodoList';
import { EditSection } from './components/EditSection';
import { LoadingState } from './components/LoadingState';

function App() {
    const {
        todos,
        loading,
        error,
        addTodo,
        updateTodo,
        deleteTodo,
        clearError
    } = useTodos();

    const {
        selectedTodoId,
        selectedTodo,
        selectTodo,
        clearSelection
    } = useSelectedTodo();

    const handleSelectTodo = (id: string) => {
        selectTodo(id, todos);
    };

    const handleToggleTodo = async (id: string) => {
        await updateTodo(id, {
            completed: !todos.find(t => t.id === id)?.completed
        });
    };

    const handleDeleteTodo = async (id: string) => {
        await deleteTodo(id);
        if (selectedTodoId === id) {
            clearSelection();
        }
    };

    const handleUpdateDueDate = async (dueDate: string) => {
        if (selectedTodoId) {
            await updateTodo(selectedTodoId, { dueDate: dueDate || undefined });
            clearSelection();
        }
    };

    return (
        <div className="App">
            <header className="App-header">
                <h1>Todo Checklist</h1>

                {error && (
                    <ErrorMessage
                        message={error}
                        onClose={clearError}
                    />
                )}

                <TodoInput
                    onAddTodo={addTodo}
                    loading={loading}
                />

                {selectedTodo && (
                    <EditSection
                        initialDueDate={selectedTodo.dueDate || ''}
                        onUpdate={handleUpdateDueDate}
                        onCancel={clearSelection}
                    />
                )}

                {loading ? (
                    <LoadingState />
                ) : (
                    <TodoList
                        todos={todos}
                        selectedTodoId={selectedTodoId}
                        onToggleTodo={handleToggleTodo}
                        onDeleteTodo={handleDeleteTodo}
                        onSelectTodo={handleSelectTodo}
                    />
                )}
            </header>
        </div>
    );
}

export default App;