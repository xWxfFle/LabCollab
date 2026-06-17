import { fetchFx } from '@farfetched/core'
import { sessionUnauthorized } from './unauthorized'

function isPublicAuthPath(url: string) {
  try {
    const path = new URL(url, window.location.origin).pathname
    return path === '/api/auth/login' || path === '/api/auth/register'
  }
  catch {
    return false
  }
}

export function isUnauthorizedResponse(status: number, url: string) {
  return status === 401 && !isPublicAuthPath(url)
}

fetchFx.use(async (request) => {
  const response = await fetch(request)
  if (isUnauthorizedResponse(response.status, request.url)) {
    sessionUnauthorized()
  }
  return response
})
