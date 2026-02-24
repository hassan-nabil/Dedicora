"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

type Profile = {
  id: string
  display_name: string | null
  avatar_url: string | null
  onboarding_completed: boolean
}

type AuthState = {
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = React.createContext<AuthState>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null)
  const [profile, setProfile] = React.useState<Profile | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const supabase = createClient()

    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user ?? null)
      if (user) {
        supabase
          .from("profiles")
          .select("id, display_name, avatar_url, onboarding_completed")
          .eq("id", user.id)
          .single()
          .then(({ data }) => {
            setProfile(data ?? null)
            setLoading(false)
          })
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (currentUser) {
        supabase
          .from("profiles")
          .select("id, display_name, avatar_url, onboarding_completed")
          .eq("id", currentUser.id)
          .single()
          .then(({ data }) => {
            setProfile(data ?? null)
            setLoading(false)
          })
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = React.useCallback(async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }, [])

  const value = React.useMemo(
    () => ({ user, profile, loading, signOut }),
    [user, profile, loading, signOut]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return React.useContext(AuthContext)
}
