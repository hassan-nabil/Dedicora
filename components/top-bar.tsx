"use client"

import { useRouter } from "next/navigation"
import { LayoutPanelLeft, Settings, Home, LogOut, Heart } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useSettings } from "@/components/providers/settings-provider"
import { useAuth } from "@/components/providers/auth-provider"

export function TopBar({ showSidebar = false }: { showSidebar?: boolean }) {
  const router = useRouter()
  const { setSettingsOpen, setSidebarOpen } = useSettings()
  const { user, profile, signOut, isGuest } = useAuth()

  return (
    <div className="absolute right-4 top-4 flex flex-wrap items-center justify-end gap-1.5 sm:right-6 sm:top-6 sm:gap-2">
      {isGuest && !user && (
        <Button
          variant="outline"
          className="rounded-full px-4 text-xs border-brand/40 text-brand hover:bg-brand/10"
          onClick={() => router.push("/login?from=guest")}
        >
          Sign up
        </Button>
      )}
      {user && (
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full border border-border bg-background/70 shadow-sm"
          onClick={() => router.push("/dashboard")}
          aria-label="Dashboard"
        >
          <Home className="h-5 w-5" />
        </Button>
      )}
      {showSidebar && (
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full border border-border bg-background/70 shadow-sm"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open task sidebar"
        >
          <LayoutPanelLeft className="h-5 w-5" />
        </Button>
      )}
      <a
        href="https://paypal.me/Billionareh"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Support Dedicora"
      >
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full border border-border bg-background/70 shadow-sm text-pink-500 hover:text-pink-600"
        >
          <Heart className="h-4 w-4" />
        </Button>
      </a>
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full border border-border bg-background/70 shadow-sm"
        onClick={() => setSettingsOpen(true)}
        aria-label="Open settings"
      >
        <Settings className="h-5 w-5" />
      </Button>
      {user && (
        <>
          {profile?.avatar_url ? (
            <button
              onClick={() => router.push("/dashboard")}
              className="h-9 w-9 overflow-hidden rounded-full border border-border shadow-sm"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={profile.avatar_url}
                alt={profile.display_name ?? "Avatar"}
                className="h-full w-full object-cover"
              />
            </button>
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full border border-border bg-background/70 shadow-sm"
            onClick={async () => {
              await signOut()
              router.push("/")
            }}
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  )
}
