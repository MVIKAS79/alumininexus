import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../services/api'
import toast from 'react-hot-toast'
import {
  Users,
  Search,
  Award,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  Building2,
  GraduationCap,
  Calendar
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const Mentorship = () => {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState(user?.role === 'alumni' ? 'requests' : 'mentors')
  const [mentors, setMentors] = useState([])
  const [requests, setRequests] = useState([])
  const [myMentors, setMyMentors] = useState([])
  const [myMentees, setMyMentees] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [selectedMentor, setSelectedMentor] = useState(null)
  const [requestMessage, setRequestMessage] = useState('')
  const [requestArea, setRequestArea] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'mentors') {
        const response = await api.get('/mentorship/mentors')
        setMentors(response.data.data)
      } else if (activeTab === 'requests') {
        const response = await api.get('/mentorship/requests')
        setRequests(response.data.data)
      } else if (activeTab === 'my-mentors') {
        const response = await api.get('/mentorship/my-requests?status=accepted')
        setMyMentors(response.data.data)
      } else if (activeTab === 'mentees') {
        const response = await api.get('/mentorship/requests?status=accepted')
        setMyMentees(response.data.data)
      }
    } catch (error) {
      console.error('Fetch data error:', error)
    } finally {
      setLoading(false)
    }
  }

  const openRequestModal = (mentor) => {
    setSelectedMentor(mentor)
    setShowRequestModal(true)
    setRequestMessage('')
    setRequestArea(mentor.mentorshipAreas?.[0] || '')
  }

  const handleSendRequest = async () => {
    if (!requestMessage.trim()) {
      toast.error('Please enter a message')
      return
    }

    setSending(true)
    try {
      await api.post(`/mentorship/${selectedMentor._id}`, {
        topic: requestArea || 'General Mentorship',
        area: requestArea,
        message: requestMessage
      })
      toast.success('Mentorship request sent!')
      setShowRequestModal(false)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send request')
    } finally {
      setSending(false)
    }
  }

  const handleRequestAction = async (requestId, action) => {
    try {
      await api.put(`/mentorship/${requestId}/respond`, { status: action })
      toast.success(`Request ${action}ed`)
      fetchData()
    } catch (error) {
      toast.error(`Failed to ${action} request`)
    }
  }

  const filteredMentors = mentors.filter(mentor =>
    mentor.name.toLowerCase().includes(search.toLowerCase()) ||
    mentor.company?.toLowerCase().includes(search.toLowerCase()) ||
    mentor.mentorshipAreas?.some(area => area.toLowerCase().includes(search.toLowerCase()))
  )

  const tabs = user?.role === 'alumni'
    ? [
        { id: 'requests', label: 'Requests', count: requests.filter(r => r.status === 'pending').length },
        { id: 'mentees', label: 'My Mentees' }
      ]
    : [
        { id: 'mentors', label: 'Find Mentors' },
        { id: 'my-mentors', label: 'My Mentors' },
        { id: 'requests', label: 'My Requests' }
      ]

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1 className="page-title">Mentorship</h1>
        <p className="page-subtitle">
          {user?.role === 'alumni' 
            ? 'Manage your mentorship requests and mentees'
            : 'Connect with experienced alumni mentors'}
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 text-sm font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'border-b-2 border-primary-500 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Find Mentors Tab */}
      {activeTab === 'mentors' && (
        <>
          <div className="card mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, company, or expertise area..."
                className="input pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="card">
                  <div className="flex items-center space-x-4">
                    <div className="skeleton w-16 h-16 rounded-full"></div>
                    <div>
                      <div className="skeleton h-5 w-32 mb-2"></div>
                      <div className="skeleton h-4 w-24"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredMentors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredMentors.map((mentor) => (
                <div key={mentor._id} className="card-hover">
                  <div className="flex items-start space-x-4">
                    <img
                      src={mentor.profileImage ? `/uploads/profiles/${mentor.profileImage}` : '/default-avatar.png'}
                      alt={mentor.name}
                      className="avatar avatar-lg"
                      onError={(e) => { e.target.src = '/default-avatar.png' }}
                    />
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/user/${mentor._id}`}
                        className="font-semibold text-gray-900 hover:text-primary-600"
                      >
                        {mentor.name}
                      </Link>
                      {mentor.designation && (
                        <p className="text-sm text-gray-600">{mentor.designation}</p>
                      )}
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <GraduationCap size={14} className="mr-1" />
                        <span>{mentor.branch} • {mentor.batchEnd}</span>
                      </div>
                      {mentor.company && (
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Building2 size={14} className="mr-1" />
                          <span>{mentor.company}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {mentor.mentorshipAreas?.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs text-gray-500 mb-2">Can help with:</p>
                      <div className="flex flex-wrap gap-1">
                        {mentor.mentorshipAreas.map((area, i) => (
                          <span key={i} className="badge badge-gray text-xs">{area}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-100">
                    <Link
                      to={`/messages/${mentor._id}`}
                      className="btn btn-secondary btn-sm flex-1"
                    >
                      <MessageSquare size={14} className="mr-1" />
                      Message
                    </Link>
                    <button
                      onClick={() => openRequestModal(mentor)}
                      className="btn btn-primary btn-sm flex-1"
                    >
                      <Award size={14} className="mr-1" />
                      Request Mentorship
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No mentors found</h3>
              <p className="text-gray-500">Try adjusting your search</p>
            </div>
          )}
        </>
      )}

      {/* Requests Tab */}
      {activeTab === 'requests' && (
        <>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="card">
                  <div className="skeleton h-20 w-full"></div>
                </div>
              ))}
            </div>
          ) : requests.length > 0 ? (
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request._id} className="card">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <img
                        src={(user?.role === 'alumni' ? request.mentee : request.mentor)?.profileImage 
                          ? `/uploads/profiles/${(user?.role === 'alumni' ? request.mentee : request.mentor).profileImage}` 
                          : '/default-avatar.png'}
                        alt=""
                        className="avatar avatar-lg"
                        onError={(e) => { e.target.src = '/default-avatar.png' }}
                      />
                      <div>
                        <Link
                          to={`/user/${(user?.role === 'alumni' ? request.mentee : request.mentor)?._id}`}
                          className="font-semibold text-gray-900 hover:text-primary-600"
                        >
                          {(user?.role === 'alumni' ? request.mentee : request.mentor)?.name}
                        </Link>
                        <p className="text-sm text-gray-600">
                          {(user?.role === 'alumni' ? request.mentee : request.mentor)?.branch} • 
                          {(user?.role === 'alumni' ? request.mentee : request.mentor)?.batchEnd}
                        </p>
                        {request.area && (
                          <span className="badge badge-primary text-xs mt-1">{request.area}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`badge ${
                        request.status === 'pending' ? 'badge-warning' :
                        request.status === 'accepted' ? 'badge-success' : 'badge-gray'
                      }`}>
                        {request.status}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  {request.message && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">{request.message}</p>
                    </div>
                  )}

                  {user?.role === 'alumni' && request.status === 'pending' && (
                    <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => handleRequestAction(request._id, 'accept')}
                        className="btn btn-primary btn-sm flex-1"
                      >
                        <CheckCircle size={14} className="mr-1" />
                        Accept
                      </button>
                      <button
                        onClick={() => handleRequestAction(request._id, 'reject')}
                        className="btn btn-secondary btn-sm flex-1"
                      >
                        <XCircle size={14} className="mr-1" />
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="card text-center py-12">
              <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No requests</h3>
              <p className="text-gray-500">
                {user?.role === 'alumni' 
                  ? 'You have no pending mentorship requests'
                  : 'You haven\'t sent any mentorship requests yet'}
              </p>
            </div>
          )}
        </>
      )}

      {/* My Mentors Tab */}
      {activeTab === 'my-mentors' && (
        <>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="card">
                  <div className="skeleton h-20 w-full"></div>
                </div>
              ))}
            </div>
          ) : myMentors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myMentors.map((mentorship) => (
                <div key={mentorship._id} className="card">
                  <div className="flex items-start space-x-4">
                    <img
                      src={mentorship.mentor?.profileImage ? `/uploads/profiles/${mentorship.mentor.profileImage}` : '/default-avatar.png'}
                      alt={mentorship.mentor?.name}
                      className="avatar avatar-lg"
                      onError={(e) => { e.target.src = '/default-avatar.png' }}
                    />
                    <div className="flex-1">
                      <Link
                        to={`/user/${mentorship.mentor?._id}`}
                        className="font-semibold text-gray-900 hover:text-primary-600"
                      >
                        {mentorship.mentor?.name}
                      </Link>
                      <p className="text-sm text-gray-600">{mentorship.mentor?.designation}</p>
                      <p className="text-sm text-gray-500">{mentorship.mentor?.company}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <Link
                      to={`/messages/${mentorship.mentor?._id}`}
                      className="btn btn-primary btn-sm w-full"
                    >
                      <MessageSquare size={14} className="mr-1" />
                      Message Mentor
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card text-center py-12">
              <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No mentors yet</h3>
              <p className="text-gray-500 mb-4">Find and connect with alumni mentors</p>
              <button
                onClick={() => setActiveTab('mentors')}
                className="btn btn-primary"
              >
                Find Mentors
              </button>
            </div>
          )}
        </>
      )}

      {/* Mentees Tab (for alumni) */}
      {activeTab === 'mentees' && (
        <>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="card">
                  <div className="skeleton h-20 w-full"></div>
                </div>
              ))}
            </div>
          ) : myMentees.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myMentees.map((mentorship) => (
                <div key={mentorship._id} className="card">
                  <div className="flex items-start space-x-4">
                    <img
                      src={mentorship.mentee?.profileImage ? `/uploads/profiles/${mentorship.mentee.profileImage}` : '/default-avatar.png'}
                      alt={mentorship.mentee?.name}
                      className="avatar avatar-lg"
                      onError={(e) => { e.target.src = '/default-avatar.png' }}
                    />
                    <div className="flex-1">
                      <Link
                        to={`/user/${mentorship.mentee?._id}`}
                        className="font-semibold text-gray-900 hover:text-primary-600"
                      >
                        {mentorship.mentee?.name}
                      </Link>
                      <p className="text-sm text-gray-600">{mentorship.mentee?.branch} • {mentorship.mentee?.batchEnd}</p>
                      {mentorship.area && (
                        <span className="badge badge-primary text-xs mt-1">{mentorship.area}</span>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <Link
                      to={`/messages/${mentorship.mentee?._id}`}
                      className="btn btn-primary btn-sm w-full"
                    >
                      <MessageSquare size={14} className="mr-1" />
                      Message Mentee
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No mentees yet</h3>
              <p className="text-gray-500">Accept mentorship requests to start mentoring students</p>
            </div>
          )}
        </>
      )}

      {/* Request Modal */}
      {showRequestModal && selectedMentor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 animate-fadeIn">
            <h2 className="text-xl font-semibold mb-4">Request Mentorship</h2>
            <div className="flex items-center space-x-3 mb-4">
              <img
                src={selectedMentor.profileImage ? `/uploads/profiles/${selectedMentor.profileImage}` : '/default-avatar.png'}
                alt={selectedMentor.name}
                className="avatar"
                onError={(e) => { e.target.src = '/default-avatar.png' }}
              />
              <div>
                <p className="font-medium">{selectedMentor.name}</p>
                <p className="text-sm text-gray-500">{selectedMentor.designation}</p>
              </div>
            </div>

            {selectedMentor.mentorshipAreas?.length > 0 && (
              <div className="mb-4">
                <label className="label">Area of Mentorship</label>
                <select
                  value={requestArea}
                  onChange={(e) => setRequestArea(e.target.value)}
                  className="input"
                >
                  {selectedMentor.mentorshipAreas.map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="mb-4">
              <label className="label">Your Message *</label>
              <textarea
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                rows={4}
                className="input"
                placeholder="Introduce yourself and explain what you'd like guidance with..."
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowRequestModal(false)}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleSendRequest}
                disabled={sending}
                className="btn btn-primary flex-1"
              >
                {sending ? 'Sending...' : (
                  <>
                    <Send size={16} className="mr-2" />
                    Send Request
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Mentorship
