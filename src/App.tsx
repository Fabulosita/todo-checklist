import './App.css';
import { useState } from 'react';
import { useTodos } from './hooks/useTodos';
import { useSelectedTodo } from './hooks/useSelectedTodo';
import { useAuth } from './hooks/useAuth';
import { ErrorMessage } from './components/ErrorMessage';
import { TodoInput } from './components/TodoInput';
import { TodoList } from './components/TodoList';
import { TaskTableView } from './components/TaskTableView';
import { ViewSwitcher, ViewMode } from './components/ViewSwitcher';
import { EditSection } from './components/EditSection';
import { LoadingState } from './components/LoadingState';
import { LoginPage } from './components/LoginPage';
import { Header } from './components/Header';

function App() {
    const [currentView, setCurrentView] = useState<ViewMode>('list');
    const { isLoggedIn, isLoading: authLoading, login, logout } = useAuth();

    const {
        todos,
        loading,
        error,
        addTodo,
        updateTodo,
        deleteTodo,
        updateSubItems,
        clearError
    } = useTodos();

    const {
        selectedTodoId,
        selectedTodo,
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

    const handleUpdateDueDate = async (dueDate: string) => {
        if (selectedTodoId) {
            await updateTodo(selectedTodoId, { dueDate: dueDate || undefined });
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

                <ViewSwitcher
                    currentView={currentView}
                    onViewChange={setCurrentView}
                />

                {loading ? (
                    <LoadingState />
                ) : currentView === 'table' ? (
                    <TaskTableView
                        todos={todos}
                        onToggleTodo={handleToggleTodo}
                        onDeleteTodo={handleDeleteTodo}
                        onSelectTodo={handleSelectTodo}
                        selectedTodoId={selectedTodoId}
                    />
                ) : (
                    <TodoList
                        todos={todos}
                        selectedTodoId={selectedTodoId}
                        onToggleTodo={handleToggleTodo}
                        onDeleteTodo={handleDeleteTodo}
                        onSelectTodo={handleSelectTodo}
                    />
                )}
            </div>
        </div>
    );
}

export default App;