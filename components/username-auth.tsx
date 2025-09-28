"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@/lib/types"

interface UsernameAuthProps {
  onAuthenticated: (user: User) => void
}

export function UsernameAuth({ onAuthenticated }: UsernameAuthProps) {
  const [username, setUsername] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // First, try to find existing user
      const { data: existingUser, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("username", username.trim())
        .single()

      let user: User

      if (existingUser && !fetchError) {
        // User exists, use existing user
        user = existingUser
      } else {
        // User doesn't exist, create new user
        const { data: newUser, error: createError } = await supabase
          .from("users")
          .insert([{ username: username.trim() }])
          .select()
          .single()

        if (createError) {
          if (createError.code === "23505") {
            // Unique constraint violation
            setError("Username already taken. Please choose a different one.")
            return
          }
          throw createError
        }

        user = newUser
      }

      // Store user in session storage for browser session persistence
      sessionStorage.setItem("quiz_user", JSON.stringify(user))

      // Clear any existing localStorage data as requested
      localStorage.clear()

      onAuthenticated(user)
    } catch (err) {
      console.error("Authentication error:", err)
      setError(err instanceof Error ? err.message : "Authentication failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-emerald-600">Personal Knowledge Quiz</CardTitle>
          <CardDescription>Enter your username to start creating personalized quizzes</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
                className="w-full"
              />
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={isLoading || !username.trim()}
            >
              {isLoading ? "Signing in..." : "Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
