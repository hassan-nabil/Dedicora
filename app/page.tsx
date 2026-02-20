import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-6">
      <p className="welcome-shimmer mb-12">
        Welcome to Dedicora
      </p>
      <Button
        asChild
        variant="outline"
        className="rounded-full border-white/20 bg-transparent px-8 py-6 text-base text-white hover:bg-white/10 hover:text-white"
      >
        <Link href="/task" className="flex items-center gap-3">
          Get Started
          <span aria-hidden="true">&rarr;</span>
        </Link>
      </Button>
    </div>
  )
}
