import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../services/api'
import { useDebounce } from '../hooks/useDebounce'
import {
  Search,
  Filter,
  MapPin,
  Building2,
  GraduationCap,
  MessageSquare,
  UserPlus,
  X,
  Users
} from 'lucide-react'

const Directory = () => {
  const [searchParams] = useSearchParams()
  const initialSearch = searchParams.get('search') || ''
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: initialSearch,
    branch: '',
    batchStart: '',
    batchEnd: '',
    company: '',
    role: 'alumni'
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  })
  const [showFilters, setShowFilters] = useState(false)

  // Debounce search and company filters
  const debouncedSearch = useDebounce(filters.search, 400)
  const debouncedCompany = useDebounce(filters.company, 400)

  const branches = [
    'All', 'CSE', 'ISE', 'ECE', 'EEE', 'MECH', 'CIVIL', 
    'CHEM', 'BT', 'IEM', 'AIML', 'DS', 'Other'
  ]

  useEffect(() => {
    fetchUsers()
  }, [debouncedSearch, debouncedCompany, filters.branch, filters.batchStart, filters.batchEnd, filters.role, pagination.page])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v && v !== 'All')
        )
      })

      const response = await api.get(`/users?${params}`)
      setUsers(response.data.data)
      setPagination(prev => ({ ...prev, ...response.data.pagination }))
    } catch (error) {
      console.error('Fetch users error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      branch: '',
      batchStart: '',
      batchEnd: '',
      company: '',
      role: 'alumni'
    })
  }

  const activeFiltersCount = Object.values(filters).filter(v => v && v !== 'alumni').length

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1 className="page-title">Alumni Directory</h1>
        <p className="page-subtitle">Find and connect with SIT alumni</p>
      </div>

      {/* Search and Filters */}
      <div className="card mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search by name, company, skills..."
              className="input pl-10"
            />
          </div>

          {/* Role Toggle */}
          <div className="flex rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => handleFilterChange('role', 'alumni')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                filters.role === 'alumni'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              Alumni
            </button>
            <button
              onClick={() => handleFilterChange('role', 'student')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                filters.role === 'student'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              Students
            </button>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'} relative`}
          >
            <Filter size={18} className="mr-2" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 animate-fadeIn">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="label">Branch</label>
                <select
                  value={filters.branch}
                  onChange={(e) => handleFilterChange('branch', e.target.value)}
                  className="input"
                >
                  {branches.map(branch => (
                    <option key={branch} value={branch === 'All' ? '' : branch}>
                      {branch}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Batch From</label>
                <input
                  type="number"
                  value={filters.batchStart}
                  onChange={(e) => handleFilterChange('batchStart', e.target.value)}
                  placeholder="e.g., 2020"
                  className="input"
                  min="1963"
                  max={new Date().getFullYear()}
                />
              </div>
              <div>
                <label className="label">Batch To</label>
                <input
                  type="number"
                  value={filters.batchEnd}
                  onChange={(e) => handleFilterChange('batchEnd', e.target.value)}
                  placeholder="e.g., 2024"
                  className="input"
                  min="1963"
                />
              </div>
              <div>
                <label className="label">Company</label>
                <input
                  type="text"
                  value={filters.company}
                  onChange={(e) => handleFilterChange('company', e.target.value)}
                  placeholder="e.g., Google"
                  className="input"
                />
              </div>
            </div>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="mt-4 text-sm text-gray-500 hover:text-gray-700 flex items-center"
              >
                <X size={14} className="mr-1" />
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card">
              <div className="flex items-center space-x-4">
                <div className="skeleton w-16 h-16 rounded-full"></div>
                <div className="flex-1">
                  <div className="skeleton h-4 w-32 mb-2"></div>
                  <div className="skeleton h-3 w-24"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : users.length > 0 ? (
        <>
          <div className="text-sm text-gray-500 mb-4">
            Showing {users.length} of {pagination.total} results
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((user) => (
              <div key={user._id} className="card-hover">
                <div className="flex items-start space-x-4">
                  <img
                    src={user.profileImage ? `/uploads/profiles/${user.profileImage}` : '/default-avatar.png'}
                    alt={user.name}
                    className="avatar avatar-lg"
                    onError={(e) => { e.target.src = '/default-avatar.png' }}
                  />
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/user/${user._id}`}
                      className="font-semibold text-gray-900 hover:text-primary-600 truncate block"
                    >
                      {user.name}
                      {user.isVerified && (
                        <span className="ml-1 text-blue-500" title="Verified">✓</span>
                      )}
                    </Link>
                    {user.designation && (
                      <p className="text-sm text-gray-600 truncate">{user.designation}</p>
                    )}
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <GraduationCap size={14} className="mr-1" />
                      <span>{user.branch} • {user.batchEnd}</span>
                    </div>
                  </div>
                </div>

                {user.company && (
                  <div className="flex items-center text-sm text-gray-600 mt-3">
                    <Building2 size={14} className="mr-2 text-gray-400" />
                    <span className="truncate">{user.company}</span>
                  </div>
                )}

                {user.location?.city && (
                  <div className="flex items-center text-sm text-gray-600 mt-1">
                    <MapPin size={14} className="mr-2 text-gray-400" />
                    <span>{user.location.city}, {user.location.country}</span>
                  </div>
                )}

                {user.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {user.skills.slice(0, 3).map((skill, i) => (
                      <span key={i} className="badge badge-gray">{skill}</span>
                    ))}
                    {user.skills.length > 3 && (
                      <span className="badge badge-gray">+{user.skills.length - 3}</span>
                    )}
                  </div>
                )}

                <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-100">
                  <Link
                    to={`/messages/${user._id}`}
                    className="btn btn-secondary btn-sm flex-1"
                  >
                    <MessageSquare size={14} className="mr-1" />
                    Message
                  </Link>
                  <Link
                    to={`/user/${user._id}`}
                    className="btn btn-primary btn-sm flex-1"
                  >
                    <UserPlus size={14} className="mr-1" />
                    Connect
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center space-x-2 mt-8">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="btn btn-secondary btn-sm"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.pages}
                className="btn btn-secondary btn-sm"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="card text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
          <p className="text-gray-500">Try adjusting your filters</p>
        </div>
      )}
    </div>
  )
}

export default Directory
