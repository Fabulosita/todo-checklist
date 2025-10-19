import { useState, useEffect } from 'react';
import { TodoItem } from '../types';

export const useTodoList = () => {
    const [items, setItems] = useState<TodoItem[]>([]);

    // Load from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem('todoItems');
        if (stored) {
            try {
                const parsedItems = JSON.parse(stored);
                setItems(parsedItems);
            } catch (error) {
                console.error('Error parsing stored todo items:', error);
            }
        }
    }, []);

    // Save to localStorage whenever items change
    useEffect(() => {
        localStorage.setItem('todoItems', JSON.stringify(items));
    }, [items]);

    const addItem = (text: string): boolean => {
        if (text.trim() === '') return false;

        const newItem: TodoItem = {
            id: Date.now(),
            text: text.trim(),
            completed: false,
        };

        setItems(prev => [...prev, newItem]);
        return true;
    };

    const toggleItem = (id: number): void => {
        setItems(prev =>
            prev.map(item =>
                item.id === id ? { ...item, completed: !item.completed } : item
            )
        );
    };

    const deleteItem = (id: number): void => {
        setItems(prev => prev.filter(item => item.id !== id));
    };

    const getActiveItems = (): TodoItem[] => {
        return items.filter(item => !item.completed);
    };

    const getCompletedItems = (): TodoItem[] => {
        return items.filter(item => item.completed);
    };

    return {
        items,
        addItem,
        toggleItem,
        deleteItem,
        getActiveItems,
        getCompletedItems,
    };
};