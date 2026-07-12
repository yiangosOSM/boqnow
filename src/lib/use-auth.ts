'use client'

import { useAuth as useClerkAuth } from '@clerk/nextjs'

export function useAuth() {
  if (process.env.NEXT_PUBLIC_MOCK_AUTH === 'true') {
    return { isSignedIn: true, userId: 'user_mock_demo' }
  }
  return useClerkAuth()
}
