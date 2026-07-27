// src/context/AuthContext.jsx
import { createContext, useContext } from 'react';
import { useCurrentUser, useLogin, useLogout } from '../hooks/useAuth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const { data: user, isLoading: isAuthLoading } = useCurrentUser();
    const loginMutation = useLogin();
    const logoutMutation = useLogout();

    const login = async (username, password) => {
        try {
            await loginMutation.mutateAsync({ username, password });
            return { success: true };
        } catch (error) {
            console.log(error)
            const message =
                error.response?.data?.message || 'Something went wrong. Please try again.';
            return { success: false, message };
        }
    };

    const logout = () => logoutMutation.mutate();

    return (
        <AuthContext.Provider value={{ user: user ?? null, isAuthLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);