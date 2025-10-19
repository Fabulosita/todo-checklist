import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import {
    getFirestore,
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { firebaseConfig } from './firebase-config';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Initialize Analytics (only in browser environment)
let analytics;
if (typeof window !== 'undefined') {
    analytics = getAnalytics(app);
}

export interface Todo {
    id: string;
    text: string;
    completed: boolean;
    dueDate?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// Collection reference for todos
const todosCollection = collection(db, 'todos');

// Add a new todo
export const addTodo = async (text: string, dueDate?: string): Promise<void> => {
    try {
        await addDoc(todosCollection, {
            text: text.trim(),
            completed: false,
            dueDate: dueDate || null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('Error adding todo:', error);
        throw new Error('Failed to add todo. Please try again.');
    }
};

// Update an existing todo
export const updateTodo = async (id: string, updates: Partial<Omit<Todo, 'id' | 'createdAt'>>): Promise<void> => {
    try {
        const todoRef = doc(db, 'todos', id);
        await updateDoc(todoRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('Error updating todo:', error);
        throw new Error('Failed to update todo. Please try again.');
    }
};

// Delete a todo
export const deleteTodo = async (id: string): Promise<void> => {
    try {
        const todoRef = doc(db, 'todos', id);
        await deleteDoc(todoRef);
    } catch (error) {
        console.error('Error deleting todo:', error);
        throw new Error('Failed to delete todo. Please try again.');
    }
};

// Subscribe to todos changes with real-time updates
export const subscribeTodos = (callback: (todos: Todo[]) => void): (() => void) => {
    // Create a query to order todos by creation date (newest first)
    const q = query(todosCollection, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q,
        (querySnapshot) => {
            const todosArray: Todo[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                todosArray.push({
                    id: doc.id,
                    text: data.text,
                    completed: data.completed,
                    dueDate: data.dueDate,
                    createdAt: data.createdAt,
                    updatedAt: data.updatedAt
                });
            });
            callback(todosArray);
        },
        (error) => {
            console.error('Error fetching todos:', error);
            // You might want to show a user-friendly error message here
        }
    );

    // Return unsubscribe function
    return unsubscribe;
};