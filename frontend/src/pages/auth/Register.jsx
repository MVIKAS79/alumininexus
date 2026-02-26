import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

const Register = () => {
  const [searchParams] = useSearchParams()
  const initialRole = searchParams.get('role') === 'alumni' ? 'alumni' : 'student'

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: initialRole,
    branch: '',
    batchStart: '',
    batchEnd: '',
    usn: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const { register } = useAuthStore()
  const navigate = useNavigate()

  const branches = [
    'CSE', 'ISE', 'ECE', 'EEE', 'MECH', 'CIVIL', 
    'CHEM', 'BT', 'IEM', 'AIML', 'DS', 'Other'
  ]

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 1963 + 5 }, (_, i) => 1963 + i)

  useEffect(() => {
    // Auto-calculate batch end for students (usually 4 years after start)
    if (formData.batchStart && formData.role === 'student') {
      setFormData(prev => ({
        ...prev,
        batchEnd: String(parseInt(prev.batchStart) + 4)
      }))
    }
  }, [formData.batchStart, formData.role])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email address'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    } else if (!/\d/.test(formData.password)) {
      newErrors.password = 'Password must contain a number'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (!formData.branch) {
      newErrors.branch = 'Branch is required'
    }

    if (!formData.batchStart) {
      newErrors.batchStart = 'Batch start year is required'
    }

    if (!formData.batchEnd) {
      newErrors.batchEnd = 'Batch end year is required'
    } else if (parseInt(formData.batchEnd) < parseInt(formData.batchStart)) {
      newErrors.batchEnd = 'End year must be after start year'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const { confirmPassword, ...registerData } = formData
      await register({
        ...registerData,
        batchStart: parseInt(registerData.batchStart),
        batchEnd: parseInt(registerData.batchEnd)
      })
      toast.success('Account created! Please check your email to verify before logging in.')
      navigate('/login')
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed'
      toast.error(message)
      if (message.includes('email')) {
        setErrors({ email: 'This email is already registered' })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fadeIn">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
        <p className="text-gray-600 mt-2">Join the SIT Connect network</p>
      </div>

      {/* Role Toggle */}
      <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
        <button
          type="button"
          onClick={() => setFormData(prev => ({ ...prev, role: 'student' }))}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
            formData.role === 'student'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          I'm a Student
        </button>
        <button
          type="button"
          onClick={() => setFormData(prev => ({ ...prev, role: 'alumni' }))}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
            formData.role === 'alumni'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          I'm an Alumni
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="label">Full Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`input ${errors.name ? 'input-error' : ''}`}
            placeholder="Enter your full name"
          />
          {errors.name && <p className="error-text">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="email" className="label">Email Address</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`input ${errors.email ? 'input-error' : ''}`}
            placeholder="your.email@example.com"
          />
          {errors.email && <p className="error-text">{errors.email}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="password" className="label">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                placeholder="Create password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="error-text">{errors.password}</p>}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="label">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`input ${errors.confirmPassword ? 'input-error' : ''}`}
              placeholder="Confirm password"
            />
            {errors.confirmPassword && <p className="error-text">{errors.confirmPassword}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="branch" className="label">Branch</label>
          <select
            id="branch"
            name="branch"
            value={formData.branch}
            onChange={handleChange}
            className={`input ${errors.branch ? 'input-error' : ''}`}
          >
            <option value="">Select your branch</option>
            {branches.map(branch => (
              <option key={branch} value={branch}>{branch}</option>
            ))}
          </select>
          {errors.branch && <p className="error-text">{errors.branch}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="batchStart" className="label">Batch Start</label>
            <select
              id="batchStart"
              name="batchStart"
              value={formData.batchStart}
              onChange={handleChange}
              className={`input ${errors.batchStart ? 'input-error' : ''}`}
            >
              <option value="">Select year</option>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            {errors.batchStart && <p className="error-text">{errors.batchStart}</p>}
          </div>

          <div>
            <label htmlFor="batchEnd" className="label">Batch End</label>
            <select
              id="batchEnd"
              name="batchEnd"
              value={formData.batchEnd}
              onChange={handleChange}
              className={`input ${errors.batchEnd ? 'input-error' : ''}`}
            >
              <option value="">Select year</option>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            {errors.batchEnd && <p className="error-text">{errors.batchEnd}</p>}
          </div>
        </div>

        {formData.role === 'student' && (
          <div>
            <label htmlFor="usn" className="label">USN (Optional)</label>
            <input
              type="text"
              id="usn"
              name="usn"
              value={formData.usn}
              onChange={handleChange}
              className="input"
              placeholder="e.g., 1SI20CS001"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full btn-lg mt-6"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin mr-2" size={20} />
              Creating account...
            </>
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      <p className="text-center mt-6 text-gray-600">
        Already have an account?{' '}
        <Link to="/login" className="text-primary-600 font-medium hover:text-primary-700">
          Sign in
        </Link>
      </p>
    </div>
  )
}

export default Register
