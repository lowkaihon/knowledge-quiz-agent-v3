import type { User } from "@/lib/types"

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null

  const userStr = sessionStorage.getItem("quiz_user")
  if (!userStr) return null

  try {
    return JSON.parse(userStr)
  } catch {
    return null
  }
}

export function signOut(): void {
  if (typeof window === "undefined") return

  sessionStorage.removeItem("quiz_user")
  localStorage.clear()
  window.location.reload()
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null
}
