import React, { useState } from 'react';

interface LoginPageProps {
    onLogin: (password: string) => boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Simulate a brief loading state for better UX
        setTimeout(() => {
            const success = onLogin(password);

            if (!success) {
                setError('Incorrect password. Please try again.');
                setPassword('');
            }

            setIsLoading(false);
        }, 500);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
        if (error) setError(''); // Clear error when user starts typing
    };

    return (
        <div style={styles.container}>
            <div style={styles.loginBox}>
                <h1 style={styles.title}>Todo Checklist</h1>
                <p style={styles.subtitle}>Please enter your password to access the app</p>

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <input
                            type="password"
                            value={password}
                            onChange={handleInputChange}
                            placeholder="Enter password"
                            style={{
                                ...styles.input,
                                ...(error ? styles.inputError : {})
                            }}
                            autoFocus
                            disabled={isLoading}
                        />
                    </div>

                    {error && (
                        <div style={styles.error}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        style={{
                            ...styles.button,
                            ...(isLoading ? styles.buttonDisabled : {})
                        }}
                        disabled={isLoading || !password.trim()}
                    >
                        {isLoading ? 'Verifying...' : 'Login'}
                    </button>
                </form>

                <p style={styles.note}>
                    Your session will remain active for 24 hours.
                </p>
            </div>
        </div>
    );
};

const styles = {
    container: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        fontFamily: 'Arial, sans-serif',
    },
    loginBox: {
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '400px',
        textAlign: 'center' as const,
    },
    title: {
        fontSize: '2rem',
        fontWeight: 'bold',
        marginBottom: '0.5rem',
        color: '#333',
    },
    subtitle: {
        fontSize: '1rem',
        color: '#666',
        marginBottom: '2rem',
    },
    form: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '1rem',
    },
    inputGroup: {
        marginBottom: '1rem',
    },
    input: {
        width: '100%',
        padding: '0.75rem',
        fontSize: '1rem',
        border: '2px solid #ddd',
        borderRadius: '4px',
        outline: 'none',
        transition: 'border-color 0.3s',
        boxSizing: 'border-box' as const,
    },
    inputError: {
        borderColor: '#e74c3c',
    },
    button: {
        width: '100%',
        padding: '0.75rem',
        fontSize: '1rem',
        fontWeight: 'bold',
        color: 'white',
        backgroundColor: '#007bff',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        transition: 'background-color 0.3s',
        outline: 'none',
    },
    buttonDisabled: {
        backgroundColor: '#ccc',
        cursor: 'not-allowed',
    },
    error: {
        color: '#e74c3c',
        fontSize: '0.875rem',
        marginBottom: '1rem',
        padding: '0.5rem',
        backgroundColor: '#ffeaea',
        border: '1px solid #e74c3c',
        borderRadius: '4px',
    },
    note: {
        fontSize: '0.875rem',
        color: '#888',
        marginTop: '1.5rem',
    },
};