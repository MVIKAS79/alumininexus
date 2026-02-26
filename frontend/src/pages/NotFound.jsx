import { Link } from 'react-router-dom'
import { Home, ArrowLeft, Search } from 'lucide-react'

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary-500">404</h1>
        <h2 className="text-3xl font-semibold text-gray-900 mt-4">Page Not Found</h2>
        <p className="text-gray-600 mt-2 max-w-md mx-auto">
          Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
          <Link to="/" className="btn btn-primary">
            <Home size={18} className="mr-2" />
            Back to Home
          </Link>
          <Link to="/directory" className="btn btn-secondary">
            <Search size={18} className="mr-2" />
            Browse Directory
          </Link>
        </div>
        <button
          onClick={() => window.history.back()}
          className="mt-6 text-gray-500 hover:text-gray-700 flex items-center justify-center mx-auto"
        >
          <ArrowLeft size={16} className="mr-1" />
          Go back
        </button>
      </div>
    </div>
  )
}

export default NotFound
