import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../services/api'
import {
  Edit2,
  MapPin,
  Building2,
  GraduationCap,
  Mail,
  Phone,
  Linkedin,
  Github,
  Globe,
  Briefcase,
  Calendar,
  Users,
  BookOpen,
  Award
} from 'lucide-react'

const Profile = () => {
  const { user } = useAuthStore()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('about')

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await api.get('/profiles/me')
      setProfile(response.data.data)
    } catch (error) {
      console.error('Fetch profile error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-fadeIn">
        <div className="card mb-6">
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

  const tabs = [
    { id: 'about', label: 'About' },
    { id: 'experience', label: 'Experience' },
    { id: 'education', label: 'Education' },
    { id: 'connections', label: 'Connections' }
  ]

  return (
    <div className="animate-fadeIn">
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
          <Link to="/profile/edit" className="btn btn-primary mt-4 md:mt-0">
            <Edit2 size={16} className="mr-2" />
            Edit Profile
          </Link>
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
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {activeTab === 'about' && (
            <div className="space-y-6">
              {/* Bio */}
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">About</h2>
                <p className="text-gray-600 whitespace-pre-wrap">
                  {profile.bio || 'No bio added yet.'}
                </p>
              </div>

              {/* Skills */}
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Skills</h2>
                {profile.skills?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill, i) => (
                      <span key={i} className="badge badge-primary">{skill}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No skills added yet.</p>
                )}
              </div>

              {/* Interests */}
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Interests</h2>
                {profile.interests?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.map((interest, i) => (
                      <span key={i} className="badge badge-secondary">{interest}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No interests added yet.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'experience' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Work Experience</h2>
              {profile.workExperience?.length > 0 ? (
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
              ) : (
                <p className="text-gray-500">No work experience added yet.</p>
              )}
            </div>
          )}

          {activeTab === 'education' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Education</h2>
              <div className="space-y-6">
                {/* SIT Education - Always shown */}
                <div className="flex space-x-4">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <GraduationCap size={20} className="text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Siddaganga Institute of Technology</h3>
                    <p className="text-gray-600">{profile.branch}</p>
                    <p className="text-sm text-gray-500">{profile.batchStart} - {profile.batchEnd}</p>
                    {profile.usn && (
                      <p className="text-sm text-gray-500">USN: {profile.usn}</p>
                    )}
                  </div>
                </div>

                {/* Additional Education */}
                {profile.education?.map((edu, i) => (
                  <div key={i} className="flex space-x-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <BookOpen size={20} className="text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{edu.institution}</h3>
                      <p className="text-gray-600">{edu.degree} in {edu.field}</p>
                      <p className="text-sm text-gray-500">{edu.startYear} - {edu.endYear}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'connections' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Connections</h2>
              {profile.connections?.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {profile.connections.slice(0, 10).map((conn) => (
                    <Link
                      key={conn._id}
                      to={`/user/${conn._id}`}
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50"
                    >
                      <img
                        src={conn.profileImage ? `/uploads/profiles/${conn.profileImage}` : '/default-avatar.png'}
                        alt={conn.name}
                        className="avatar"
                        onError={(e) => { e.target.src = '/default-avatar.png' }}
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{conn.name}</p>
                        <p className="text-sm text-gray-500 truncate">{conn.designation || conn.branch}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No connections yet</p>
                  <Link to="/directory" className="btn btn-primary mt-4">
                    Find Connections
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Info</h2>
            <div className="space-y-3">
              <div className="flex items-center text-gray-600">
                <Mail size={16} className="mr-3 text-gray-400" />
                <span className="text-sm">{profile.email}</span>
              </div>
              {profile.phone && (
                <div className="flex items-center text-gray-600">
                  <Phone size={16} className="mr-3 text-gray-400" />
                  <span className="text-sm">{profile.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Social Links */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Social Links</h2>
            <div className="space-y-3">
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
              {!profile.linkedin && !profile.github && !profile.website && (
                <p className="text-sm text-gray-500">No social links added</p>
              )}
            </div>
          </div>

          {/* Mentorship */}
          {profile.role === 'alumni' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Mentorship</h2>
              <div className={`flex items-center ${
                profile.openToMentor ? 'text-green-600' : 'text-gray-500'
              }`}>
                <Award size={16} className="mr-2" />
                <span className="text-sm">
                  {profile.openToMentor ? 'Open to mentoring' : 'Not available for mentorship'}
                </span>
              </div>
              {profile.mentorshipAreas?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {profile.mentorshipAreas.map((area, i) => (
                    <span key={i} className="badge badge-gray text-xs">{area}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile
