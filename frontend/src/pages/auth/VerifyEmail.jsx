import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../services/api'
import { CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react'

const VerifyEmail = () => {
  const { token } = useParams()
  const [status, setStatus] = useState('loading') // loading, success, error
  const [message, setMessage] = useState('')
  const [resendEmail, setResendEmail] = useState('')
  const [resending, setResending] = useState(false)
  const [resendMsg, setResendMsg] = useState('')

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await api.get(`/auth/verify-email/${token}`)
        setStatus('success')
        setMessage(response.data.message)
      } catch (error) {
        setStatus('error')
        setMessage(error.response?.data?.message || 'Verification failed')
      }
    }

    if (token) {
      verifyEmail()
    }
  }, [token])

  const handleResend = async () => {
    if (!resendEmail.trim()) return
    setResending(true)
    setResendMsg('')
    try {
      const res = await api.post('/auth/resend-verification', { email: resendEmail })
      setResendMsg(res.data.message)
    } catch (err) {
      setResendMsg(err.response?.data?.message || 'Failed to resend')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="text-center animate-fadeIn">
      {status === 'loading' && (
        <>
          <Loader2 className="w-16 h-16 text-primary-600 animate-spin mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Verifying Email...</h1>
          <p className="text-gray-600">Please wait while we verify your email address.</p>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-green-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Email Verified!</h1>
          <p className="text-gray-600 mb-6">{message}</p>
          <Link to="/login" className="btn btn-primary">
            Continue to Login
          </Link>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
            <XCircle className="text-red-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Verification Failed</h1>
          <p className="text-gray-600 mb-6">{message}</p>

          {/* Resend verification section */}
          <div className="max-w-sm mx-auto mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700 mb-3">Need a new verification link?</p>
            <div className="flex space-x-2">
              <input
                type="email"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                placeholder="Enter your email"
                className="input text-sm flex-1"
              />
              <button
                onClick={handleResend}
                disabled={resending || !resendEmail.trim()}
                className="btn btn-primary btn-sm whitespace-nowrap"
              >
                {resending ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} className="mr-1" />}
                Resend
              </button>
            </div>
            {resendMsg && <p className="text-sm text-green-600 mt-2">{resendMsg}</p>}
          </div>

          <Link to="/login" className="btn btn-secondary">
            Return to Login
          </Link>
        </>
      )}
    </div>
  )
}

export default VerifyEmail
