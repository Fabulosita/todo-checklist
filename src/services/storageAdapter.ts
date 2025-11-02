import { Todo, SubItem, TodoFormData, TodoUpdateData } from '../types/Todo';
import { isMobile } from '../mobile';

// Firebase imports
import {
    addTodo as firebaseAddTodo,
    updateTodo as firebaseUpdateTodo,
    deleteTodo as firebaseDeleteTodo,
    subscribeTodos as firebaseSubscribeTodos
} from '../firebase-service';

// Local storage imports
import {
    addTodoToStorage,
    updateTodoInStorage,
    deleteTodoFromStorage,
    subscribeToStorageChanges,
    updateSubItemsInStorage
} from './localStorageService';

// Storage adapter that chooses between Firebase and localStorage based on platform
export class StorageAdapter {
    private static instance: StorageAdapter;
    private useMobileStorage: boolean;

    private constructor() {
        this.useMobileStorage = isMobile();
        console.log(`Storage mode: ${this.useMobileStorage ? 'Local Storage (Mobile)' : 'Firebase (Web)'}`);
    }

    public static getInstance(): StorageAdapter {
        if (!StorageAdapter.instance) {
            StorageAdapter.instance = new StorageAdapter();
        }
        return StorageAdapter.instance;
    }

    // Add todo
    async addTodo(todoData: TodoFormData): Promise<void> {
        if (this.useMobileStorage) {
            return addTodoToStorage(todoData.text, todoData.dueDate);
        } else {
            return firebaseAddTodo(todoData.text, todoData.dueDate);
        }
    }

    // Update todo
    async updateTodo(id: string, updates: TodoUpdateData): Promise<void> {
        if (this.useMobileStorage) {
            return updateTodoInStorage(id, updates);
        } else {
            return firebaseUpdateTodo(id, updates);
        }
    }

    // Delete todo
    async deleteTodo(id: string): Promise<void> {
        if (this.useMobileStorage) {
            return deleteTodoFromStorage(id);
        } else {
            return firebaseDeleteTodo(id);
        }
    }

    // Update sub-items
    async updateSubItems(todoId: string, subItems: SubItem[]): Promise<void> {
        if (this.useMobileStorage) {
            return updateSubItemsInStorage(todoId, subItems);
        } else {
            // Firebase uses updateTodo with subItems
            return firebaseUpdateTodo(todoId, { subItems });
        }
    }

    // Subscribe to todos
    subscribeTodos(
        onSuccess: (todos: Todo[]) => void,
        onError: (error: Error) => void
    ): () => void {
        if (this.useMobileStorage) {
            return subscribeToStorageChanges(onSuccess, onError);
        } else {
            return firebaseSubscribeTodos(onSuccess, onError);
        }
    }

    // Get current storage type (for debugging/display)
    getStorageType(): string {
        return this.useMobileStorage ? 'localStorage' : 'firebase';
    }

    // Force switch storage type (for testing)
    setStorageType(useMobile: boolean): void {
        this.useMobileStorage = useMobile;
        console.log(`Switched to: ${this.useMobileStorage ? 'Local Storage' : 'Firebase'}`);
    }
}

// Export singleton instance
export const storageAdapter = StorageAdapter.getInstance();