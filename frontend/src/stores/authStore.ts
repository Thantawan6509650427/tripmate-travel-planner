import { create } from 'zustand'
import type { User } from '../types'

interface AuthStore {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (user: User, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: localStorage.getItem('jwtToken'),
  isAuthenticated: !!localStorage.getItem('jwtToken'),

  setAuth: (user, token) => {
    localStorage.setItem('jwtToken', token)
    set({ user, token, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem('jwtToken')
    set({ user: null, token: null, isAuthenticated: false })
  }
}))