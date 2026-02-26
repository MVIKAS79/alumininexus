import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  MessageSquare,
  Search,
  Clock,
  Check,
  X
} from 'lucide-react'

const Connections = () => {
  const [activeTab, setActiveTab] = useState('connections')
  const [connections, setConnections] = useState([])
  const [pendingReceived, setPendingReceived] = useState([])
  const [pendingSent, setPendingSent] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'connections') {
        const response = await api.get('/connections')
        setConnections(response.data.data)
      } else if (activeTab === 'pending') {
        const response = await api.get('/connections/pending')
        setPendingReceived(response.data.data?.received?.map(r => r.user) || [])
        setPendingSent(response.data.data?.sent?.map(r => r.user) || [])
      }
    } catch (error) {
      console.error('Fetch data error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (userId) => {
    try {
      await api.put(`/connections/accept/${userId}`)
      toast.success('Connection accepted!')
      fetchData()
    } catch (error) {
      toast.error('Failed to accept connection')
    }
  }

  const handleReject = async (userId) => {
    try {
      await api.delete(`/connections/request/${userId}`)
      toast.success('Request rejected')
      fetchData()
    } catch (error) {
      toast.error('Failed to reject request')
    }
  }

  const handleCancel = async (userId) => {
    try {
      await api.delete(`/connections/request/${userId}`)
      toast.success('Request cancelled')
      fetchData()
    } catch (error) {
      toast.error('Failed to cancel request')
    }
  }

  const handleRemove = async (userId) => {
    if (!window.confirm('Remove this connection?')) return
    try {
      await api.delete(`/connections/${userId}`)
      toast.success('Connection removed')
      fetchData()
    } catch (error) {
      toast.error('Failed to remove connection')
    }
  }

  const filteredConnections = connections.filter(conn =>
    conn.name.toLowerCase().includes(search.toLowerCase()) ||
    conn.company?.toLowerCase().includes(search.toLowerCase())
  )

  const tabs = [
    { id: 'connections', label: 'My Connections', count: connections.length },
    { id: 'pending', label: 'Pending', count: pendingReceived.length }
  ]

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1 className="page-title">Connections</h1>
        <p className="page-subtitle">Manage your network</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-primary-500 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {tab.id === 'pending' && pendingReceived.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {pendingReceived.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Connections Tab */}
      {activeTab === 'connections' && (
        <>
          {/* Search */}
          <div className="card mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search connections..."
                className="input pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card">
                  <div className="flex items-center space-x-4">
                    <div className="skeleton w-12 h-12 rounded-full"></div>
                    <div>
                      <div className="skeleton h-4 w-24 mb-2"></div>
                      <div className="skeleton h-3 w-16"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConnections.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredConnections.map((conn) => (
                <div key={conn._id} className="card-hover">
                  <div className="flex items-center space-x-4">
                    <img
                      src={conn.profileImage ? `/uploads/profiles/${conn.profileImage}` : '/default-avatar.png'}
                      alt={conn.name}
                      className="avatar avatar-lg"
                      onError={(e) => { e.target.src = '/default-avatar.png' }}
                    />
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/user/${conn._id}`}
                        className="font-medium text-gray-900 hover:text-primary-600 truncate block"
                      >
                        {conn.name}
                      </Link>
                      <p className="text-sm text-gray-500 truncate">
                        {conn.designation || conn.branch}
                      </p>
                      {conn.company && (
                        <p className="text-sm text-gray-500 truncate">{conn.company}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-100">
                    <Link
                      to={`/messages/${conn._id}`}
                      className="btn btn-secondary btn-sm flex-1"
                    >
                      <MessageSquare size={14} className="mr-1" />
                      Message
                    </Link>
                    <button
                      onClick={() => handleRemove(conn._id)}
                      className="btn btn-secondary btn-sm text-red-600"
                    >
                      <UserX size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No connections yet</h3>
              <p className="text-gray-500 mb-4">Start building your network</p>
              <Link to="/directory" className="btn btn-primary">
                Find Connections
              </Link>
            </div>
          )}
        </>
      )}

      {/* Pending Tab */}
      {activeTab === 'pending' && (
        <>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="card">
                  <div className="skeleton h-16 w-full"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Received Requests */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Received Requests ({pendingReceived.length})
                </h2>
                {pendingReceived.length > 0 ? (
                  <div className="space-y-3">
                    {pendingReceived.map((request) => (
                      <div key={request._id} className="card">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <img
                              src={request.profileImage ? `/uploads/profiles/${request.profileImage}` : '/default-avatar.png'}
                              alt={request.name}
                              className="avatar avatar-lg"
                              onError={(e) => { e.target.src = '/default-avatar.png' }}
                            />
                            <div>
                              <Link
                                to={`/user/${request._id}`}
                                className="font-medium text-gray-900 hover:text-primary-600"
                              >
                                {request.name}
                              </Link>
                              <p className="text-sm text-gray-500">
                                {request.branch} • {request.batchEnd}
                              </p>
                              {request.company && (
                                <p className="text-sm text-gray-500">{request.company}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleAccept(request._id)}
                              className="btn btn-primary btn-sm"
                            >
                              <Check size={16} className="mr-1" />
                              Accept
                            </button>
                            <button
                              onClick={() => handleReject(request._id)}
                              className="btn btn-secondary btn-sm"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="card text-center py-8">
                    <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No pending requests</p>
                  </div>
                )}
              </div>

              {/* Sent Requests */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Sent Requests ({pendingSent.length})
                </h2>
                {pendingSent.length > 0 ? (
                  <div className="space-y-3">
                    {pendingSent.map((request) => (
                      <div key={request._id} className="card">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <img
                              src={request.profileImage ? `/uploads/profiles/${request.profileImage}` : '/default-avatar.png'}
                              alt={request.name}
                              className="avatar avatar-lg"
                              onError={(e) => { e.target.src = '/default-avatar.png' }}
                            />
                            <div>
                              <Link
                                to={`/user/${request._id}`}
                                className="font-medium text-gray-900 hover:text-primary-600"
                              >
                                {request.name}
                              </Link>
                              <p className="text-sm text-gray-500">
                                {request.branch} • {request.batchEnd}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleCancel(request._id)}
                            className="btn btn-secondary btn-sm"
                          >
                            Cancel Request
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="card text-center py-8">
                    <UserPlus className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No sent requests</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Connections
