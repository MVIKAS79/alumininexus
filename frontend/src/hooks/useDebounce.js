import { useState, useEffect } from 'react'

/**
 * Debounces a value by the specified delay.
 * Returns the debounced value which only updates after the delay.
 */
export function useDebounce(value, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}
