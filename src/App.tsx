import React, { useState } from 'react'
import './App.css'

interface Todo {
    id: number
    text: string
    completed: boolean
    dueDate?: string
}

function App() {
    const [todos, setTodos] = useState<Todo[]>([])
    const [inputValue, setInputValue] = useState('')
    const [dueDateValue, setDueDateValue] = useState('')
    const [selectedTodo, setSelectedTodo] = useState<number | null>(null)
    const [editingDueDate, setEditingDueDate] = useState('')

    const addTodo = () => {
        if (inputValue.trim() !== '') {
            const newTodo: Todo = {
                id: Date.now(),
                text: inputValue,
                completed: false,
                dueDate: dueDateValue || undefined
            }
            setTodos([...todos, newTodo])
            setInputValue('')
            setDueDateValue('')
        }
    }

    const toggleTodo = (id: number) => {
        setTodos(todos.map(todo =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
        ))
    }

    const deleteTodo = (id: number) => {
        setTodos(todos.filter(todo => todo.id !== id))
        if (selectedTodo === id) {
            setSelectedTodo(null)
            setEditingDueDate('')
        }
    }

    const selectTodo = (id: number) => {
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

    const updateDueDate = () => {
        if (selectedTodo) {
            setTodos(todos.map(todo =>
                todo.id === selectedTodo
                    ? { ...todo, dueDate: editingDueDate || undefined }
                    : todo
            ))
            setSelectedTodo(null)
            setEditingDueDate('')
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
                <div className="todo-input">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Add a new todo..."
                        onKeyPress={(e) => e.key === 'Enter' && addTodo()}
                    />
                    <input
                        type="date"
                        value={dueDateValue}
                        onChange={(e) => setDueDateValue(e.target.value)}
                        className="date-input"
                        title="Due date (optional)"
                    />
                    <button onClick={addTodo}>Add</button>
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
            </header>
        </div>
    )
}

export default App