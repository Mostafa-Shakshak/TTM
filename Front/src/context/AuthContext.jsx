import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authService } from '../services/auth.service'
import { usersService } from '../services/users.service'
import { DEMO_USER } from '../data/demoData'
import { decodeToken } from '../utils/jwt'

const AuthContext = createContext(null)

const storage = {
  saveSession({ accessToken, refreshToken, user }) {
    localStorage.setItem('ttm_access_token', accessToken)
    if (refreshToken) localStorage.setItem('ttm_refresh_token', refreshToken)
    localStorage.setItem('ttm_user', JSON.stringify(user))
  },
  clearSession() {
    localStorage.removeItem('ttm_access_token')
    localStorage.removeItem('ttm_refresh_token')
    localStorage.removeItem('ttm_user')
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const clearSession = useCallback(() => {
    storage.clearSession()
    setUser(null)
  }, [])

  useEffect(() => {
    let active = true

    async function restoreSession() {
      const token = localStorage.getItem('ttm_access_token')
      const savedUser = localStorage.getItem('ttm_user')

      if (!token) {
        if (active) setIsLoading(false)
        return
      }

      if (token === 'demo-session' && savedUser) {
        if (active) {
          setUser(JSON.parse(savedUser))
          setIsLoading(false)
        }
        return
      }

      const payload = decodeToken(token)
      if (!payload?.id) {
        clearSession()
        if (active) setIsLoading(false)
        return
      }

      try {
        const profile = await usersService.getProfile(payload.id)
        if (active) {
          setUser(profile)
          localStorage.setItem('ttm_user', JSON.stringify(profile))
        }
      } catch {
        clearSession()
      } finally {
        if (active) setIsLoading(false)
      }
    }

    restoreSession()
    window.addEventListener('ttm:unauthorized', clearSession)
    return () => {
      active = false
      window.removeEventListener('ttm:unauthorized', clearSession)
    }
  }, [clearSession])

  const login = useCallback(async (credentials) => {
    const session = await authService.login(credentials)
    const payload = decodeToken(session.accessToken)
    if (!payload?.id) throw new Error('The API returned an invalid access token.')
    storage.saveSession({ ...session, user: { id: payload.id } })
    const profile = await usersService.getProfile(payload.id)
    storage.saveSession({ ...session, user: profile })
    setUser(profile)
    return profile
  }, [])

  const register = useCallback(async (payload) => {
    await authService.signup(payload)
    return login({ email: payload.email, password: payload.password })
  }, [login])

  const logout = useCallback(async () => {
    const demo = localStorage.getItem('ttm_access_token') === 'demo-session'
    try {
      if (!demo) await authService.logout()
    } finally {
      clearSession()
    }
  }, [clearSession])

  const logoutAll = useCallback(async () => {
    await authService.logoutAll()
    clearSession()
  }, [clearSession])

  const updateUser = useCallback((profile) => {
    localStorage.setItem('ttm_user', JSON.stringify(profile))
    setUser(profile)
  }, [])

  const startDemo = useCallback(() => {
    storage.saveSession({
      accessToken: 'demo-session',
      refreshToken: '',
      user: DEMO_USER
    })
    setUser(DEMO_USER)
  }, [])

  const isDemo = localStorage.getItem('ttm_access_token') === 'demo-session'

  const value = useMemo(() => ({
    user,
    isLoading,
    isAuthenticated: Boolean(user),
    isDemo,
    login,
    register,
    logout,
    logoutAll,
    updateUser,
    startDemo
  }), [user, isLoading, isDemo, login, register, logout, logoutAll, updateUser, startDemo])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
