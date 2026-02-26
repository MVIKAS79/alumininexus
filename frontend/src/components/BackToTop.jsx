import { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'

const BackToTop = () => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full gradient-bg text-white shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-110 animate-fadeIn"
      aria-label="Back to top"
    >
      <ArrowUp size={20} />
    </button>
  )
}

export default BackToTop
