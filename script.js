// Todo Item class
class TodoItem {
    constructor(text, id = Date.now(), completed = false) {
        this.text = text;
        this.id = id;
        this.completed = completed;
    }
}

// TodoList class to manage all todos
class TodoList {
    constructor() {
        this.items = [];
        this.loadFromStorage();
    }

    addItem(text) {
        if (text.trim() === '') return false;
        const item = new TodoItem(text);
        this.items.push(item);
        this.saveToStorage();
        return true;
    }

    toggleItem(id) {
        const item = this.items.find(item => item.id === id);
        if (item) {
            item.completed = !item.completed;
            this.saveToStorage();
            return true;
        }
        return false;
    }

    deleteItem(id) {
        this.items = this.items.filter(item => item.id !== id);
        this.saveToStorage();
    }

    getActiveItems() {
        return this.items.filter(item => !item.completed);
    }

    getCompletedItems() {
        return this.items.filter(item => item.completed);
    }

    saveToStorage() {
        localStorage.setItem('todoItems', JSON.stringify(this.items));
    }

    loadFromStorage() {
        const stored = localStorage.getItem('todoItems');
        if (stored) {
            this.items = JSON.parse(stored).map(item => 
                new TodoItem(item.text, item.id, item.completed)
            );
        }
    }
}

// UI Controller
class UIController {
    constructor(todoList) {
        this.todoList = todoList;
        this.activeListEl = document.getElementById('activeList');
        this.completedListEl = document.getElementById('completedList');
        this.newItemInput = document.getElementById('newItemInput');
        this.addItemBtn = document.getElementById('addItemBtn');
        
        this.init();
    }

    init() {
        // Event listeners
        this.addItemBtn.addEventListener('click', () => this.handleAddItem());
        this.newItemInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleAddItem();
            }
        });

        // Initial render
        this.render();
    }

    handleAddItem() {
        const text = this.newItemInput.value;
        if (this.todoList.addItem(text)) {
            this.newItemInput.value = '';
            this.render();
        }
    }

    createTaskElement(item) {
        const li = document.createElement('li');
        li.className = 'task-item';
        if (item.completed) {
            li.classList.add('completed');
        }

        // Checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'task-checkbox';
        checkbox.checked = item.completed;
        checkbox.addEventListener('change', () => {
            this.todoList.toggleItem(item.id);
            this.render();
        });

        // Text
        const textSpan = document.createElement('span');
        textSpan.className = 'task-text';
        textSpan.textContent = item.text;

        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'task-delete';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => {
            this.todoList.deleteItem(item.id);
            this.render();
        });

        li.appendChild(checkbox);
        li.appendChild(textSpan);
        li.appendChild(deleteBtn);

        return li;
    }

    render() {
        // Clear lists
        this.activeListEl.innerHTML = '';
        this.completedListEl.innerHTML = '';

        const activeItems = this.todoList.getActiveItems();
        const completedItems = this.todoList.getCompletedItems();

        // Render active items
        if (activeItems.length === 0) {
            const emptyMsg = document.createElement('li');
            emptyMsg.className = 'empty-message';
            emptyMsg.textContent = 'No active tasks. Add one above!';
            this.activeListEl.appendChild(emptyMsg);
        } else {
            activeItems.forEach(item => {
                this.activeListEl.appendChild(this.createTaskElement(item));
            });
        }

        // Render completed items
        if (completedItems.length === 0) {
            const emptyMsg = document.createElement('li');
            emptyMsg.className = 'empty-message';
            emptyMsg.textContent = 'No completed tasks yet.';
            this.completedListEl.appendChild(emptyMsg);
        } else {
            completedItems.forEach(item => {
                this.completedListEl.appendChild(this.createTaskElement(item));
            });
        }
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    const todoList = new TodoList();
    const ui = new UIController(todoList);
});
