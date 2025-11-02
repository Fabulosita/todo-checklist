import './App.css';
import { useTodos } from './hooks/useTodos';
import { useSelectedTodo } from './hooks/useSelectedTodo';
import { useAuth } from './hooks/useAuth';
import { ErrorMessage } from './components/ErrorMessage';
import { TodoInput } from './components/TodoInput';
import { TaskTableView } from './components/TaskTableView';
import { LoadingState } from './components/LoadingState';
import { LoginPage } from './components/LoginPage';
import { Header } from './components/Header';
import { isMobile } from './mobile';

function App() {
    const { isLoggedIn, isLoading: authLoading, login, logout } = useAuth();

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
        selectTodo,
        clearSelection
    } = useSelectedTodo();

    // Show loading screen while checking authentication
    if (authLoading) {
        return (
            <div className="App">
                <div className="App-header">
                    <LoadingState />
                </div>
            </div>
        );
    }

    // Show login page if not authenticated
    if (!isLoggedIn) {
        return <LoginPage onLogin={login} />;
    }

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

    return (
        <div className="App">
            <Header onLogout={logout} />

            {error && (
                <ErrorMessage
                    message={error}
                    onClose={clearError}
                />
            )}

            <div className="App-header">
                {/* Storage indicator */}
                <div className="storage-indicator">
                    {isMobile() ? '📱 Local Storage' : '☁️ Firebase'}
                </div>

                <TodoInput
                    onAddTodo={addTodo}
                    loading={loading}
                />

                {loading ? (
                    <LoadingState />
                ) : (
                    <TaskTableView
                        todos={todos}
                        onToggleTodo={handleToggleTodo}
                        onDeleteTodo={handleDeleteTodo}
                        onSelectTodo={handleSelectTodo}
                        onUpdateTodo={updateTodo}
                        selectedTodoId={selectedTodoId}
                    />
                )}
            </div>
        </div>
    );
}

export default App;