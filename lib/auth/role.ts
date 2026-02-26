export type AppRole = 'public' | 'sales' | 'admin'

const STORAGE_KEY = 'arche_role'
const EVENT_NAME = 'arche_role_change'

export function getRole(): AppRole {
  if (typeof window === 'undefined') return 'public'
  const r = sessionStorage.getItem(STORAGE_KEY)
  if (r === 'admin' || r === 'sales' || r === 'public') return r
  return 'public'
}

function notifyRoleChange() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(EVENT_NAME))
}

export function setRole(role: AppRole) {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(STORAGE_KEY, role)
  notifyRoleChange()
}

export function clearRole() {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(STORAGE_KEY)
  notifyRoleChange()
}

export function roleFromPassword(pw: string): AppRole | null {
  const p = pw.trim()
  if (p === 'admin2026') return 'admin'
  if (p === 'sales2026') return 'sales'
  return null
}

export const ROLE_EVENT_NAME = EVENT_NAME
