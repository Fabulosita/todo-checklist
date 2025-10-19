import React from 'react';
import { useTodoList } from './hooks/useTodoList';
import AddItemSection from './components/AddItemSection';
import TodoSection from './components/TodoSection';

const App: React.FC = () => {
    const {
        addItem,
        toggleItem,
        deleteItem,
        getActiveItems,
        getCompletedItems,
    } = useTodoList();

    const activeItems = getActiveItems();
    const completedItems = getCompletedItems();

    return (
        <div className="container">
            <h1>My Todo Checklist</h1>

            <AddItemSection onAddItem={addItem} />

            <div className="lists-container">
                <TodoSection
                    items={activeItems}
                    title="Active Tasks"
                    emptyMessage="No active tasks. Add one above!"
                    onToggle={toggleItem}
                    onDelete={deleteItem}
                />

                <TodoSection
                    items={completedItems}
                    title="Completed Tasks"
                    emptyMessage="No completed tasks yet."
                    onToggle={toggleItem}
                    onDelete={deleteItem}
                />
            </div>
        </div>
    );
};

export default App;