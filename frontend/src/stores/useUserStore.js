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

        // Helper function to create a timeout promise
        const timeout = (ms) => new Promise((_, reject) =>
            setTimeout(() => console.log("time out"), ms)
        );

        try {
            console.log('Checking authentication...');

            // Race between the API call and the timeout
            const data = await Promise.race([
                axiosInstance.get('/auth/profile').then((res) => res.data),
                timeout(4000) // 3 seconds timeout
            ]);

            if (!data) {
                set({ checkingAuth: false, user: null });
                return false; // No data received within timeout
            }

            set({ user: data, checkingAuth: false });
            return true; // Successfully authenticated
        } catch (error) {
            // Handle errors (either timeout or API error)
            set({ checkingAuth: false, user: null });
            console.error('Error in checkAuth:', error);
            return false;
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