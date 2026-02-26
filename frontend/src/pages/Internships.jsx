import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../services/api'
import { useDebounce } from '../hooks/useDebounce'
import {
  Search,
  Filter,
  MapPin,
  Building2,
  Clock,
  Briefcase,
  DollarSign,
  Calendar,
  Plus,
  X,
  ExternalLink
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const Internships = () => {
  const { user } = useAuthStore()
  const [opportunities, setOpportunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    location: '',
    isRemote: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })

  const types = ['internship', 'full-time', 'part-time', 'contract', 'freelance']

  const debouncedSearch = useDebounce(filters.search, 400)

  useEffect(() => {
    fetchOpportunities()
  }, [debouncedSearch, filters.type, filters.location, filters.isRemote, pagination.page])

  const fetchOpportunities = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v)
        )
      })

      const response = await api.get(`/internships?${params}`)
      setOpportunities(response.data.data)
      setPagination(prev => ({ ...prev, ...response.data.pagination }))
    } catch (error) {
      console.error('Fetch opportunities error:', error)
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
      type: '',
      location: '',
      isRemote: ''
    })
  }

  const formatSalary = (opportunity) => {
    if (!opportunity.salary?.min) return 'Not disclosed'
    const { min, max, currency, period } = opportunity.salary
    if (max) {
      return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()} / ${period}`
    }
    return `${currency} ${min.toLocaleString()} / ${period}`
  }

  const canPost = user && (user.role === 'alumni' || user.role === 'placement' || user.role === 'admin')

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Opportunities</h1>
          <p className="page-subtitle">Internships and job opportunities from alumni</p>
        </div>
        {canPost && (
          <Link to="/internships/new" className="btn btn-primary">
            <Plus size={18} className="mr-2" />
            Post Opportunity
          </Link>
        )}
      </div>

      {/* Search and Filters */}
      <div className="card mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search jobs, companies, skills..."
              className="input pl-10"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Filter size={18} className="mr-2" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">Job Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="input"
                >
                  <option value="">All Types</option>
                  {types.map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Location</label>
                <input
                  type="text"
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  placeholder="e.g., Bangalore"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Work Mode</label>
                <select
                  value={filters.isRemote}
                  onChange={(e) => handleFilterChange('isRemote', e.target.value)}
                  className="input"
                >
                  <option value="">All</option>
                  <option value="true">Remote</option>
                  <option value="false">On-site</option>
                </select>
              </div>
            </div>
            <button
              onClick={clearFilters}
              className="mt-4 text-sm text-gray-500 hover:text-gray-700 flex items-center"
            >
              <X size={14} className="mr-1" />
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card">
              <div className="flex items-start space-x-4">
                <div className="skeleton w-12 h-12 rounded-lg"></div>
                <div className="flex-1">
                  <div className="skeleton h-5 w-64 mb-2"></div>
                  <div className="skeleton h-4 w-32 mb-2"></div>
                  <div className="skeleton h-4 w-48"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : opportunities.length > 0 ? (
        <>
          <div className="text-sm text-gray-500 mb-4">
            Showing {opportunities.length} of {pagination.total} opportunities
          </div>
          <div className="space-y-4">
            {opportunities.map((job) => (
              <Link
                key={job._id}
                to={`/internships/${job._id}`}
                className="card-hover block"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Building2 size={24} className="text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 hover:text-primary-600">
                        {job.title}
                      </h3>
                      <p className="text-gray-600">{job.company}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
                        <span className="flex items-center">
                          <MapPin size={14} className="mr-1" />
                          {job.isRemote ? 'Remote' : job.location || 'Not specified'}
                        </span>
                        <span className="flex items-center">
                          <Briefcase size={14} className="mr-1" />
                          {job.type.charAt(0).toUpperCase() + job.type.slice(1).replace('-', ' ')}
                        </span>
                        <span className="flex items-center">
                          <DollarSign size={14} className="mr-1" />
                          {formatSalary(job)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`badge ${
                      job.status === 'open' ? 'badge-success' : 'badge-gray'
                    }`}>
                      {job.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-2">
                      <Clock size={12} className="inline mr-1" />
                      {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                {/* Skills */}
                {job.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                    {job.skills.slice(0, 5).map((skill, i) => (
                      <span key={i} className="badge badge-gray">{skill}</span>
                    ))}
                    {job.skills.length > 5 && (
                      <span className="badge badge-gray">+{job.skills.length - 5}</span>
                    )}
                  </div>
                )}

                {/* Posted By */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-2">
                    <img
                      src={job.postedBy?.profileImage ? `/uploads/profiles/${job.postedBy.profileImage}` : '/default-avatar.png'}
                      alt={job.postedBy?.name}
                      className="avatar avatar-sm"
                      onError={(e) => { e.target.src = '/default-avatar.png' }}
                    />
                    <span className="text-sm text-gray-600">
                      Posted by {job.postedBy?.name}
                    </span>
                  </div>
                  {job.applicationDeadline && (
                    <span className="text-sm text-gray-500">
                      <Calendar size={14} className="inline mr-1" />
                      Apply by {new Date(job.applicationDeadline).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </Link>
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
          <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No opportunities found</h3>
          <p className="text-gray-500">Try adjusting your filters or check back later</p>
        </div>
      )}
    </div>
  )
}

export default Internships
