import { Timestamp } from 'firebase/firestore';

export interface SubItem {
    id: string;
    text: string;
    completed: boolean;
    dueDate?: string;
    createdAt: any; // Make it flexible for now
}

export interface Todo {
    id: string;
    text: string;
    completed: boolean;
    dueDate?: string;
    subItems?: SubItem[];
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface TodoFormData {
    text: string;
    dueDate?: string;
}

export interface TodoUpdateData {
    text?: string;
    completed?: boolean;
    dueDate?: string;
    subItems?: SubItem[];
}