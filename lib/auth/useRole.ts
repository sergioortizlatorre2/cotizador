'use client'

import { useEffect, useState } from 'react'
import type { AppRole } from './role'
import { getRole, ROLE_EVENT_NAME } from './role'

export function useRole(): AppRole {
  const [role, setRole] = useState<AppRole>('public')

  useEffect(() => {
    setRole(getRole())

    const onChange = () => setRole(getRole())
    window.addEventListener(ROLE_EVENT_NAME, onChange)
    return () => window.removeEventListener(ROLE_EVENT_NAME, onChange)
  }, [])

  return role
}
