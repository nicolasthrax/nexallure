import { useCallback, useState } from 'react'

// The user's own details, printed on quotations and signed on emails. Kept
// on this device only.
const KEY = 'nexallure_tool_profile'
const EMPTY = { name: '', company: '', address: '', email: '', phone: '' }

function read() {
  try {
    return { ...EMPTY, ...(JSON.parse(localStorage.getItem(KEY) || '{}') || {}) }
  } catch {
    return { ...EMPTY }
  }
}

export function useProfile() {
  const [profile, setProfile] = useState(read)
  const update = useCallback((patch) => {
    setProfile((p) => {
      const next = { ...p, ...patch }
      try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }, [])
  return [profile, update]
}
