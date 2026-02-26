import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useSocketStore } from '../../services/socket'
import api from '../../services/api'
import BackToTop from '../BackToTop'
import {
  Home,
  Users,
  MessageSquare,
  Briefcase,
  GraduationCap,
  UserPlus,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search
} from 'lucide-react'

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [globalSearch, setGlobalSearch] = useState('')
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const { user, logout, token } = useAuthStore()
  const { connect, disconnect, isConnected } = useSocketStore()
  const navigate = useNavigate()

  // Connect to socket on mount
  useEffect(() => {
    if (token) {
      connect(token)
    }
    return () => {
      disconnect()
    }
  }, [token])

  // Fetch unread message count
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await api.get('/messages/unread')
        setUnreadCount(res.data.data?.unreadCount || 0)
      } catch (err) {
        // silently fail
      }
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 30000) // refresh every 30s
    return () => clearInterval(interval)
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const handleGlobalSearch = (e) => {
    if (e.key === 'Enter' && globalSearch.trim()) {
      navigate(`/directory?search=${encodeURIComponent(globalSearch.trim())}`)
      setGlobalSearch('')
      setMobileSearchOpen(false)
    }
  }

  const navLinks = [
    { to: '/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/directory', icon: Users, label: 'Alumni Directory' },
    { to: '/messages', icon: MessageSquare, label: 'Messages' },
    { to: '/internships', icon: Briefcase, label: 'Opportunities' },
    { to: '/mentorship', icon: GraduationCap, label: 'Mentorship' },
    { to: '/connections', icon: UserPlus, label: 'Connections' },
  ]

  // Add analytics for placement/admin
  if (user?.role === 'placement' || user?.role === 'admin') {
    navLinks.push({ to: '/analytics', icon: BarChart3, label: 'Analytics' })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
          <NavLink to="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="font-bold text-xl text-gradient">SIT Connect</span>
          </NavLink>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navLinks.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
          <NavLink
            to="/profile"
            className="flex items-center space-x-3 mb-3 hover:bg-gray-50 p-2 rounded-lg transition-colors"
          >
            <img
              src={user?.profileImage ? `/uploads/profiles/${user.profileImage}` : '/default-avatar.png'}
              alt={user?.name}
              className="avatar avatar-md"
              onError={(e) => { e.target.src = '/default-avatar.png' }}
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
            </div>
          </NavLink>
          <div className="flex space-x-2">
            <NavLink
              to="/settings"
              className="flex-1 btn btn-secondary btn-sm"
            >
              <Settings size={16} className="mr-2" />
              Settings
            </NavLink>
            <button
              onClick={handleLogout}
              className="btn btn-secondary btn-sm text-red-600 hover:bg-red-50"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <Menu size={20} />
            </button>
            
            {/* Search */}
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                onKeyDown={handleGlobalSearch}
                placeholder="Search alumni, companies... (Enter)"
                className="pl-10 pr-4 py-2 w-64 lg:w-80 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Connection status indicator */}
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-300'}`} />
            
            {/* Notifications */}
            <button
              onClick={() => navigate('/messages')}
              className="relative p-2 rounded-lg hover:bg-gray-100"
              title="Messages"
            >
              <Bell size={20} className="text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Mobile search */}
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="sm:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <Search size={20} className="text-gray-600" />
            </button>
          </div>
        </header>

        {/* Mobile search bar */}
        {mobileSearchOpen && (
          <div className="sm:hidden px-4 py-2 bg-white border-b border-gray-200 animate-slideUp">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                onKeyDown={handleGlobalSearch}
                placeholder="Search alumni, companies..."
                className="input pl-10"
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Page content */}
        <main className="p-4 lg:p-6 min-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>
        <BackToTop />
      </div>
    </div>
  )
}

export default Layout
