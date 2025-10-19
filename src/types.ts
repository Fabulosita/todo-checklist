// TypeScript interfaces
export interface TodoItem {
    id: number;
    text: string;
    completed: boolean;
}

export interface TodoContextType {
    items: TodoItem[];
    addItem: (text: string) => boolean;
    toggleItem: (id: number) => void;
    deleteItem: (id: number) => void;
    getActiveItems: () => TodoItem[];
    getCompletedItems: () => TodoItem[];
}