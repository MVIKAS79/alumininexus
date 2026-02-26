import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../services/api'
import { connectSocket, disconnectSocket, sendMessage, onMessage, emitTyping, onTyping } from '../services/socket'
import { ArrowLeft, Send, Phone, Video, MoreVertical, Circle, Image, Paperclip } from 'lucide-react'
import { format, isSameDay } from 'date-fns'

const Conversation = () => {
  const { userId } = useParams()
  const { user: currentUser, token } = useAuthStore()
  const [otherUser, setOtherUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  useEffect(() => {
    fetchData()
    connectSocket(token)

    // Listen for incoming messages
    const messageCleanup = onMessage((message) => {
      if (message.sender === userId || message.recipient === userId) {
        setMessages(prev => {
          // Prevent duplicates (REST response may already have added this message)
          if (prev.some(m => m._id === message._id)) return prev
          return [...prev, message]
        })
        scrollToBottom()
      }
    })

    // Listen for typing indicator
    const typingCleanup = onTyping(({ userId: typingUserId, isTyping: typing }) => {
      if (typingUserId === userId) {
        setIsTyping(typing)
      }
    })

    return () => {
      messageCleanup()
      typingCleanup()
      disconnectSocket()
    }
  }, [userId, currentUser._id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchData = async () => {
    try {
      const [userRes, messagesRes] = await Promise.all([
        api.get(`/users/${userId}`),
        api.get(`/messages/conversation/${userId}`)
      ])
      setOtherUser(userRes.data.data)
      setMessages(messagesRes.data.data?.messages || messagesRes.data.data)

      // Mark messages as read
      await api.put(`/messages/read/${userId}`)
    } catch (error) {
      console.error('Fetch data error:', error)
    } finally {
      setLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      const response = await api.post(`/messages/${userId}`, {
        content: newMessage.trim()
      })

      // Emit via socket
      sendMessage({
        ...response.data.data,
        sender: currentUser._id,
        recipient: userId
      })

      setMessages(prev => {
        if (prev.some(m => m._id === response.data.data._id)) return prev
        return [...prev, response.data.data]
      })
      setNewMessage('')
      scrollToBottom()
    } catch (error) {
      console.error('Send message error:', error)
    } finally {
      setSending(false)
    }
  }

  const handleTyping = (e) => {
    setNewMessage(e.target.value)

    // Emit typing indicator
    emitTyping(userId, true)

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Stop typing after 2 seconds
    typingTimeoutRef.current = setTimeout(() => {
      emitTyping(userId, false)
    }, 2000)
  }

  const formatMessageTime = (date) => {
    return format(new Date(date), 'HH:mm')
  }

  const formatDateDivider = (date) => {
    const msgDate = new Date(date)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (isSameDay(msgDate, today)) return 'Today'
    if (isSameDay(msgDate, yesterday)) return 'Yesterday'
    return format(msgDate, 'MMMM d, yyyy')
  }

  const shouldShowDateDivider = (currentMsg, prevMsg) => {
    if (!prevMsg) return true
    return !isSameDay(new Date(currentMsg.createdAt), new Date(prevMsg.createdAt))
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    )
  }

  if (!otherUser) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <p className="text-gray-500">User not found</p>
        <Link to="/messages" className="btn btn-primary mt-4">Back to Messages</Link>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-white rounded-xl shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center space-x-4">
          <Link to="/messages" className="text-gray-500 hover:text-gray-700 lg:hidden">
            <ArrowLeft size={20} />
          </Link>
          <div className="relative">
            <img
              src={otherUser.profileImage ? `/uploads/profiles/${otherUser.profileImage}` : '/default-avatar.png'}
              alt={otherUser.name}
              className="avatar avatar-lg"
              onError={(e) => { e.target.src = '/default-avatar.png' }}
            />
            {otherUser.isOnline && (
              <Circle size={10} className="absolute bottom-0 right-0 text-green-500 fill-green-500" />
            )}
          </div>
          <div>
            <Link to={`/user/${otherUser._id}`} className="font-semibold text-gray-900 hover:text-primary-600">
              {otherUser.name}
            </Link>
            <p className="text-sm text-gray-500">
              {isTyping ? (
                <span className="text-primary-600">typing...</span>
              ) : otherUser.isOnline ? (
                'Online'
              ) : (
                `${otherUser.branch} • ${otherUser.batchEnd}`
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full">
            <Phone size={20} />
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full">
            <Video size={20} />
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <img
              src={otherUser.profileImage ? `/uploads/profiles/${otherUser.profileImage}` : '/default-avatar.png'}
              alt={otherUser.name}
              className="w-20 h-20 rounded-full mb-4"
              onError={(e) => { e.target.src = '/default-avatar.png' }}
            />
            <h3 className="font-semibold text-gray-900">{otherUser.name}</h3>
            <p className="text-sm text-gray-500">{otherUser.branch} • {otherUser.batchEnd}</p>
            <p className="text-gray-500 mt-4">Start a conversation with {otherUser.name.split(' ')[0]}</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={msg._id}>
              {/* Date Divider */}
              {shouldShowDateDivider(msg, messages[index - 1]) && (
                <div className="flex items-center justify-center my-6">
                  <div className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-500">
                    {formatDateDivider(msg.createdAt)}
                  </div>
                </div>
              )}

              {/* Message Bubble */}
              <div className={`flex ${msg.sender === currentUser._id ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                  msg.sender === currentUser._id
                    ? 'bg-primary-500 text-white rounded-br-md'
                    : 'bg-gray-100 text-gray-900 rounded-bl-md'
                }`}>
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  <p className={`text-xs mt-1 ${
                    msg.sender === currentUser._id ? 'text-primary-100' : 'text-gray-500'
                  }`}>
                    {formatMessageTime(msg.createdAt)}
                    {msg.sender === currentUser._id && (
                      <span className="ml-1">
                        {msg.readAt ? '✓✓' : '✓'}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="px-6 py-4 border-t border-gray-100">
        <div className="flex items-center space-x-4">
          <button type="button" className="text-gray-400 hover:text-gray-600">
            <Paperclip size={20} />
          </button>
          <button type="button" className="text-gray-400 hover:text-gray-600">
            <Image size={20} />
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="p-2 bg-primary-500 text-white rounded-full hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  )
}

export default Conversation
