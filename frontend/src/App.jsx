import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

// Layout
import Layout from './components/layout/Layout'
import AuthLayout from './components/layout/AuthLayout'

// Eager-loaded pages (critical path)
import Landing from './pages/Landing'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Dashboard from './pages/Dashboard'

// Lazy-loaded pages
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'))
const VerifyEmail = lazy(() => import('./pages/auth/VerifyEmail'))
const Profile = lazy(() => import('./pages/Profile'))
const EditProfile = lazy(() => import('./pages/EditProfile'))
const UserProfile = lazy(() => import('./pages/UserProfile'))
const Directory = lazy(() => import('./pages/Directory'))
const Messages = lazy(() => import('./pages/Messages'))
const Conversation = lazy(() => import('./pages/Conversation'))
const Internships = lazy(() => import('./pages/Internships'))
const InternshipDetails = lazy(() => import('./pages/InternshipDetails'))
const PostInternship = lazy(() => import('./pages/PostInternship'))
const Mentorship = lazy(() => import('./pages/Mentorship'))
const Connections = lazy(() => import('./pages/Connections'))
const Analytics = lazy(() => import('./pages/Analytics'))
const Settings = lazy(() => import('./pages/Settings'))
const NotFound = lazy(() => import('./pages/NotFound'))

// Loading fallback
const PageLoader = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600"></div>
  </div>
)

// Protected Route wrapper
const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user, loading } = useAuthStore()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

// Public Route wrapper (redirect if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore()

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
      </Route>

      {/* Protected Routes */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/edit" element={<EditProfile />} />
        <Route path="/user/:id" element={<UserProfile />} />
        <Route path="/directory" element={<Directory />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/messages/:userId" element={<Conversation />} />
        <Route path="/internships" element={<Internships />} />
        <Route path="/internships/:id" element={<InternshipDetails />} />
        <Route path="/internships/new" element={
          <ProtectedRoute roles={['alumni', 'placement', 'admin']}>
            <PostInternship />
          </ProtectedRoute>
        } />
        <Route path="/mentorship" element={<Mentorship />} />
        <Route path="/connections" element={<Connections />} />
        <Route path="/analytics" element={
          <ProtectedRoute roles={['placement', 'admin']}>
            <Analytics />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
    </Suspense>
  )
}

export default App
