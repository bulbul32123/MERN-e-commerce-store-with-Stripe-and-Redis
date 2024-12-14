import { create } from 'zustand'
import { axiosInstance } from '../lib/axios'
import { toast } from 'react-hot-toast'


export const useUserStore = create((set, get) => ({
    user: null,
    loading: false,
    isAdmin: false,
    checkingAuth: false,

    signup: async ({ name, email, password }) => {
        set({ loading: true });
        try {
            const { data } = await axiosInstance.post('/auth/signup', { name, email, password })
            set({ loading: false, user: data?.user })
        } catch (error) {
            set({ loading: false })
            toast.error(error?.response?.data?.message || "An Error Occurred")

        }
    },
    login: async (email, password) => {
        set({ loading: true });
        try {
            const { data } = await axiosInstance.post('/auth/login', { email, password })
            set({ loading: false, user: data })
        } catch (error) {
            console.log('Error Occur in Here: ', error);
        }
    },
    logout: async () => {
        try {
            await axiosInstance.post('/auth/logout');
            set({ user: null });
        } catch (error) {
            toast.error(error?.response?.data?.message || "An Error Occur during logout")
        }
    },
    checkAuth: async () => {
        set({ checkingAuth: true });
        try {
            const { data } = await axiosInstance.get('/auth/profile')
            set({ user: data, checkingAuth: false })

        } catch (error) {
            set({ checkingAuth: false, user: null })
            console.log(get().checkingAuth);
            console.log('Error Occur in checkAuth: ', error);

        }
    },
    upgradeUser: async () => {
        try {
            const { data } = await axiosInstance.post('/auth/userUpgrade', { role: 'admin' });
            set({ user: data, isAdmin: true });
            return true;
        } catch (error) {
            console.log('Error Occur in upgradeUser: ', error);
            return false;
        }
    },
    refreshToken: async () => {
        set({ checkingAuth: true });
        try {
            const response = await axiosInstance.post("/auth/refresh-token");
            set({ checkingAuth: false });
            return response.data;
        } catch (error) {
            set({ user: null, checkingAuth: false });
            throw error;
        }
    },
}))

// TODO: Implement the axios interceptors for refreshing access token

// Axios interceptor for token refresh
let refreshPromise = null;

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                // If a refresh is already in progress, wait for it to complete
                if (refreshPromise) {
                    await refreshPromise;
                    return axiosInstance(originalRequest);
                }
                refreshPromise = useUserStore.getState().refreshToken();
                await refreshPromise;
                refreshPromise = null;

                return axiosInstance(originalRequest);
            } catch (refreshError) {
                // If refresh fails, redirect to login or handle as needed
                useUserStore.getState().logout();
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);