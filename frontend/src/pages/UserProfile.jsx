import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../services/api'
import toast from 'react-hot-toast'
import {
  MapPin,
  Building2,
  GraduationCap,
  Mail,
  MessageSquare,
  UserPlus,
  UserCheck,
  UserX,
  Clock,
  Linkedin,
  Github,
  Globe,
  Briefcase,
  Award,
  ArrowLeft
} from 'lucide-react'

const UserProfile = () => {
  const { id: userId } = useParams()
  const navigate = useNavigate()
  const { user: currentUser } = useAuthStore()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [userId])

  const fetchProfile = async () => {
    try {
      const response = await api.get(`/users/${userId}`)
      setProfile(response.data.data)
      
      // Check connection status
      if (currentUser) {
        checkConnectionStatus()
      }
    } catch (error) {
      console.error('Fetch profile error:', error)
      toast.error('User not found')
      navigate('/directory')
    } finally {
      setLoading(false)
    }
  }

  const checkConnectionStatus = async () => {
    try {
      const response = await api.get(`/connections/status/${userId}`)
      setConnectionStatus(response.data.data.status)
    } catch (error) {
      setConnectionStatus(null)
    }
  }

  const handleConnect = async () => {
    setActionLoading(true)
    try {
      await api.post(`/connections/request/${userId}`)
      setConnectionStatus('pending')
      toast.success('Connection request sent!')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send request')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancelRequest = async () => {
    setActionLoading(true)
    try {
      await api.delete(`/connections/request/${userId}`)
      setConnectionStatus(null)
      toast.success('Request cancelled')
    } catch (error) {
      toast.error('Failed to cancel request')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRemoveConnection = async () => {
    setActionLoading(true)
    try {
      await api.delete(`/connections/${userId}`)
      setConnectionStatus(null)
      toast.success('Connection removed')
    } catch (error) {
      toast.error('Failed to remove connection')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-fadeIn">
        <div className="card">
          <div className="flex items-center space-x-6">
            <div className="skeleton w-24 h-24 rounded-full"></div>
            <div>
              <div className="skeleton h-6 w-48 mb-2"></div>
              <div className="skeleton h-4 w-32"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) return null

  const isOwnProfile = currentUser && currentUser._id === userId

  return (
    <div className="animate-fadeIn">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={20} className="mr-2" />
        Back
      </button>

      {/* Profile Header */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <img
              src={profile.profileImage ? `/uploads/profiles/${profile.profileImage}` : '/default-avatar.png'}
              alt={profile.name}
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
              onError={(e) => { e.target.src = '/default-avatar.png' }}
            />
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
                {profile.isVerified && (
                  <span className="text-blue-500" title="Verified">✓</span>
                )}
                <span className={`badge ${
                  profile.role === 'alumni' ? 'badge-primary' : 'badge-secondary'
                }`}>
                  {profile.role}
                </span>
              </div>
              {profile.designation && (
                <p className="text-gray-600 mt-1">{profile.designation}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                <div className="flex items-center">
                  <GraduationCap size={16} className="mr-1" />
                  {profile.branch} • {profile.batchStart}-{profile.batchEnd}
                </div>
                {profile.company && (
                  <div className="flex items-center">
                    <Building2 size={16} className="mr-1" />
                    {profile.company}
                  </div>
                )}
                {profile.location?.city && (
                  <div className="flex items-center">
                    <MapPin size={16} className="mr-1" />
                    {profile.location.city}, {profile.location.country}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {!isOwnProfile && currentUser && (
            <div className="flex space-x-3 mt-4 md:mt-0">
              <Link
                to={`/messages/${profile._id}`}
                className="btn btn-secondary"
              >
                <MessageSquare size={18} className="mr-2" />
                Message
              </Link>
              
              {connectionStatus === 'connected' ? (
                <button
                  onClick={handleRemoveConnection}
                  disabled={actionLoading}
                  className="btn btn-secondary"
                >
                  <UserCheck size={18} className="mr-2" />
                  Connected
                </button>
              ) : connectionStatus === 'pending' ? (
                <button
                  onClick={handleCancelRequest}
                  disabled={actionLoading}
                  className="btn btn-secondary"
                >
                  <Clock size={18} className="mr-2" />
                  Pending
                </button>
              ) : (
                <button
                  onClick={handleConnect}
                  disabled={actionLoading}
                  className="btn btn-primary"
                >
                  <UserPlus size={18} className="mr-2" />
                  Connect
                </button>
              )}
            </div>
          )}

          {isOwnProfile && (
            <Link to="/profile/edit" className="btn btn-primary mt-4 md:mt-0">
              Edit Profile
            </Link>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{profile.connections?.length || 0}</p>
            <p className="text-sm text-gray-500">Connections</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {profile.mentoring?.length || 0}
            </p>
            <p className="text-sm text-gray-500">Mentees</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {profile.profileViews || 0}
            </p>
            <p className="text-sm text-gray-500">Profile Views</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Bio */}
          {profile.bio && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">About</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{profile.bio}</p>
            </div>
          )}

          {/* Skills */}
          {profile.skills?.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill, i) => (
                  <span key={i} className="badge badge-primary">{skill}</span>
                ))}
              </div>
            </div>
          )}

          {/* Work Experience */}
          {profile.workExperience?.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Work Experience</h2>
              <div className="space-y-6">
                {profile.workExperience.map((exp, i) => (
                  <div key={i} className="flex space-x-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Briefcase size={20} className="text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{exp.title}</h3>
                      <p className="text-gray-600">{exp.company}</p>
                      <p className="text-sm text-gray-500">
                        {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                        {exp.location && ` • ${exp.location}`}
                      </p>
                      {exp.description && (
                        <p className="text-gray-600 mt-2">{exp.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact</h2>
            <div className="space-y-3">
              {connectionStatus === 'connected' && (
                <div className="flex items-center text-gray-600">
                  <Mail size={16} className="mr-3 text-gray-400" />
                  <span className="text-sm">{profile.email}</span>
                </div>
              )}
              {profile.linkedin && (
                <a
                  href={profile.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-gray-600 hover:text-primary-600"
                >
                  <Linkedin size={16} className="mr-3" />
                  <span className="text-sm">LinkedIn</span>
                </a>
              )}
              {profile.github && (
                <a
                  href={profile.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-gray-600 hover:text-primary-600"
                >
                  <Github size={16} className="mr-3" />
                  <span className="text-sm">GitHub</span>
                </a>
              )}
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-gray-600 hover:text-primary-600"
                >
                  <Globe size={16} className="mr-3" />
                  <span className="text-sm">Website</span>
                </a>
              )}
            </div>
          </div>

          {/* Mentorship */}
          {profile.role === 'alumni' && profile.openToMentor && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Mentorship</h2>
              <div className="flex items-center text-green-600 mb-3">
                <Award size={16} className="mr-2" />
                <span className="text-sm">Open to mentoring</span>
              </div>
              {profile.mentorshipAreas?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {profile.mentorshipAreas.map((area, i) => (
                    <span key={i} className="badge badge-gray text-xs">{area}</span>
                  ))}
                </div>
              )}
              {currentUser?.role === 'student' && (
                <Link
                  to={`/mentorship?mentor=${profile._id}`}
                  className="btn btn-primary btn-sm w-full mt-4"
                >
                  Request Mentorship
                </Link>
              )}
            </div>
          )}

          {/* Education */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Education</h2>
            <div className="flex space-x-4">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <GraduationCap size={20} className="text-primary-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Siddaganga Institute of Technology</h3>
                <p className="text-gray-600">{profile.branch}</p>
                <p className="text-sm text-gray-500">{profile.batchStart} - {profile.batchEnd}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserProfile
