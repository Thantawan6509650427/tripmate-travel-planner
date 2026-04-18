import { apiFetch } from './apiClient'
import type { ApiResponse, User } from '../types'

export const authService = {
  register: async (email: string, password: string, name: string) => {
    const res = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name })
    })
    return res.json() as Promise<ApiResponse<{ user: User; token: string }>>
  },

  login: async (email: string, password: string) => {
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })
    return res.json() as Promise<ApiResponse<{ user: User; token: string }>>
  },

  getMe: async () => {
    const res = await apiFetch('/auth/me')
    return res.json() as Promise<ApiResponse<User>>
  }
}