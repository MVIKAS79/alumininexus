import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../services/api'
import toast from 'react-hot-toast'
import {
  MapPin,
  Building2,
  Clock,
  Briefcase,
  DollarSign,
  Calendar,
  Users,
  ExternalLink,
  ArrowLeft,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

const InternshipDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)

  useEffect(() => {
    fetchJob()
  }, [id])

  const fetchJob = async () => {
    try {
      const response = await api.get(`/internships/${id}`)
      setJob(response.data.data)
      // Check if user has applied
      if (user) {
        const applied = response.data.data.applications?.some(
          app => app.applicant === user._id || app.applicant?._id === user._id
        )
        setHasApplied(applied)
      }
    } catch (error) {
      console.error('Fetch job error:', error)
      toast.error('Opportunity not found')
      navigate('/internships')
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async () => {
    if (!user) {
      toast.error('Please login to apply')
      return
    }

    setApplying(true)
    try {
      await api.post(`/internships/${id}/apply`)
      setHasApplied(true)
      toast.success('Application submitted successfully!')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to apply')
    } finally {
      setApplying(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this opportunity?')) return

    try {
      await api.delete(`/internships/${id}`)
      toast.success('Opportunity deleted')
      navigate('/internships')
    } catch (error) {
      toast.error('Failed to delete opportunity')
    }
  }

  const formatSalary = () => {
    if (!job.salary?.min) return 'Not disclosed'
    const { min, max, currency, period } = job.salary
    if (max) {
      return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()} / ${period}`
    }
    return `${currency} ${min.toLocaleString()} / ${period}`
  }

  if (loading) {
    return (
      <div className="animate-fadeIn">
        <div className="card">
          <div className="skeleton h-8 w-64 mb-4"></div>
          <div className="skeleton h-4 w-32 mb-6"></div>
          <div className="skeleton h-32 w-full"></div>
        </div>
      </div>
    )
  }

  if (!job) return null

  const isOwner = user && (job.postedBy?._id === user._id || job.postedBy === user._id)
  const isAdmin = user && (user.role === 'admin' || user.role === 'placement')
  const canManage = isOwner || isAdmin

  return (
    <div className="animate-fadeIn">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={20} className="mr-2" />
        Back to opportunities
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="card">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Building2 size={32} className="text-gray-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
                  <p className="text-lg text-gray-600">{job.company}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <span className={`badge ${
                      job.status === 'open' ? 'badge-success' : 'badge-gray'
                    }`}>
                      {job.status}
                    </span>
                    <span className="badge badge-primary">
                      {job.type.charAt(0).toUpperCase() + job.type.slice(1).replace('-', ' ')}
                    </span>
                  </div>
                </div>
              </div>
              {canManage && (
                <div className="flex space-x-2">
                  <Link
                    to={`/internships/${id}/edit`}
                    className="btn btn-secondary btn-sm"
                  >
                    <Edit2 size={16} />
                  </Link>
                  <button
                    onClick={handleDelete}
                    className="btn btn-secondary btn-sm text-red-600 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Description</h2>
            <div className="prose prose-gray max-w-none">
              <p className="whitespace-pre-wrap text-gray-600">{job.description}</p>
            </div>
          </div>

          {/* Requirements */}
          {job.requirements?.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Requirements</h2>
              <ul className="space-y-2">
                {job.requirements.map((req, i) => (
                  <li key={i} className="flex items-start text-gray-600">
                    <CheckCircle size={16} className="mr-2 mt-1 text-green-500 flex-shrink-0" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Skills */}
          {job.skills?.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Required Skills</h2>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill, i) => (
                  <span key={i} className="badge badge-primary">{skill}</span>
                ))}
              </div>
            </div>
          )}

          {/* Eligibility */}
          {job.eligibility && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Eligibility</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {job.eligibility.branches?.length > 0 && (
                  <div>
                    <span className="text-gray-500">Branches:</span>
                    <p className="font-medium">{job.eligibility.branches.join(', ')}</p>
                  </div>
                )}
                {job.eligibility.minBatch && (
                  <div>
                    <span className="text-gray-500">Batch:</span>
                    <p className="font-medium">
                      {job.eligibility.minBatch} - {job.eligibility.maxBatch || 'Present'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Apply Card */}
          <div className="card">
            {user?.role === 'student' && (
              <>
                {hasApplied ? (
                  <div className="text-center py-4">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                    <p className="font-medium text-green-600">Application Submitted</p>
                    <p className="text-sm text-gray-500">You have already applied for this position</p>
                  </div>
                ) : job.status === 'open' ? (
                  <button
                    onClick={handleApply}
                    disabled={applying}
                    className="btn btn-primary w-full"
                  >
                    {applying ? 'Applying...' : 'Apply Now'}
                  </button>
                ) : (
                  <div className="text-center py-4">
                    <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="font-medium text-gray-600">Applications Closed</p>
                  </div>
                )}
              </>
            )}

            {job.applicationLink && (
              <a
                href={job.applicationLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary w-full mt-3"
              >
                <ExternalLink size={16} className="mr-2" />
                Apply on External Site
              </a>
            )}
          </div>

          {/* Job Details */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Details</h2>
            <div className="space-y-4">
              <div className="flex items-center text-gray-600">
                <MapPin size={18} className="mr-3 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium">{job.isRemote ? 'Remote' : job.location || 'Not specified'}</p>
                </div>
              </div>
              <div className="flex items-center text-gray-600">
                <Briefcase size={18} className="mr-3 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Job Type</p>
                  <p className="font-medium">{job.type.charAt(0).toUpperCase() + job.type.slice(1).replace('-', ' ')}</p>
                </div>
              </div>
              <div className="flex items-center text-gray-600">
                <DollarSign size={18} className="mr-3 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Salary</p>
                  <p className="font-medium">{formatSalary()}</p>
                </div>
              </div>
              {job.duration && (
                <div className="flex items-center text-gray-600">
                  <Clock size={18} className="mr-3 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Duration</p>
                    <p className="font-medium">{job.duration}</p>
                  </div>
                </div>
              )}
              {job.applicationDeadline && (
                <div className="flex items-center text-gray-600">
                  <Calendar size={18} className="mr-3 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Application Deadline</p>
                    <p className="font-medium">{format(new Date(job.applicationDeadline), 'PPP')}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center text-gray-600">
                <Users size={18} className="mr-3 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Applications</p>
                  <p className="font-medium">{job.applications?.length || 0} applicants</p>
                </div>
              </div>
            </div>
          </div>

          {/* Posted By */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Posted By</h2>
            <Link
              to={`/user/${job.postedBy?._id}`}
              className="flex items-center space-x-3 hover:bg-gray-50 p-2 rounded-lg -m-2"
            >
              <img
                src={job.postedBy?.profileImage ? `/uploads/profiles/${job.postedBy.profileImage}` : '/default-avatar.png'}
                alt={job.postedBy?.name}
                className="avatar avatar-lg"
                onError={(e) => { e.target.src = '/default-avatar.png' }}
              />
              <div>
                <p className="font-medium text-gray-900">{job.postedBy?.name}</p>
                <p className="text-sm text-gray-500">{job.postedBy?.designation || job.postedBy?.branch}</p>
              </div>
            </Link>
            <p className="text-sm text-gray-500 mt-4">
              Posted {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InternshipDetails
