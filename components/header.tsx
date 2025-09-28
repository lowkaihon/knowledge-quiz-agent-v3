"use client"

import { Button } from "@/components/ui/button"
import { Brain, User, Home } from "lucide-react"
import type { User as UserType } from "@/lib/types"
import Link from "next/link"

interface HeaderProps {
  user: UserType
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Brain className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Personal Knowledge Quiz Agent</h1>
              <p className="text-sm text-muted-foreground">Generate quizzes from your study materials using AI</p>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Home
              </Button>
            </Link>
            <Link href="/profile">
              <Button variant="ghost" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {user.username}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
