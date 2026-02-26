import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../services/api'
import { connectSocket, disconnectSocket, onMessage } from '../services/socket'
import { MessageSquare, Search, Circle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const Messages = () => {
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const { token } = useAuthStore()

  useEffect(() => {
    fetchConversations()
    connectSocket(token)

    // Listen for new messages to update conversation list
    const messageCleanup = onMessage(() => {
      fetchConversations()
    })

    return () => {
      messageCleanup()
    }
  }, [])

  const fetchConversations = async () => {
    try {
      const response = await api.get('/messages/conversations')
      setConversations(response.data.data)
    } catch (error) {
      console.error('Fetch conversations error:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredConversations = conversations.filter(conv =>
    conv.user.name.toLowerCase().includes(search.toLowerCase())
  )

  const formatTime = (date) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true })
    } catch {
      return ''
    }
  }

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1 className="page-title">Messages</h1>
        <p className="page-subtitle">Your conversations</p>
      </div>

      <div className="card">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="input pl-10"
          />
        </div>

        {/* Conversation List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4">
                <div className="skeleton w-12 h-12 rounded-full"></div>
                <div className="flex-1">
                  <div className="skeleton h-4 w-32 mb-2"></div>
                  <div className="skeleton h-3 w-48"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filteredConversations.map((conv) => (
              <Link
                key={conv.user._id}
                to={`/messages/${conv.user._id}`}
                className="flex items-center space-x-4 p-4 hover:bg-gray-50 transition-colors rounded-lg"
              >
                <div className="relative">
                  <img
                    src={conv.user.profileImage ? `/uploads/profiles/${conv.user.profileImage}` : '/default-avatar.png'}
                    alt={conv.user.name}
                    className="avatar avatar-lg"
                    onError={(e) => { e.target.src = '/default-avatar.png' }}
                  />
                  {conv.user.isOnline && (
                    <Circle
                      size={12}
                      className="absolute bottom-0 right-0 text-green-500 fill-green-500"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className={`font-medium truncate ${
                      conv.unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'
                    }`}>
                      {conv.user.name}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {formatTime(conv.lastMessage.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className={`text-sm truncate ${
                      conv.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'
                    }`}>
                      {conv.lastMessage.sender === conv.user._id ? '' : 'You: '}
                      {conv.lastMessage.content}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="ml-2 w-5 h-5 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
            <p className="text-gray-500 mb-4">Start connecting with alumni and students</p>
            <Link to="/directory" className="btn btn-primary">
              Browse Directory
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default Messages
