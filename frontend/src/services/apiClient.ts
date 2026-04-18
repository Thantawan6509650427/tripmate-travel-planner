import { CONFIG } from '../config/app.config'

export const apiFetch = async (
  path: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = localStorage.getItem('jwtToken')

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(options.headers || {})
  }

  const response = await fetch(`${CONFIG.API_BASE_URL}${path}`, {
    ...options,
    headers
  })

  // token หมดอายุ → logout
  if (response.status === 401) {
    localStorage.removeItem('jwtToken')
    window.location.href = '/login'
  }

  return response
}