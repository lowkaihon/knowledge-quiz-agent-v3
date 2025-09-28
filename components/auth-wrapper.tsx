"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { UsernameAuth } from "./username-auth"
import { getCurrentUser } from "@/lib/auth"
import type { User } from "@/lib/types"

interface AuthWrapperProps {
  children: (user: User) => React.ReactNode
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const currentUser = getCurrentUser()
    setUser(currentUser)
    setIsLoading(false)
  }, [])

  const handleAuthenticated = (authenticatedUser: User) => {
    setUser(authenticatedUser)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <UsernameAuth onAuthenticated={handleAuthenticated} />
  }

  return <>{children(user)}</>
}
