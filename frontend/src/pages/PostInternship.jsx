import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  Plus,
  X,
  Save,
  Building2
} from 'lucide-react'

const PostInternship = () => {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    description: '',
    type: 'internship',
    location: '',
    isRemote: false,
    salary: {
      min: '',
      max: '',
      currency: 'INR',
      period: 'month'
    },
    duration: '',
    requirements: [],
    skills: [],
    eligibility: {
      branches: [],
      minBatch: '',
      maxBatch: ''
    },
    applicationDeadline: '',
    applicationLink: ''
  })

  const [newRequirement, setNewRequirement] = useState('')
  const [newSkill, setNewSkill] = useState('')
  const [newBranch, setNewBranch] = useState('')

  const types = ['internship', 'full-time', 'part-time', 'contract', 'freelance']
  const branches = ['CSE', 'ISE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'CHEM', 'BT', 'IEM', 'AIML', 'DS']

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    if (name.includes('.')) {
      const [parent, child] = name.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: type === 'checkbox' ? checked : value }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }))
    }
  }

  const addToArray = (field, value, setter, parentField = null) => {
    if (value.trim()) {
      if (parentField) {
        if (!formData[parentField][field].includes(value.trim())) {
          setFormData(prev => ({
            ...prev,
            [parentField]: {
              ...prev[parentField],
              [field]: [...prev[parentField][field], value.trim()]
            }
          }))
        }
      } else {
        if (!formData[field].includes(value.trim())) {
          setFormData(prev => ({
            ...prev,
            [field]: [...prev[field], value.trim()]
          }))
        }
      }
      setter('')
    }
  }

  const removeFromArray = (field, index, parentField = null) => {
    if (parentField) {
      setFormData(prev => ({
        ...prev,
        [parentField]: {
          ...prev[parentField],
          [field]: prev[parentField][field].filter((_, i) => i !== index)
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index)
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.title || !formData.company || !formData.description) {
      toast.error('Please fill in all required fields')
      return
    }

    setSaving(true)
    try {
      const data = {
        ...formData,
        salary: formData.salary.min ? {
          ...formData.salary,
          min: Number(formData.salary.min),
          max: formData.salary.max ? Number(formData.salary.max) : undefined
        } : undefined
      }

      await api.post('/internships', data)
      toast.success('Opportunity posted successfully!')
      navigate('/internships')
    } catch (error) {
      console.error('Post opportunity error:', error)
      toast.error(error.response?.data?.message || 'Failed to post opportunity')
    } finally {
      setSaving(false)
    }
  }

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

      <div className="max-w-3xl mx-auto">
        <div className="page-header text-center mb-8">
          <h1 className="page-title">Post an Opportunity</h1>
          <p className="page-subtitle">Share internships and job openings with SIT students</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Basic Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="label">Job Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="input"
                  placeholder="e.g., Software Engineer Intern"
                  required
                />
              </div>

              <div>
                <label className="label">Company *</label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="input"
                  placeholder="e.g., Google"
                  required
                />
              </div>

              <div>
                <label className="label">Job Type *</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="input"
                  required
                >
                  {types.map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={6}
                  className="input"
                  placeholder="Describe the role, responsibilities, and what the candidate will learn..."
                  required
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Location & Work Mode</h2>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isRemote"
                  checked={formData.isRemote}
                  onChange={handleChange}
                  className="mr-3 w-5 h-5 text-primary-600 rounded"
                />
                <label className="font-medium">This is a remote position</label>
              </div>

              {!formData.isRemote && (
                <div>
                  <label className="label">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="input"
                    placeholder="e.g., Bangalore, India"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Compensation */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Compensation</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="label">Min Salary</label>
                <input
                  type="number"
                  name="salary.min"
                  value={formData.salary.min}
                  onChange={handleChange}
                  className="input"
                  placeholder="20000"
                />
              </div>
              <div>
                <label className="label">Max Salary</label>
                <input
                  type="number"
                  name="salary.max"
                  value={formData.salary.max}
                  onChange={handleChange}
                  className="input"
                  placeholder="30000"
                />
              </div>
              <div>
                <label className="label">Currency</label>
                <select
                  name="salary.currency"
                  value={formData.salary.currency}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div>
                <label className="label">Period</label>
                <select
                  name="salary.period"
                  value={formData.salary.period}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="month">Per Month</option>
                  <option value="year">Per Year</option>
                  <option value="hour">Per Hour</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="label">Duration (for internships)</label>
              <input
                type="text"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className="input"
                placeholder="e.g., 3 months"
              />
            </div>
          </div>

          {/* Requirements */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Requirements</h2>
            
            <div className="mb-4">
              <label className="label">Job Requirements</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newRequirement}
                  onChange={(e) => setNewRequirement(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('requirements', newRequirement, setNewRequirement))}
                  className="input flex-1"
                  placeholder="Add a requirement..."
                />
                <button
                  type="button"
                  onClick={() => addToArray('requirements', newRequirement, setNewRequirement)}
                  className="btn btn-secondary"
                >
                  <Plus size={18} />
                </button>
              </div>
              {formData.requirements.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {formData.requirements.map((req, i) => (
                    <li key={i} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                      <span className="text-gray-700">{req}</span>
                      <button
                        type="button"
                        onClick={() => removeFromArray('requirements', i)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <label className="label">Required Skills</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('skills', newSkill, setNewSkill))}
                  className="input flex-1"
                  placeholder="Add a skill..."
                />
                <button
                  type="button"
                  onClick={() => addToArray('skills', newSkill, setNewSkill)}
                  className="btn btn-secondary"
                >
                  <Plus size={18} />
                </button>
              </div>
              {formData.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.skills.map((skill, i) => (
                    <span key={i} className="badge badge-primary flex items-center">
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeFromArray('skills', i)}
                        className="ml-1"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Eligibility */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Eligibility Criteria</h2>
            
            <div className="space-y-4">
              <div>
                <label className="label">Eligible Branches</label>
                <div className="flex space-x-2 mb-2">
                  <select
                    value={newBranch}
                    onChange={(e) => setNewBranch(e.target.value)}
                    className="input flex-1"
                  >
                    <option value="">Select branch</option>
                    {branches.filter(b => !formData.eligibility.branches.includes(b)).map(branch => (
                      <option key={branch} value={branch}>{branch}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => addToArray('branches', newBranch, setNewBranch, 'eligibility')}
                    className="btn btn-secondary"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                {formData.eligibility.branches.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.eligibility.branches.map((branch, i) => (
                      <span key={i} className="badge badge-secondary flex items-center">
                        {branch}
                        <button
                          type="button"
                          onClick={() => removeFromArray('branches', i, 'eligibility')}
                          className="ml-1"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Min Batch Year</label>
                  <input
                    type="number"
                    name="eligibility.minBatch"
                    value={formData.eligibility.minBatch}
                    onChange={handleChange}
                    className="input"
                    placeholder="e.g., 2022"
                  />
                </div>
                <div>
                  <label className="label">Max Batch Year</label>
                  <input
                    type="number"
                    name="eligibility.maxBatch"
                    value={formData.eligibility.maxBatch}
                    onChange={handleChange}
                    className="input"
                    placeholder="e.g., 2025"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Application */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Application Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="label">Application Deadline</label>
                <input
                  type="date"
                  name="applicationDeadline"
                  value={formData.applicationDeadline}
                  onChange={handleChange}
                  className="input"
                />
              </div>
              <div>
                <label className="label">External Application Link (optional)</label>
                <input
                  type="url"
                  name="applicationLink"
                  value={formData.applicationLink}
                  onChange={handleChange}
                  className="input"
                  placeholder="https://..."
                />
                <p className="text-sm text-gray-500 mt-1">
                  If provided, candidates can also apply through this external link
                </p>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/internships')}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
            >
              {saving ? (
                <>
                  <span className="spinner mr-2"></span>
                  Posting...
                </>
              ) : (
                <>
                  <Save size={18} className="mr-2" />
                  Post Opportunity
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PostInternship
