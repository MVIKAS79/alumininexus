import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../services/api'
import toast from 'react-hot-toast'
import {
  User,
  Building2,
  MapPin,
  GraduationCap,
  Briefcase,
  Plus,
  Trash2,
  Save,
  X,
  Camera
} from 'lucide-react'

const EditProfile = () => {
  const navigate = useNavigate()
  const { user, updateUser } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState('basic')
  const [profileImage, setProfileImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    phone: '',
    designation: '',
    company: '',
    location: { city: '', state: '', country: 'India' },
    skills: [],
    interests: [],
    linkedin: '',
    github: '',
    website: '',
    openToMentor: false,
    mentorshipAreas: [],
    workExperience: [],
    education: []
  })

  const [newSkill, setNewSkill] = useState('')
  const [newInterest, setNewInterest] = useState('')
  const [newMentorArea, setNewMentorArea] = useState('')

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await api.get('/profiles/me')
      const profile = response.data.data
      setFormData({
        name: profile.name || '',
        bio: profile.bio || '',
        phone: profile.phone || '',
        designation: profile.designation || '',
        company: profile.company || '',
        location: profile.location || { city: '', state: '', country: 'India' },
        skills: profile.skills || [],
        interests: profile.interests || [],
        linkedin: profile.linkedin || '',
        github: profile.github || '',
        website: profile.website || '',
        openToMentor: profile.openToMentor || false,
        mentorshipAreas: profile.mentorshipAreas || [],
        workExperience: profile.workExperience || [],
        education: profile.education || []
      })
      if (profile.profileImage) {
        setImagePreview(`/uploads/profiles/${profile.profileImage}`)
      }
    } catch (error) {
      console.error('Fetch profile error:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    if (name.includes('.')) {
      const [parent, child] = name.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }))
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB')
        return
      }
      setProfileImage(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const addToArray = (field, value, setter) => {
    if (value.trim() && !formData[field].includes(value.trim())) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }))
      setter('')
    }
  }

  const removeFromArray = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  const addWorkExperience = () => {
    setFormData(prev => ({
      ...prev,
      workExperience: [...prev.workExperience, {
        title: '',
        company: '',
        location: '',
        startDate: '',
        endDate: '',
        current: false,
        description: ''
      }]
    }))
  }

  const updateWorkExperience = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      workExperience: prev.workExperience.map((exp, i) => 
        i === index ? { ...exp, [field]: value } : exp
      )
    }))
  }

  const removeWorkExperience = (index) => {
    setFormData(prev => ({
      ...prev,
      workExperience: prev.workExperience.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Upload image first if changed
      if (profileImage) {
        const imageFormData = new FormData()
        imageFormData.append('profileImage', profileImage)
        await api.put('/profile/image', imageFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }

      // Update profile
      const response = await api.put('/profile', formData)
      setUser({ ...user, ...response.data.data })
      toast.success('Profile updated successfully')
      navigate('/profile')
    } catch (error) {
      console.error('Update profile error:', error)
      toast.error(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const sections = [
    { id: 'basic', label: 'Basic Info', icon: User },
    { id: 'professional', label: 'Professional', icon: Building2 },
    { id: 'skills', label: 'Skills & Interests', icon: GraduationCap },
    { id: 'experience', label: 'Experience', icon: Briefcase },
    { id: 'mentorship', label: 'Mentorship', icon: User }
  ]

  if (loading) {
    return (
      <div className="animate-fadeIn">
        <div className="card">
          <div className="skeleton h-8 w-48 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton h-12 w-full"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1 className="page-title">Edit Profile</h1>
        <p className="page-subtitle">Update your profile information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="card sticky top-6">
            <nav className="space-y-1">
              {sections.map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
                    activeSection === section.id
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <section.icon size={18} className="mr-3" />
                  {section.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Form */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSubmit}>
            {/* Basic Info */}
            {activeSection === 'basic' && (
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Basic Information</h2>
                
                {/* Profile Image */}
                <div className="mb-6">
                  <label className="label">Profile Photo</label>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <img
                        src={imagePreview || '/default-avatar.png'}
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover"
                        onError={(e) => { e.target.src = '/default-avatar.png' }}
                      />
                      <label className="absolute bottom-0 right-0 p-2 bg-primary-500 text-white rounded-full cursor-pointer hover:bg-primary-600">
                        <Camera size={16} />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <div className="text-sm text-gray-500">
                      <p>JPG, PNG or GIF</p>
                      <p>Max 5MB</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="input"
                      placeholder="+91 9876543210"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="label">Bio</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={4}
                    className="input"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="label">City</label>
                    <input
                      type="text"
                      name="location.city"
                      value={formData.location.city}
                      onChange={handleChange}
                      className="input"
                      placeholder="Bangalore"
                    />
                  </div>
                  <div>
                    <label className="label">State</label>
                    <input
                      type="text"
                      name="location.state"
                      value={formData.location.state}
                      onChange={handleChange}
                      className="input"
                      placeholder="Karnataka"
                    />
                  </div>
                  <div>
                    <label className="label">Country</label>
                    <input
                      type="text"
                      name="location.country"
                      value={formData.location.country}
                      onChange={handleChange}
                      className="input"
                      placeholder="India"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="label">LinkedIn</label>
                    <input
                      type="url"
                      name="linkedin"
                      value={formData.linkedin}
                      onChange={handleChange}
                      className="input"
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>
                  <div>
                    <label className="label">GitHub</label>
                    <input
                      type="url"
                      name="github"
                      value={formData.github}
                      onChange={handleChange}
                      className="input"
                      placeholder="https://github.com/..."
                    />
                  </div>
                  <div>
                    <label className="label">Website</label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      className="input"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Professional Info */}
            {activeSection === 'professional' && (
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Professional Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Designation</label>
                    <input
                      type="text"
                      name="designation"
                      value={formData.designation}
                      onChange={handleChange}
                      className="input"
                      placeholder="Software Engineer"
                    />
                  </div>
                  <div>
                    <label className="label">Company</label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      className="input"
                      placeholder="Google"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Skills & Interests */}
            {activeSection === 'skills' && (
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Skills & Interests</h2>
                
                {/* Skills */}
                <div className="mb-6">
                  <label className="label">Skills</label>
                  <div className="flex space-x-2 mb-2">
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
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill, i) => (
                      <span
                        key={i}
                        className="badge badge-primary flex items-center"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeFromArray('skills', i)}
                          className="ml-1 hover:text-primary-800"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Interests */}
                <div>
                  <label className="label">Interests</label>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={newInterest}
                      onChange={(e) => setNewInterest(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('interests', newInterest, setNewInterest))}
                      className="input flex-1"
                      placeholder="Add an interest..."
                    />
                    <button
                      type="button"
                      onClick={() => addToArray('interests', newInterest, setNewInterest)}
                      className="btn btn-secondary"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.interests.map((interest, i) => (
                      <span
                        key={i}
                        className="badge badge-secondary flex items-center"
                      >
                        {interest}
                        <button
                          type="button"
                          onClick={() => removeFromArray('interests', i)}
                          className="ml-1 hover:text-secondary-800"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Work Experience */}
            {activeSection === 'experience' && (
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Work Experience</h2>
                  <button
                    type="button"
                    onClick={addWorkExperience}
                    className="btn btn-secondary btn-sm"
                  >
                    <Plus size={16} className="mr-1" />
                    Add
                  </button>
                </div>

                {formData.workExperience.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Briefcase className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No work experience added</p>
                    <button
                      type="button"
                      onClick={addWorkExperience}
                      className="btn btn-primary mt-4"
                    >
                      Add Experience
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {formData.workExperience.map((exp, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex justify-between mb-4">
                          <h3 className="font-medium">Experience {index + 1}</h3>
                          <button
                            type="button"
                            onClick={() => removeWorkExperience(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="label">Job Title</label>
                            <input
                              type="text"
                              value={exp.title}
                              onChange={(e) => updateWorkExperience(index, 'title', e.target.value)}
                              className="input"
                              placeholder="Software Engineer"
                            />
                          </div>
                          <div>
                            <label className="label">Company</label>
                            <input
                              type="text"
                              value={exp.company}
                              onChange={(e) => updateWorkExperience(index, 'company', e.target.value)}
                              className="input"
                              placeholder="Google"
                            />
                          </div>
                          <div>
                            <label className="label">Location</label>
                            <input
                              type="text"
                              value={exp.location}
                              onChange={(e) => updateWorkExperience(index, 'location', e.target.value)}
                              className="input"
                              placeholder="Bangalore, India"
                            />
                          </div>
                          <div>
                            <label className="label">Start Date</label>
                            <input
                              type="month"
                              value={exp.startDate}
                              onChange={(e) => updateWorkExperience(index, 'startDate', e.target.value)}
                              className="input"
                            />
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="flex-1">
                              <label className="label">End Date</label>
                              <input
                                type="month"
                                value={exp.endDate}
                                onChange={(e) => updateWorkExperience(index, 'endDate', e.target.value)}
                                className="input"
                                disabled={exp.current}
                              />
                            </div>
                            <div className="pt-6">
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={exp.current}
                                  onChange={(e) => updateWorkExperience(index, 'current', e.target.checked)}
                                  className="mr-2"
                                />
                                <span className="text-sm">Current</span>
                              </label>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4">
                          <label className="label">Description</label>
                          <textarea
                            value={exp.description}
                            onChange={(e) => updateWorkExperience(index, 'description', e.target.value)}
                            rows={3}
                            className="input"
                            placeholder="Describe your role and responsibilities..."
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Mentorship (Alumni only) */}
            {activeSection === 'mentorship' && user.role === 'alumni' && (
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Mentorship Settings</h2>
                
                <div className="mb-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="openToMentor"
                      checked={formData.openToMentor}
                      onChange={handleChange}
                      className="mr-3 w-5 h-5 text-primary-600 rounded"
                    />
                    <div>
                      <span className="font-medium">I'm open to mentoring students</span>
                      <p className="text-sm text-gray-500">Students will be able to send you mentorship requests</p>
                    </div>
                  </label>
                </div>

                {formData.openToMentor && (
                  <div>
                    <label className="label">Areas of Mentorship</label>
                    <div className="flex space-x-2 mb-2">
                      <input
                        type="text"
                        value={newMentorArea}
                        onChange={(e) => setNewMentorArea(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('mentorshipAreas', newMentorArea, setNewMentorArea))}
                        className="input flex-1"
                        placeholder="e.g., Career Guidance, Technical Skills..."
                      />
                      <button
                        type="button"
                        onClick={() => addToArray('mentorshipAreas', newMentorArea, setNewMentorArea)}
                        className="btn btn-secondary"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.mentorshipAreas.map((area, i) => (
                        <span
                          key={i}
                          className="badge badge-primary flex items-center"
                        >
                          {area}
                          <button
                            type="button"
                            onClick={() => removeFromArray('mentorshipAreas', i)}
                            className="ml-1 hover:text-primary-800"
                          >
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeSection === 'mentorship' && user.role !== 'alumni' && (
              <div className="card text-center py-12">
                <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Mentorship for Alumni</h3>
                <p className="text-gray-500">This section is only available for alumni members.</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 mt-6">
              <button
                type="button"
                onClick={() => navigate('/profile')}
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
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} className="mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default EditProfile
