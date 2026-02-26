import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../services/api'
import {
  Users,
  MessageSquare,
  Briefcase,
  GraduationCap,
  ArrowRight,
  TrendingUp,
  Clock,
  UserCheck,
  Edit3
} from 'lucide-react'

// Profile completion calculator
const getProfileCompletion = (user) => {
  if (!user) return 0
  const fields = ['name', 'email', 'role', 'branch', 'batchEnd', 'bio', 'company', 'skills', 'profileImage', 'linkedin']
  let filled = 0
  fields.forEach(f => {
    const val = user[f]
    if (Array.isArray(val) ? val.length > 0 : !!val) filled++
  })
  return Math.round((filled / fields.length) * 100)
}

const Dashboard = () => {
  const { user } = useAuthStore()
  const [stats, setStats] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [opportunities, setOpportunities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [statsRes, suggestionsRes, opportunitiesRes] = await Promise.all([
        api.get('/users/stats'),
        api.get('/users/suggestions?limit=4'),
        api.get('/internships?limit=3')
      ])

      setStats(statsRes.data.data)
      setSuggestions(suggestionsRes.data.data)
      setOpportunities(opportunitiesRes.data.opportunities || opportunitiesRes.data.data || [])
    } catch (error) {
      console.error('Dashboard data error:', error)
    } finally {
      setLoading(false)
    }
  }

  const quickLinks = [
    { to: '/directory', icon: Users, label: 'Find Alumni', color: 'bg-blue-500', desc: 'Browse the network' },
    { to: '/messages', icon: MessageSquare, label: 'Messages', color: 'bg-green-500', desc: 'Chat with peers' },
    { to: '/internships', icon: Briefcase, label: 'Opportunities', color: 'bg-purple-500', desc: 'Jobs & internships' },
    { to: '/mentorship', icon: GraduationCap, label: 'Mentorship', color: 'bg-orange-500', desc: 'Get guidance' }
  ]

  const profileCompletion = getProfileCompletion(user)

  return (
    <div className="animate-fadeIn space-y-6">
      {/* Welcome Section */}
      <div className="gradient-bg rounded-2xl p-6 lg:p-8 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <img
              src={user?.profileImage ? `/uploads/profiles/${user.profileImage}` : '/default-avatar.png'}
              alt={user?.name}
              className="w-16 h-16 rounded-full border-2 border-white/30 object-cover"
              onError={(e) => { e.target.src = '/default-avatar.png' }}
            />
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold">
                Welcome back, {user?.name?.split(' ')[0]}! 👋
              </h1>
              <p className="text-white/80 mt-1">
                {user?.role === 'student'
                  ? 'Connect with alumni and explore career opportunities'
                  : 'Help students grow and share your experience'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Link to="/profile" className="btn bg-white/20 text-white hover:bg-white/30 border border-white/20">
              <UserCheck size={18} className="mr-2" />
              View Profile
            </Link>
            <Link to="/profile/edit" className="btn bg-white text-primary-600 hover:bg-gray-100">
              <Edit3 size={18} className="mr-2" />
              Edit Profile
            </Link>
          </div>
        </div>

        {/* Profile Completion Bar */}
        {profileCompletion < 100 && (
          <div className="mt-5">
            <div className="flex items-center justify-between text-sm text-white/80 mb-1.5">
              <span>Profile completion</span>
              <span className="font-semibold text-white">{profileCompletion}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div
                className="bg-white rounded-full h-2 transition-all duration-500"
                style={{ width: `${profileCompletion}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickLinks.map(({ to, icon: Icon, label, color, desc }) => (
          <Link
            key={to}
            to={to}
            className="card-hover group flex flex-col items-center text-center p-5"
          >
            <div className={`w-14 h-14 rounded-xl ${color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              <Icon className="text-white" size={24} />
            </div>
            <span className="font-semibold text-gray-900">{label}</span>
            <span className="text-xs text-gray-500 mt-0.5">{desc}</span>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Stats Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Platform Stats */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Platform Overview</h2>
              <TrendingUp className="text-green-500" size={20} />
            </div>
            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="skeleton h-16"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats?.totalAlumni || 0}
                  </div>
                  <div className="text-sm text-gray-600">Alumni</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {stats?.totalStudents || 0}
                  </div>
                  <div className="text-sm text-gray-600">Students</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {stats?.companyStats?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Companies</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {stats?.countryStats?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Countries</div>
                </div>
              </div>
            )}
          </div>

          {/* Recent Opportunities */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Latest Opportunities</h2>
              <Link to="/internships" className="text-primary-600 text-sm hover:text-primary-700">
                View all
              </Link>
            </div>
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="skeleton h-20"></div>
                ))}
              </div>
            ) : opportunities.length > 0 ? (
              <div className="space-y-4">
                {opportunities.map((opp) => (
                  <Link
                    key={opp._id}
                    to={`/internships/${opp._id}`}
                    className="block p-4 rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{opp.title}</h3>
                        <p className="text-sm text-gray-600">{opp.company}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="badge badge-primary">{opp.type}</span>
                          {opp.location?.isRemote && (
                            <span className="badge badge-success">Remote</span>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <Clock size={14} className="mr-1" />
                        {new Date(opp.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No opportunities yet</p>
            )}
          </div>
        </div>

        {/* Suggested Connections */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">People You May Know</h2>
          </div>
          {loading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton h-16"></div>
              ))}
            </div>
          ) : suggestions.length > 0 ? (
            <div className="space-y-4">
              {suggestions.map((person) => (
                <Link
                  key={person._id}
                  to={`/user/${person._id}`}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <img
                    src={person.profileImage ? `/uploads/profiles/${person.profileImage}` : '/default-avatar.png'}
                    alt={person.name}
                    className="avatar avatar-md"
                    onError={(e) => { e.target.src = '/default-avatar.png' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{person.name}</p>
                    <p className="text-sm text-gray-500 truncate">
                      {person.company || `${person.branch} - ${person.batchEnd}`}
                    </p>
                  </div>
                  <span className="badge badge-gray capitalize">{person.role}</span>
                </Link>
              ))}
              <Link
                to="/directory"
                className="block text-center text-primary-600 text-sm hover:text-primary-700 pt-2"
              >
                View more alumni
              </Link>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No suggestions yet</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
