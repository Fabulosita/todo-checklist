import React, { useState, useEffect } from 'react'
import './App.css'
import {
    addTodo as firebaseAddTodo,
    updateTodo as firebaseUpdateTodo,
    deleteTodo as firebaseDeleteTodo,
    subscribeTodos,
    Todo
} from './firebase-service'

function App() {
    const [todos, setTodos] = useState<Todo[]>([])
    const [inputValue, setInputValue] = useState('')
    const [dueDateValue, setDueDateValue] = useState('')
    const [selectedTodo, setSelectedTodo] = useState<string | null>(null)
    const [editingDueDate, setEditingDueDate] = useState('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Subscribe to Firebase data changes
    useEffect(() => {
        const unsubscribe = subscribeTodos((todosFromFirebase) => {
            setTodos(todosFromFirebase)
            setLoading(false)
        })

        // Cleanup subscription on unmount
        return () => unsubscribe()
    }, [])

    const addTodo = async () => {
        if (inputValue.trim() !== '') {
            try {
                setError(null)
                await firebaseAddTodo(inputValue, dueDateValue || undefined)
                setInputValue('')
                setDueDateValue('')
            } catch (error) {
                setError(error instanceof Error ? error.message : 'Failed to add todo')
            }
        }
    }

    const toggleTodo = async (id: string) => {
        try {
            setError(null)
            const todo = todos.find(t => t.id === id)
            if (todo) {
                await firebaseUpdateTodo(id, {
                    text: todo.text,
                    completed: !todo.completed,
                    dueDate: todo.dueDate
                })
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to update todo')
        }
    }

    const deleteTodo = async (id: string) => {
        try {
            setError(null)
            await firebaseDeleteTodo(id)
            if (selectedTodo === id) {
                setSelectedTodo(null)
                setEditingDueDate('')
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to delete todo')
        }
    }

    const selectTodo = (id: string) => {
        if (selectedTodo === id) {
            // Deselect if clicking the same todo
            setSelectedTodo(null)
            setEditingDueDate('')
        } else {
            // Select new todo
            setSelectedTodo(id)
            const todo = todos.find(t => t.id === id)
            setEditingDueDate(todo?.dueDate || '')
        }
    }

    const updateDueDate = async () => {
        if (selectedTodo) {
            try {
                setError(null)
                const todo = todos.find(t => t.id === selectedTodo)
                if (todo) {
                    await firebaseUpdateTodo(selectedTodo, {
                        text: todo.text,
                        completed: todo.completed,
                        dueDate: editingDueDate || undefined
                    })
                }
                setSelectedTodo(null)
                setEditingDueDate('')
            } catch (error) {
                setError(error instanceof Error ? error.message : 'Failed to update due date')
            }
        }
    }

    const formatDate = (dateString?: string) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        return date.toLocaleDateString()
    }

    const isOverdue = (dueDate?: string) => {
        if (!dueDate) return false
        const today = new Date()
        const due = new Date(dueDate)
        today.setHours(0, 0, 0, 0)
        due.setHours(0, 0, 0, 0)
        return due < today
    }

    return (
        <div className="App">
            <header className="App-header">
                <h1>Todo Checklist</h1>

                {error && (
                    <div className="error-message">
                        {error}
                        <button onClick={() => setError(null)} className="close-error">
                            ×
                        </button>
                    </div>
                )}

                <div className="todo-input">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Add a new todo..."
                        onKeyPress={(e) => e.key === 'Enter' && addTodo()}
                        disabled={loading}
                    />
                    <input
                        type="date"
                        value={dueDateValue}
                        onChange={(e) => setDueDateValue(e.target.value)}
                        className="date-input"
                        title="Due date (optional)"
                        disabled={loading}
                    />
                    <button onClick={addTodo} disabled={loading}>
                        {loading ? 'Loading...' : 'Add'}
                    </button>
                </div>

                {selectedTodo && (
                    <div className="edit-section">
                        <h3>Edit Due Date</h3>
                        <div className="edit-due-date">
                            <input
                                type="date"
                                value={editingDueDate}
                                onChange={(e) => setEditingDueDate(e.target.value)}
                                className="date-input"
                            />
                            <button onClick={updateDueDate} className="update-btn">
                                Update
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedTodo(null)
                                    setEditingDueDate('')
                                }}
                                className="cancel-btn"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="loading-state">
                        <p>Loading your todos...</p>
                    </div>
                ) : (
                    <>
                        <ul className="todo-list">
                            {todos.map(todo => (
                                <li
                                    key={todo.id}
                                    className={`
                                        ${todo.completed ? 'completed' : ''} 
                                        ${selectedTodo === todo.id ? 'selected' : ''}
                                        ${isOverdue(todo.dueDate) && !todo.completed ? 'overdue' : ''}
                                    `}
                                    onClick={() => selectTodo(todo.id)}
                                >
                                    <input
                                        type="checkbox"
                                        checked={todo.completed}
                                        onChange={(e) => {
                                            e.stopPropagation()
                                            toggleTodo(todo.id)
                                        }}
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
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            deleteTodo(todo.id)
                                        }}
                                        className="delete-btn"
                                    >
                                        Delete
                                    </button>
                                </li>
                            ))}
                        </ul>
                        {todos.length === 0 && (
                            <p className="empty-state">No todos yet. Add one above!</p>
                        )}
                    </>
                )}
            </header>
        </div>
    )
}

export default App