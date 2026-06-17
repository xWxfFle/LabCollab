import { isUnauthorizedResponse } from './http-client'
import { sessionUnauthorized } from './unauthorized'

export const TOKEN_KEY = 'labcollab_token'

export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem(TOKEN_KEY)
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  const auth = getAuthHeaders()
  Object.entries(auth).forEach(([k, v]) => headers.set(k, v))
  if (!headers.has('Content-Type') && init.body && typeof init.body === 'string') {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(`/api${path}`, { ...init, headers })
  if (isUnauthorizedResponse(res.status, `/api${path}`)) {
    sessionUnauthorized()
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(typeof err.error === 'string' ? err.error : 'Request failed')
  }
  return res
}
