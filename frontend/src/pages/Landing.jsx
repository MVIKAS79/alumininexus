import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { 
  Users, 
  MessageSquare, 
  Briefcase, 
  GraduationCap, 
  ArrowRight,
  CheckCircle,
  Star,
  Menu,
  X
} from 'lucide-react'

// Animated counter hook
function useCounter(end, duration = 2000) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const triggered = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !triggered.current) {
          triggered.current = true
          const num = parseInt(end.replace(/[^0-9]/g, ''))
          const startTime = performance.now()
          const animate = (now) => {
            const elapsed = now - startTime
            const progress = Math.min(elapsed / duration, 1)
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3)
            setCount(Math.floor(eased * num))
            if (progress < 1) requestAnimationFrame(animate)
          }
          requestAnimationFrame(animate)
        }
      },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [end, duration])

  const suffix = end.includes('+') ? '+' : ''
  return { ref, display: count.toLocaleString() + suffix }
}

// Animated counter component
function StatCounter({ value, label }) {
  const counter = useCounter(value)
  return (
    <div className="text-center text-white" ref={counter.ref}>
      <div className="text-3xl md:text-4xl font-bold mb-1">{counter.display}</div>
      <div className="text-white/70">{label}</div>
    </div>
  )
}

const Landing = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const features = [
    {
      icon: Users,
      title: 'Alumni Directory',
      description: 'Search and connect with alumni by batch, branch, or company'
    },
    {
      icon: MessageSquare,
      title: 'Real-time Chat',
      description: 'Message alumni directly and get instant responses'
    },
    {
      icon: Briefcase,
      title: 'Opportunities',
      description: 'Access internships, jobs, and referrals from alumni'
    },
    {
      icon: GraduationCap,
      title: 'Mentorship',
      description: 'Get career guidance from experienced professionals'
    }
  ]

  const stats = [
    { value: '10,000+', label: 'Alumni' },
    { value: '500+', label: 'Companies' },
    { value: '1,000+', label: 'Opportunities' },
    { value: '2,000+', label: 'Mentorships' }
  ]

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
                <span className="text-white font-bold">S</span>
              </div>
              <span className="font-bold text-xl text-gradient">SIT Connect</span>
            </Link>
            {/* Desktop nav */}
            <div className="hidden sm:flex items-center space-x-4">
              <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary">
                Get Started
              </Link>
            </div>
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
          {/* Mobile menu dropdown */}
          {mobileMenuOpen && (
            <div className="sm:hidden pb-4 animate-slideUp">
              <div className="flex flex-col space-y-2">
                <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-lg hover:bg-gray-50">
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary mx-4">
                  Get Started
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 gradient-bg relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center text-white">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Connect with Your
              <br />
              <span className="text-yellow-300">SIT Alumni Network</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-3xl mx-auto">
              Build your career with guidance from successful alumni. 
              Get mentorship, internships, and job referrals from the SIT family.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register" className="btn bg-white text-primary-600 hover:bg-gray-100 btn-lg">
                Join as Student
                <ArrowRight className="ml-2" size={20} />
              </Link>
              <Link to="/register?role=alumni" className="btn border-2 border-white text-white hover:bg-white/10 btn-lg">
                Join as Alumni
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <StatCounter key={index} value={stat.value} label={stat.label} />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              A comprehensive platform designed to connect students with alumni 
              for career growth and professional development.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card-hover text-center">
                <div className="w-14 h-14 rounded-xl gradient-bg flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="text-white" size={24} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Why Join SIT Connect?
              </h2>
              <div className="space-y-4">
                {[
                  'Connect with alumni from 60+ years of SIT history',
                  'Get personalized career advice and mentorship',
                  'Access exclusive job and internship opportunities',
                  'Build a strong professional network',
                  'Real-time messaging with industry professionals',
                  'Track alumni across top companies worldwide'
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={20} />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
              <Link to="/register" className="btn btn-primary btn-lg mt-8">
                Get Started Free
                <ArrowRight className="ml-2" size={20} />
              </Link>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-primary-100 to-secondary-100 rounded-2xl p-8">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 rounded-full gradient-bg"></div>
                    <div>
                      <div className="font-semibold">Raj Kumar</div>
                      <div className="text-sm text-gray-500">Software Engineer @ Google</div>
                    </div>
                  </div>
                  <div className="flex mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="text-yellow-400" size={16} fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-gray-600 text-sm">
                    "SIT Connect helped me prepare for my interviews and land my dream job. 
                    The mentorship I received was invaluable!"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-bg">
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Connect with Your Alumni Network?
          </h2>
          <p className="text-xl text-white/80 mb-8">
            Join thousands of SIT students and alumni building their careers together.
          </p>
          <Link to="/register" className="btn bg-white text-primary-600 hover:bg-gray-100 btn-lg">
            Create Your Account
            <ArrowRight className="ml-2" size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <span className="font-bold">S</span>
              </div>
              <span className="font-bold text-xl">SIT Connect</span>
            </div>
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Siddaganga Institute of Technology. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing
