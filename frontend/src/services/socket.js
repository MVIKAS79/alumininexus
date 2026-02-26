import { io } from 'socket.io-client'
import { create } from 'zustand'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

let socket = null

// Socket store for managing connection state
export const useSocketStore = create((set, get) => ({
  isConnected: false,
  onlineUsers: [],

  // Connect to socket
  connect: (token) => {
    if (socket?.connected) return

    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    })

    socket.on('connect', () => {
      console.log('🔌 Socket connected')
      set({ isConnected: true })
    })

    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected')
      set({ isConnected: false })
    })

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message)
      set({ isConnected: false })
    })

    // Handle user online status
    socket.on('user:status', (data) => {
      const { onlineUsers } = get()
      if (data.isOnline) {
        if (!onlineUsers.includes(data.userId)) {
          set({ onlineUsers: [...onlineUsers, data.userId] })
        }
      } else {
        set({ onlineUsers: onlineUsers.filter(id => id !== data.userId) })
      }
    })
  },

  // Disconnect socket
  disconnect: () => {
    if (socket) {
      socket.disconnect()
      socket = null
      set({ isConnected: false, onlineUsers: [] })
    }
  },

  // Get socket instance
  getSocket: () => socket
}))

// Socket event helpers
export const socketEvents = {
  // Send a message
  sendMessage: (receiverId, content, messageType = 'text') => {
    if (socket?.connected) {
      socket.emit('message:send', { receiverId, content, messageType })
    }
  },

  // Start typing indicator
  startTyping: (receiverId) => {
    if (socket?.connected) {
      socket.emit('typing:start', { receiverId })
    }
  },

  // Stop typing indicator
  stopTyping: (receiverId) => {
    if (socket?.connected) {
      socket.emit('typing:stop', { receiverId })
    }
  },

  // Mark messages as read
  markAsRead: (senderId) => {
    if (socket?.connected) {
      socket.emit('message:read', { senderId })
    }
  },

  // Subscribe to message events
  onMessage: (callback) => {
    if (socket) {
      socket.on('message:receive', callback)
      return () => socket.off('message:receive', callback)
    }
  },

  // Subscribe to message sent confirmation
  onMessageSent: (callback) => {
    if (socket) {
      socket.on('message:sent', callback)
      return () => socket.off('message:sent', callback)
    }
  },

  // Subscribe to typing events
  onTypingStart: (callback) => {
    if (socket) {
      socket.on('typing:start', callback)
      return () => socket.off('typing:start', callback)
    }
  },

  onTypingStop: (callback) => {
    if (socket) {
      socket.on('typing:stop', callback)
      return () => socket.off('typing:stop', callback)
    }
  },

  // Subscribe to read receipts
  onMessageRead: (callback) => {
    if (socket) {
      socket.on('message:read', callback)
      return () => socket.off('message:read', callback)
    }
  },

  // Subscribe to notifications
  onNotification: (callback) => {
    if (socket) {
      socket.on('notification', callback)
      return () => socket.off('notification', callback)
    }
  }
}

// Named exports for Conversation.jsx compatibility - using JWT token
export const connectSocket = (token) => {
  useSocketStore.getState().connect(token)
}

export const disconnectSocket = () => {
  useSocketStore.getState().disconnect()
}

export const sendMessage = (message) => {
  if (socket?.connected) {
    socket.emit('message:send', message)
  }
}

export const onMessage = (callback) => {
  if (socket) {
    socket.on('message:receive', callback)
    return () => socket.off('message:receive', callback)
  }
  return () => {}
}

export const emitTyping = (receiverId, isTyping) => {
  if (socket?.connected) {
    socket.emit(isTyping ? 'typing:start' : 'typing:stop', { receiverId })
  }
}

export const onTyping = (callback) => {
  if (socket) {
    const handleStart = (data) => callback({ ...data, isTyping: true })
    const handleStop = (data) => callback({ ...data, isTyping: false })
    socket.on('typing:start', handleStart)
    socket.on('typing:stop', handleStop)
    return () => {
      socket.off('typing:start', handleStart)
      socket.off('typing:stop', handleStop)
    }
  }
  return () => {}
}

export default socket
