import { create } from 'zustand';
import api from '../services/api';

const useAuthStore = create((set) => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    isLoading: false,
    error: null,

    register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post('/auth/register', userData);
            const { token, ...user } = response.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            set({ user, token, isLoading: false });
            return true;
        } catch (error) {
            set({ error: error.response?.data?.message || error.message, isLoading: false });
            return false;
        }
    },

    login: async (userData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post('/auth/login', userData);
            const { token, ...user } = response.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            set({ user, token, isLoading: false });
            return true;
        } catch (error) {
            set({ error: error.response?.data?.message || error.message, isLoading: false });
            return false;
        }
    },

    googleLogin: async (credential) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post('/auth/google', { credential });
            const { token, ...user } = response.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            set({ user, token, isLoading: false });
            return true;
        } catch (error) {
            set({ error: error.response?.data?.message || 'Google Authentication failed', isLoading: false });
            return false;
        }
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, token: null });
    },

    updateProfile: async (profileData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.put('/auth/profile', profileData);
            const { token, ...updatedUser } = response.data;
            if (token) localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            set((state) => ({
                user: updatedUser,
                token: token || state.token,
                isLoading: false
            }));
            return true;
        } catch (error) {
            set({ error: error.response?.data?.message || error.message, isLoading: false });
            return false;
        }
    },

    checkAuth: async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            set({ user: null, token: null, isLoading: false });
            return;
        }

        set({ isLoading: true, error: null });
        try {
            const response = await api.get('/auth/profile');
            set({ user: response.data, token: token, isLoading: false });
        } catch (error) {
            console.error('Auth check failed:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            set({ user: null, token: null, isLoading: false, error: 'Session expired' });
        }
    },

    clearError: () => set({ error: null })
}));

export default useAuthStore;
