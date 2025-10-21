import { useState, useEffect } from 'react';
import { isAuthenticated, verifyPassword, createSession, logout } from '../services/authService';

export const useAuth = () => {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // Check authentication status on mount
    useEffect(() => {
        const checkAuth = () => {
            const authenticated = isAuthenticated();
            setIsLoggedIn(authenticated);
            setIsLoading(false);
        };

        checkAuth();
    }, []);

    // Login function
    const login = (password: string): boolean => {
        if (verifyPassword(password)) {
            createSession();
            setIsLoggedIn(true);
            return true;
        }
        return false;
    };

    // Logout function
    const handleLogout = () => {
        logout();
        setIsLoggedIn(false);
    };

    return {
        isLoggedIn,
        isLoading,
        login,
        logout: handleLogout,
    };
};