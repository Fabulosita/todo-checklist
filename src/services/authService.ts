// Simple password-based authentication service
const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD || 'defaultpassword';
const AUTH_TOKEN_KEY = 'todo-app-auth-token';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface AuthSession {
    token: string;
    timestamp: number;
}

// Generate a simple token
const generateToken = (): string => {
    return btoa(Date.now().toString() + Math.random().toString()).slice(0, 32);
};

// Check if password is correct
export const verifyPassword = (password: string): boolean => {
    return password === APP_PASSWORD;
};

// Create and store authentication session
export const createSession = (): void => {
    const session: AuthSession = {
        token: generateToken(),
        timestamp: Date.now(),
    };
    localStorage.setItem(AUTH_TOKEN_KEY, JSON.stringify(session));
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
    try {
        const sessionData = localStorage.getItem(AUTH_TOKEN_KEY);
        if (!sessionData) return false;

        const session: AuthSession = JSON.parse(sessionData);
        const currentTime = Date.now();

        // Check if session has expired
        if (currentTime - session.timestamp > SESSION_DURATION) {
            clearSession();
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error checking authentication:', error);
        clearSession();
        return false;
    }
};

// Clear authentication session
export const clearSession = (): void => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
};

// Logout user
export const logout = (): void => {
    clearSession();
    window.location.reload();
};

// Get session info
export const getSessionInfo = (): { timeRemaining: number } | null => {
    try {
        const sessionData = localStorage.getItem(AUTH_TOKEN_KEY);
        if (!sessionData) return null;

        const session: AuthSession = JSON.parse(sessionData);
        const currentTime = Date.now();
        const timeRemaining = SESSION_DURATION - (currentTime - session.timestamp);

        return timeRemaining > 0 ? { timeRemaining } : null;
    } catch (error) {
        return null;
    }
};