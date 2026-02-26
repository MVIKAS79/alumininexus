import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import api from '../services/api'
import toast from 'react-hot-toast'
import {
  User,
  Lock,
  Bell,
  Shield,
  Trash2,
  Save,
  Eye,
  EyeOff,
  LogOut
} from 'lucide-react'

const Settings = () => {
  const { user, logout } = useAuthStore()
  const [activeSection, setActiveSection] = useState('account')
  const [saving, setSaving] = useState(false)

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  const [notifications, setNotifications] = useState({
    emailMessages: true,
    emailConnections: true,
    emailOpportunities: true,
    emailMentorship: true,
    pushMessages: true,
    pushConnections: true
  })

  const [privacy, setPrivacy] = useState({
    showEmail: false,
    showPhone: false,
    profileVisibility: 'public'
  })

  // Load notification and privacy settings from server
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await api.get('/profiles/me')
        const data = response.data.data
        if (data.notifications) {
          setNotifications(prev => ({ ...prev, ...data.notifications }))
        }
        if (data.privacy) {
          setPrivacy(prev => ({ ...prev, ...data.privacy }))
        }
      } catch (error) {
        console.error('Failed to load settings:', error)
      }
    }
    loadSettings()
  }, [])

  const handlePasswordChange = async (e) => {
    e.preventDefault()

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    setSaving(true)
    try {
      await api.put('/auth/update-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })
      toast.success('Password updated successfully')
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update password')
    } finally {
      setSaving(false)
    }
  }

  const handleNotificationSave = async () => {
    setSaving(true)
    try {
      await api.put('/profiles/notifications', notifications)
      toast.success('Notification settings saved')
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handlePrivacySave = async () => {
    setSaving(true)
    try {
      await api.put('/profiles/privacy', privacy)
      toast.success('Privacy settings saved')
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    )
    if (!confirmed) return

    const password = window.prompt('Enter your password to confirm:')
    if (!password) return

    try {
      await api.delete('/profiles', { data: { password } })
      toast.success('Account deleted')
      logout()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete account')
    }
  }

  const sections = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield }
  ]

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account settings</p>
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

        {/* Content */}
        <div className="lg:col-span-3">
          {/* Account Section */}
          {activeSection === 'account' && (
            <div className="space-y-6">
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Account Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="label">Email</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      className="input bg-gray-50"
                      disabled
                    />
                    <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
                  </div>
                  <div>
                    <label className="label">USN</label>
                    <input
                      type="text"
                      value={user?.usn || ''}
                      className="input bg-gray-50"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="label">Account Type</label>
                    <input
                      type="text"
                      value={user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || ''}
                      className="input bg-gray-50"
                      disabled
                    />
                  </div>
                </div>
              </div>

              <div className="card border-red-200">
                <h2 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h2>
                <p className="text-gray-600 mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <button
                  onClick={handleDeleteAccount}
                  className="btn bg-red-600 text-white hover:bg-red-700"
                >
                  <Trash2 size={18} className="mr-2" />
                  Delete Account
                </button>
              </div>
            </div>
          )}

          {/* Security Section */}
          {activeSection === 'security' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Change Password</h2>
              <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                <div>
                  <label className="label">Current Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="input pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="label">New Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="input pr-10"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="label">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="input pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary"
                >
                  {saving ? 'Updating...' : (
                    <>
                      <Save size={18} className="mr-2" />
                      Update Password
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Notifications Section */}
          {activeSection === 'notifications' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Notification Preferences</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Email Notifications</h3>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={notifications.emailMessages}
                        onChange={(e) => setNotifications(prev => ({ ...prev, emailMessages: e.target.checked }))}
                        className="mr-3 w-4 h-4 text-primary-600 rounded"
                      />
                      <span>New messages</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={notifications.emailConnections}
                        onChange={(e) => setNotifications(prev => ({ ...prev, emailConnections: e.target.checked }))}
                        className="mr-3 w-4 h-4 text-primary-600 rounded"
                      />
                      <span>Connection requests</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={notifications.emailOpportunities}
                        onChange={(e) => setNotifications(prev => ({ ...prev, emailOpportunities: e.target.checked }))}
                        className="mr-3 w-4 h-4 text-primary-600 rounded"
                      />
                      <span>New opportunities matching your profile</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={notifications.emailMentorship}
                        onChange={(e) => setNotifications(prev => ({ ...prev, emailMentorship: e.target.checked }))}
                        className="mr-3 w-4 h-4 text-primary-600 rounded"
                      />
                      <span>Mentorship requests and updates</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Push Notifications</h3>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={notifications.pushMessages}
                        onChange={(e) => setNotifications(prev => ({ ...prev, pushMessages: e.target.checked }))}
                        className="mr-3 w-4 h-4 text-primary-600 rounded"
                      />
                      <span>New messages</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={notifications.pushConnections}
                        onChange={(e) => setNotifications(prev => ({ ...prev, pushConnections: e.target.checked }))}
                        className="mr-3 w-4 h-4 text-primary-600 rounded"
                      />
                      <span>Connection requests</span>
                    </label>
                  </div>
                </div>
              </div>

              <button
                onClick={handleNotificationSave}
                disabled={saving}
                className="btn btn-primary mt-6"
              >
                {saving ? 'Saving...' : (
                  <>
                    <Save size={18} className="mr-2" />
                    Save Preferences
                  </>
                )}
              </button>
            </div>
          )}

          {/* Privacy Section */}
          {activeSection === 'privacy' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Privacy Settings</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Profile Visibility</h3>
                  <select
                    value={privacy.profileVisibility}
                    onChange={(e) => setPrivacy(prev => ({ ...prev, profileVisibility: e.target.value }))}
                    className="input w-full md:w-64"
                  >
                    <option value="public">Public - Anyone can view</option>
                    <option value="connections">Connections Only</option>
                    <option value="private">Private - Only you</option>
                  </select>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Contact Information</h3>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={privacy.showEmail}
                        onChange={(e) => setPrivacy(prev => ({ ...prev, showEmail: e.target.checked }))}
                        className="mr-3 w-4 h-4 text-primary-600 rounded"
                      />
                      <span>Show email to other users</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={privacy.showPhone}
                        onChange={(e) => setPrivacy(prev => ({ ...prev, showPhone: e.target.checked }))}
                        className="mr-3 w-4 h-4 text-primary-600 rounded"
                      />
                      <span>Show phone number to connections</span>
                    </label>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePrivacySave}
                disabled={saving}
                className="btn btn-primary mt-6"
              >
                {saving ? 'Saving...' : (
                  <>
                    <Save size={18} className="mr-2" />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Settings
