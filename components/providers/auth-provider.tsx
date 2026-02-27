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
  isGuest: boolean
  signOut: () => Promise<void>
  setGuestMode: (enabled: boolean) => void
}

const AuthContext = React.createContext<AuthState>({
  user: null,
  profile: null,
  loading: true,
  isGuest: false,
  signOut: async () => {},
  setGuestMode: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null)
  const [profile, setProfile] = React.useState<Profile | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [isGuest, setIsGuest] = React.useState(false)

  // Restore guest mode from localStorage on mount
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setIsGuest(localStorage.getItem("dedicora_guest") === "true")
    }
  }, [])

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
        // Clear guest mode when real user signs in
        setIsGuest(false)
        if (typeof window !== "undefined") localStorage.removeItem("dedicora_guest")

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
    setIsGuest(false)
    if (typeof window !== "undefined") localStorage.removeItem("dedicora_guest")
  }, [])

  const setGuestMode = React.useCallback((enabled: boolean) => {
    setIsGuest(enabled)
    if (typeof window !== "undefined") {
      if (enabled) localStorage.setItem("dedicora_guest", "true")
      else localStorage.removeItem("dedicora_guest")
    }
  }, [])

  const value = React.useMemo(
    () => ({ user, profile, loading, isGuest, signOut, setGuestMode }),
    [user, profile, loading, isGuest, signOut, setGuestMode]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return React.useContext(AuthContext)
}
