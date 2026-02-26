import axios from 'axios'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor - add token to requests
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage (zustand persists here)
    const authStorage = localStorage.getItem('auth-storage')
    if (authStorage) {
      const { state } = JSON.parse(authStorage)
      if (state?.token) {
        config.headers.Authorization = `Bearer ${state.token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const message = error.response?.data?.message || 'Something went wrong'
    
    // Handle specific error codes
    if (error.response?.status === 401) {
      // Token expired or invalid - clear both localStorage and Zustand store
      localStorage.removeItem('auth-storage')
      // Clear Zustand store if it's loaded
      try {
        const { useAuthStore } = await import('../store/authStore')
        useAuthStore.setState({ user: null, token: null, isAuthenticated: false })
      } catch (e) { /* ignore */ }
      window.location.href = '/login'
      toast.error('Session expired. Please login again.')
    } else if (error.response?.status === 403) {
      toast.error('You do not have permission to do this')
    } else if (error.response?.status === 404) {
      // Don't show toast for 404s, handle in component
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.')
    }
    
    return Promise.reject(error)
  }
)

export default api
