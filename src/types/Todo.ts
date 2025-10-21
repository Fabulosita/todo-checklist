import { Timestamp } from 'firebase/firestore';

export interface Todo {
    id: string;
    text: string;
    completed: boolean;
    dueDate?: string;
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
}