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
import { Todo, SubItem } from './types/Todo';

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

// Get sub-items collection reference for a specific todo
const getSubItemsCollection = (todoId: string) => {
    return collection(db, 'todos', todoId, 'subItems');
};

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
export const updateTodo = async (id: string, updates: any): Promise<void> => {
    try {
        console.log('firebase-service.updateTodo called:', { id, updates });
        console.log('updates.subItems:', updates.subItems);
        const todoRef = doc(db, 'todos', id);
        console.log('=== FIREBASE UPDATE DEBUG ===');
        console.log('Raw updates object:', updates);
        console.log('Object.keys(updates):', Object.keys(updates));
        console.log('updates.subItems specifically:', updates.subItems);
        console.log('JSON.stringify(updates):', JSON.stringify(updates, null, 2));

        const updateData: any = {
            ...updates,
            updatedAt: serverTimestamp()
        };

        console.log('updateData after spread:', updateData);
        console.log('updateData.subItems:', updateData.subItems);
        console.log('typeof updateData.subItems:', typeof updateData.subItems);
        console.log('Array.isArray(updateData.subItems):', Array.isArray(updateData.subItems));
        console.log('JSON.stringify(updateData):', JSON.stringify(updateData, null, 2));

        // Handle dueDate - remove field entirely if it's empty
        if (updates.dueDate !== undefined) {
            if (updates.dueDate && updates.dueDate.trim()) {
                updateData.dueDate = updates.dueDate.trim();
            } else {
                // Remove the dueDate field entirely
                updateData.dueDate = null;
            }
        }

        // Handle subItems - ensure it's properly serializable
        if (updates.subItems !== undefined) {
            console.log('Processing subItems update:', updates.subItems);
            updateData.subItems = updates.subItems;
        }

        console.log('firebase-service.updateData to be sent:', updateData);
        await updateDoc(todoRef, updateData);
        console.log('firebase-service.updateDoc completed successfully');
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

// Add a sub-item to a todo
export const addSubItem = async (todoId: string, text: string, dueDate?: string): Promise<void> => {
    try {
        const subItemsCollection = getSubItemsCollection(todoId);
        const subItemData: any = {
            text: text.trim(),
            completed: false,
            createdAt: serverTimestamp(),
        };

        // Only add dueDate if it's provided and not empty
        if (dueDate && dueDate.trim()) {
            subItemData.dueDate = dueDate.trim();
        }

        await addDoc(subItemsCollection, subItemData);
    } catch (error) {
        console.error('Error adding sub-item:', error);
        throw new Error('Failed to add sub-item. Please try again.');
    }
};

// Update a sub-item
export const updateSubItem = async (todoId: string, subItemId: string, updates: any): Promise<void> => {
    try {
        const subItemRef = doc(db, 'todos', todoId, 'subItems', subItemId);
        const updateData: any = {
            ...updates,
            updatedAt: serverTimestamp()
        };

        // Handle dueDate - remove field entirely if it's empty
        if (updates.dueDate !== undefined) {
            if (updates.dueDate && updates.dueDate.trim()) {
                updateData.dueDate = updates.dueDate.trim();
            } else {
                updateData.dueDate = null;
            }
        }

        await updateDoc(subItemRef, updateData);
    } catch (error) {
        console.error('Error updating sub-item:', error);
        throw new Error('Failed to update sub-item. Please try again.');
    }
};

// Delete a sub-item
export const deleteSubItem = async (todoId: string, subItemId: string): Promise<void> => {
    try {
        const subItemRef = doc(db, 'todos', todoId, 'subItems', subItemId);
        await deleteDoc(subItemRef);
    } catch (error) {
        console.error('Error deleting sub-item:', error);
        throw new Error('Failed to delete sub-item. Please try again.');
    }
};

// Subscribe to sub-items for a specific todo
export const subscribeSubItems = (
    todoId: string,
    callback: (subItems: SubItem[]) => void,
    errorCallback?: (error: Error) => void
): (() => void) => {
    const subItemsCollection = getSubItemsCollection(todoId);
    const q = query(subItemsCollection, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q,
        (querySnapshot) => {
            const subItemsArray: SubItem[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const subItem: SubItem = {
                    id: doc.id,
                    text: data.text,
                    completed: data.completed,
                    dueDate: data.dueDate,
                    createdAt: data.createdAt
                };
                subItemsArray.push(subItem);
            });
            callback(subItemsArray);
        },
        (error) => {
            console.error('Error fetching sub-items:', error);
            if (errorCallback) {
                errorCallback(new Error('Failed to sync sub-items with Firebase'));
            }
        }
    );

    return unsubscribe;
};

// Subscribe to todos changes with real-time updates
export const subscribeTodos = (
    callback: (todos: Todo[]) => void,
    errorCallback?: (error: Error) => void
): (() => void) => {
    const todosMap = new Map<string, Todo>();
    const subItemsUnsubscribers = new Map<string, () => void>();

    // Create a query to order todos by creation date (newest first)
    const q = query(todosCollection, orderBy('createdAt', 'desc'));

    const updateTodosCallback = () => {
        const todosArray = Array.from(todosMap.values())
            .sort((a, b) => {
                // Sort by createdAt descending
                const aTime = a.createdAt?.seconds ? a.createdAt.seconds * 1000 :
                    (typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : 0);
                const bTime = b.createdAt?.seconds ? b.createdAt.seconds * 1000 :
                    (typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : 0);
                return bTime - aTime;
            });

        console.log('Firebase subscription sending todos array:', todosArray);
        callback(todosArray);
    };

    const unsubscribeTodos = onSnapshot(q,
        (querySnapshot) => {
            console.log('Todos snapshot changed');

            // Handle todos changes
            querySnapshot.docChanges().forEach((change) => {
                const todoId = change.doc.id;
                const data = change.doc.data();

                if (change.type === 'added' || change.type === 'modified') {
                    // Create or update todo
                    const existingTodo = todosMap.get(todoId);
                    const todo: Todo = {
                        id: todoId,
                        text: data.text,
                        completed: data.completed,
                        dueDate: data.dueDate,
                        subItems: existingTodo?.subItems || [],
                        createdAt: data.createdAt,
                        updatedAt: data.updatedAt
                    };

                    todosMap.set(todoId, todo);

                    // Set up sub-items listener if not already exists
                    if (!subItemsUnsubscribers.has(todoId)) {
                        const subItemsCollection = getSubItemsCollection(todoId);
                        const subItemsQuery = query(subItemsCollection, orderBy('createdAt', 'asc'));

                        const unsubscribeSubItems = onSnapshot(subItemsQuery, (subSnapshot) => {
                            console.log(`Sub-items snapshot changed for todo ${todoId}`);
                            const subItems: SubItem[] = [];
                            subSnapshot.forEach((subDoc) => {
                                const subData = subDoc.data();
                                subItems.push({
                                    id: subDoc.id,
                                    text: subData.text,
                                    completed: subData.completed,
                                    dueDate: subData.dueDate,
                                    createdAt: subData.createdAt
                                });
                            });

                            // Update the todo with new sub-items
                            const currentTodo = todosMap.get(todoId);
                            if (currentTodo) {
                                currentTodo.subItems = subItems;
                                todosMap.set(todoId, currentTodo);
                                updateTodosCallback();
                            }
                        });

                        subItemsUnsubscribers.set(todoId, unsubscribeSubItems);
                    }
                } else if (change.type === 'removed') {
                    // Remove todo and its sub-items listener
                    todosMap.delete(todoId);
                    const subItemsUnsubscriber = subItemsUnsubscribers.get(todoId);
                    if (subItemsUnsubscriber) {
                        subItemsUnsubscriber();
                        subItemsUnsubscribers.delete(todoId);
                    }
                }
            });

            updateTodosCallback();
        },
        (error) => {
            console.error('Error fetching todos:', error);
            if (errorCallback) {
                errorCallback(new Error('Failed to sync with Firebase'));
            }
        }
    );

    // Return cleanup function
    return () => {
        unsubscribeTodos();
        // Clean up all sub-items listeners
        subItemsUnsubscribers.forEach(unsubscribe => unsubscribe());
        subItemsUnsubscribers.clear();
    };
};