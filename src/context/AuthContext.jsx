import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase'
import { getProfile, setUserProfile } from '../lib/data'

const Ctx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => onAuthStateChanged(auth, async current => {
    setUser(current)

    if (current) {
      try {
        let p = await getProfile(current.uid)
        if (!p) {
          await setUserProfile(current)
          p = await getProfile(current.uid)
        }
        setProfile(p)
      } catch (e) {
        console.error(e)
        setProfile(null)
      }
    } else {
      setProfile(null)
    }

    setLoading(false)
  }), [])

  return (
    <Ctx.Provider value={{
      user,
      profile,
      loading,
      isAdmin: profile?.role === 'admin'
    }}>
      {children}
    </Ctx.Provider>
  )
}

export const useAuth = () => useContext(Ctx)