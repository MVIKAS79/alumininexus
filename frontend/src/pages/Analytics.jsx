import { useState, useEffect } from 'react'
import api from '../services/api'
import {
  Users,
  Briefcase,
  TrendingUp,
  Building2,
  GraduationCap,
  Download,
  Calendar,
  ChevronDown,
  RefreshCw
} from 'lucide-react'

const Analytics = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('all')
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const response = await api.get(`/analytics/dashboard?range=${dateRange}`)
      setStats(response.data.data)
    } catch (error) {
      console.error('Fetch analytics error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (type) => {
    setExporting(true)
    try {
      const response = await api.get(`/analytics/export?type=${type}&range=${dateRange}`, {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `sit-connect-${type}-${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Export error:', error)
    } finally {
      setExporting(false)
    }
  }

  const colorMap = {
    primary: { bg: 'bg-primary-100', text: 'text-primary-600' },
    secondary: { bg: 'bg-secondary-100', text: 'text-secondary-600' },
    green: { bg: 'bg-green-100', text: 'text-green-600' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-600' },
  }

  const StatCard = ({ icon: Icon, label, value, subtext, color = 'primary' }) => {
    const colors = colorMap[color] || colorMap.primary
    return (
      <div className="card">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
            {subtext && <p className="text-sm text-gray-500 mt-1">{subtext}</p>}
          </div>
          <div className={`p-3 ${colors.bg} rounded-lg`}>
            <Icon className={colors.text} size={24} />
          </div>
        </div>
      </div>
    )
  }

  if (loading && !stats) {
    return (
      <div className="animate-fadeIn">
        <div className="page-header">
          <h1 className="page-title">Analytics Dashboard</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card">
              <div className="skeleton h-24 w-full"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Analytics Dashboard</h1>
          <p className="page-subtitle">Insights and statistics for SIT Connect</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="input w-auto"
          >
            <option value="all">All Time</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <button
            onClick={() => fetchAnalytics()}
            className="btn btn-secondary"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Users}
          label="Total Users"
          value={stats?.totalUsers || 0}
          subtext={`${stats?.newUsersThisMonth || 0} new this month`}
          color="primary"
        />
        <StatCard
          icon={GraduationCap}
          label="Students"
          value={stats?.students || 0}
          color="secondary"
        />
        <StatCard
          icon={Building2}
          label="Alumni"
          value={stats?.alumni || 0}
          subtext={`${stats?.verifiedAlumni || 0} verified`}
          color="green"
        />
        <StatCard
          icon={Briefcase}
          label="Opportunities"
          value={stats?.totalOpportunities || 0}
          subtext={`${stats?.activeOpportunities || 0} active`}
          color="orange"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Users by Branch */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Users by Branch</h2>
          <div className="space-y-3">
            {stats?.usersByBranch?.slice(0, 8).map((branch, i) => (
              <div key={i}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">{branch._id || 'Unknown'}</span>
                  <span className="font-medium">{branch.count}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full"
                    style={{
                      width: `${(branch.count / (stats?.totalUsers || 1)) * 100}%`
                    }}
                  />
                </div>
              </div>
            )) || (
              <p className="text-gray-500">No data available</p>
            )}
          </div>
        </div>

        {/* Users by Batch */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Users by Graduation Year</h2>
          <div className="space-y-3">
            {stats?.usersByBatch?.slice(0, 8).map((batch, i) => (
              <div key={i}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">Class of {batch._id || 'Unknown'}</span>
                  <span className="font-medium">{batch.count}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-secondary-500 rounded-full"
                    style={{
                      width: `${(batch.count / (stats?.totalUsers || 1)) * 100}%`
                    }}
                  />
                </div>
              </div>
            )) || (
              <p className="text-gray-500">No data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Engagement</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Messages Sent</span>
              <span className="font-semibold">{stats?.totalMessages || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Connections Made</span>
              <span className="font-semibold">{stats?.totalConnections || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Mentorship Requests</span>
              <span className="font-semibold">{stats?.mentorshipRequests || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Active Mentorships</span>
              <span className="font-semibold">{stats?.activeMentorships || 0}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Opportunities</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Internships</span>
              <span className="font-semibold">{stats?.internships || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Full-time Jobs</span>
              <span className="font-semibold">{stats?.fullTimeJobs || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Applications</span>
              <span className="font-semibold">{stats?.totalApplications || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Avg. Applications/Job</span>
              <span className="font-semibold">{stats?.avgApplicationsPerJob?.toFixed(1) || '0'}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Companies</h2>
          <div className="space-y-3">
            {stats?.topCompanies?.slice(0, 5).map((company, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-gray-600">{company._id || 'Unknown'}</span>
                <span className="badge badge-gray">{company.count} alumni</span>
              </div>
            )) || (
              <p className="text-gray-500">No data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Export Section */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Export Data</h2>
        <p className="text-gray-600 mb-4">
          Download data for offline analysis and reporting
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleExport('users')}
            disabled={exporting}
            className="btn btn-secondary"
          >
            <Download size={18} className="mr-2" />
            Export Users
          </button>
          <button
            onClick={() => handleExport('alumni')}
            disabled={exporting}
            className="btn btn-secondary"
          >
            <Download size={18} className="mr-2" />
            Export Alumni
          </button>
          <button
            onClick={() => handleExport('opportunities')}
            disabled={exporting}
            className="btn btn-secondary"
          >
            <Download size={18} className="mr-2" />
            Export Opportunities
          </button>
          <button
            onClick={() => handleExport('placements')}
            disabled={exporting}
            className="btn btn-secondary"
          >
            <Download size={18} className="mr-2" />
            Export Placements
          </button>
        </div>
      </div>
    </div>
  )
}

export default Analytics
