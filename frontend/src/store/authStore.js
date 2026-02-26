import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../services/api'

// Import socket disconnect lazily to avoid circular deps
let disconnectSocketFn = null
const getDisconnectSocket = async () => {
  if (!disconnectSocketFn) {
    const { useSocketStore } = await import('../services/socket')
    disconnectSocketFn = () => useSocketStore.getState().disconnect()
  }
  return disconnectSocketFn
}

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: true,

      // Initialize auth state
      initialize: async () => {
        const token = get().token
        if (token) {
          try {
            const response = await api.get('/auth/me')
            set({ 
              user: response.data.user, 
              isAuthenticated: true,
              loading: false 
            })
          } catch (error) {
            // Token invalid or expired
            set({ 
              user: null, 
              token: null, 
              isAuthenticated: false,
              loading: false 
            })
          }
        } else {
          set({ loading: false })
        }
      },

      // Login
      login: async (email, password) => {
        const response = await api.post('/auth/login', { email, password })
        const { token, user } = response.data
        
        set({ 
          user, 
          token, 
          isAuthenticated: true,
          loading: false 
        })
        
        return response.data
      },

      // Register (does not auto-login; user must verify email first)
      register: async (userData) => {
        const response = await api.post('/auth/register', userData)
        return response.data
      },

      // Logout
      logout: async () => {
        try {
          await api.post('/auth/logout')
        } catch (error) {
          // Continue with logout even if API fails
        }
        
        // Disconnect socket on logout
        try {
          const disconnect = await getDisconnectSocket()
          disconnect()
        } catch (e) { /* ignore */ }
        
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false 
        })
      },

      // Update user in state
      updateUser: (userData) => {
        set({ user: { ...get().user, ...userData } })
      },

      // Update password
      updatePassword: async (currentPassword, newPassword) => {
        const response = await api.put('/auth/update-password', {
          currentPassword,
          newPassword
        })
        
        if (response.data.token) {
          set({ token: response.data.token })
        }
        
        return response.data
      },

      // Forgot password
      forgotPassword: async (email) => {
        const response = await api.post('/auth/forgot-password', { email })
        return response.data
      },

      // Reset password
      resetPassword: async (token, password) => {
        const response = await api.put(`/auth/reset-password/${token}`, { password })
        return response.data
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)

// Initialize auth on app start
useAuthStore.getState().initialize()
