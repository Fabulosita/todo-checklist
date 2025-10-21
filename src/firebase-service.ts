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
    serverTimestamp
} from 'firebase/firestore';
import { firebaseConfig } from './firebase-config';
import { Todo } from './types/Todo';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Initialize Analytics (only in browser environment)
if (typeof window !== 'undefined') {
    getAnalytics(app);
}

// Re-export Todo type for backward compatibility
export type { Todo };

// Collection reference for todos
const todosCollection = collection(db, 'todos');

// Add a new todo
export const addTodo = async (text: string, dueDate?: string): Promise<void> => {
    try {
        const todoData: any = {
            text: text.trim(),
            completed: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        // Only add dueDate if it's provided and not empty
        if (dueDate && dueDate.trim()) {
            todoData.dueDate = dueDate.trim();
        }

        await addDoc(todosCollection, todoData);
    } catch (error) {
        console.error('Error adding todo:', error);
        throw new Error('Failed to add todo. Please try again.');
    }
};

// Update an existing todo
export const updateTodo = async (id: string, updates: Partial<Omit<Todo, 'id' | 'createdAt'>>): Promise<void> => {
    try {
        const todoRef = doc(db, 'todos', id);
        const updateData: any = {
            ...updates,
            updatedAt: serverTimestamp()
        };

        // Handle dueDate - remove field entirely if it's empty
        if (updates.dueDate !== undefined) {
            if (updates.dueDate && updates.dueDate.trim()) {
                updateData.dueDate = updates.dueDate.trim();
            } else {
                // Remove the dueDate field entirely
                updateData.dueDate = null;
            }
        }

        await updateDoc(todoRef, updateData);
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
export const subscribeTodos = (
    callback: (todos: Todo[]) => void,
    errorCallback?: (error: Error) => void
): (() => void) => {
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
            if (errorCallback) {
                errorCallback(new Error('Failed to sync with Firebase'));
            }
        }
    );

    // Return unsubscribe function
    return unsubscribe;
};