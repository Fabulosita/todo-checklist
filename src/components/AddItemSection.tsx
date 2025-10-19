import React, { useState } from 'react';

interface Props {
    onAddItem: (text: string) => boolean;
}

const AddItemSection: React.FC<Props> = ({ onAddItem }) => {
    const [inputValue, setInputValue] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (onAddItem(inputValue)) {
            setInputValue('');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSubmit(e);
        }
    };

    return (
        <div className="add-item-section">
            <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter a new task..."
            />
            <button onClick={handleSubmit}>Add Item</button>
        </div>
    );
};

export default AddItemSection;