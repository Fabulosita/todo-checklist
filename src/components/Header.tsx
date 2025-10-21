import React from 'react';

interface HeaderProps {
    onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onLogout }) => {
    return (
        <header style={styles.header}>
            <h1 style={styles.title}>Todo Checklist</h1>
            <button
                onClick={onLogout}
                style={styles.logoutButton}
                title="Logout"
            >
                Logout
            </button>
        </header>
    );
};

const styles = {
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 2rem',
        backgroundColor: '#007bff',
        color: 'white',
        marginBottom: '2rem',
    },
    title: {
        fontSize: '1.5rem',
        fontWeight: 'bold',
        margin: 0,
    },
    logoutButton: {
        padding: '0.5rem 1rem',
        fontSize: '0.875rem',
        color: '#007bff',
        backgroundColor: 'white',
        border: '1px solid white',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: 'bold',
        transition: 'all 0.3s',
    },
};