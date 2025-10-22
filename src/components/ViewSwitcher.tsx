import React from 'react';

export type ViewMode = 'list' | 'table';

interface ViewSwitcherProps {
    currentView: ViewMode;
    onViewChange: (view: ViewMode) => void;
}

export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({
    currentView,
    onViewChange
}) => {
    return (
        <div style={styles.container}>
            <div style={styles.label}>View:</div>
            <div style={styles.buttonGroup}>
                <button
                    onClick={() => onViewChange('list')}
                    style={{
                        ...styles.button,
                        ...(currentView === 'list' ? styles.activeButton : {})
                    }}
                >
                    📋 List View
                </button>
                <button
                    onClick={() => onViewChange('table')}
                    style={{
                        ...styles.button,
                        ...(currentView === 'table' ? styles.activeButton : {})
                    }}
                >
                    📊 Table View
                </button>
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '20px',
    },
    label: {
        color: '#ccc',
        fontSize: '0.9rem',
        fontWeight: 'bold',
    },
    buttonGroup: {
        display: 'flex',
        gap: '4px',
        backgroundColor: '#2a2e35',
        borderRadius: '6px',
        padding: '2px',
    },
    button: {
        background: 'none',
        border: 'none',
        padding: '8px 16px',
        borderRadius: '4px',
        color: '#ccc',
        cursor: 'pointer',
        fontSize: '0.85rem',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
    } as React.CSSProperties,
    activeButton: {
        backgroundColor: '#61dafb',
        color: '#1a1d23',
        fontWeight: 'bold',
    },
};