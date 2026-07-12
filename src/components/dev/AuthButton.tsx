'use client'

import { UserButton } from '@clerk/nextjs'
import MockUserButton from './MockUserButton'

export default function AuthButton() {
  if (process.env.NEXT_PUBLIC_MOCK_AUTH === 'true') {
    return <MockUserButton />
  }
  return <UserButton afterSignOutUrl="/" />
}
