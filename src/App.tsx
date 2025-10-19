import React, { useState } from 'react'
import './App.css'

interface Todo {
    id: number
    text: string
    completed: boolean
}

function App() {
    const [todos, setTodos] = useState<Todo[]>([])
    const [inputValue, setInputValue] = useState('')

    const addTodo = () => {
        if (inputValue.trim() !== '') {
            const newTodo: Todo = {
                id: Date.now(),
                text: inputValue,
                completed: false
            }
            setTodos([...todos, newTodo])
            setInputValue('')
        }
    }

    const toggleTodo = (id: number) => {
        setTodos(todos.map(todo =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
        ))
    }

    const deleteTodo = (id: number) => {
        setTodos(todos.filter(todo => todo.id !== id))
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
                    <button onClick={addTodo}>Add</button>
                </div>
                <ul className="todo-list">
                    {todos.map(todo => (
                        <li key={todo.id} className={todo.completed ? 'completed' : ''}>
                            <input
                                type="checkbox"
                                checked={todo.completed}
                                onChange={() => toggleTodo(todo.id)}
                            />
                            <span>{todo.text}</span>
                            <button onClick={() => deleteTodo(todo.id)} className="delete-btn">
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