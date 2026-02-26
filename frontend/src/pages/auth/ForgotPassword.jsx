import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import { Loader2, ArrowLeft, Mail } from 'lucide-react'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const { forgotPassword } = useAuthStore()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) {
      toast.error('Please enter your email')
      return
    }

    setLoading(true)
    try {
      await forgotPassword(email)
      setSent(true)
      toast.success('Password reset email sent!')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send email')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="text-center animate-fadeIn">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <Mail className="text-green-600" size={32} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Check Your Email</h1>
        <p className="text-gray-600 mb-6">
          We've sent a password reset link to <strong>{email}</strong>
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Didn't receive the email? Check your spam folder or
          <button
            onClick={() => setSent(false)}
            className="text-primary-600 hover:text-primary-700 ml-1"
          >
            try again
          </button>
        </p>
        <Link to="/login" className="btn btn-primary">
          Return to Login
        </Link>
      </div>
    )
  }

  return (
    <div className="animate-fadeIn">
      <Link to="/login" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft size={16} className="mr-1" />
        Back to login
      </Link>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Forgot Password?</h1>
        <p className="text-gray-600 mt-2">
          Enter your email and we'll send you a reset link
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="label">Email Address</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="your.email@example.com"
            autoFocus
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full btn-lg"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin mr-2" size={20} />
              Sending...
            </>
          ) : (
            'Send Reset Link'
          )}
        </button>
      </form>
    </div>
  )
}

export default ForgotPassword
