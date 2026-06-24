import { useEffect, useRef, useState } from 'react'

export function useInView(options) {
  const ref = useRef(null)
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const obs = new IntersectionObserver(([entry]) => {
      const intersecting = entry?.isIntersecting ?? false
      if (!intersecting) {
        if (!options?.once) setIsInView(false)
        return
      }
      const delay = options?.enterDelayMs ?? 0
      if (delay > 0) window.setTimeout(() => setIsInView(true), delay)
      else setIsInView(true)
      if (options?.once) obs.disconnect()
    }, options)

    obs.observe(el)
    return () => obs.disconnect()
  }, [options])

  return { ref, isInView }
}

