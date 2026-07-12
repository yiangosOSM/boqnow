import { auth as clerkAuth, currentUser as clerkCurrentUser } from '@clerk/nextjs/server'
import { MOCK_CLERK_ID, MOCK_USER } from '@/lib/dev/mock-data'

const isMockAuth = () => process.env.MOCK_AUTH === 'true'

export function auth() {
  if (isMockAuth()) {
    return {
      userId: process.env.MOCK_CLERK_USER_ID || MOCK_CLERK_ID,
      sessionId: 'mock_session',
      orgId: null,
      orgRole: null,
      orgSlug: null,
      protect: async () => {},
    }
  }
  return clerkAuth()
}

export async function currentUser() {
  if (isMockAuth()) {
    const [firstName, ...rest] = (MOCK_USER.name ?? '').split(' ')
    return {
      id: MOCK_USER.clerkId,
      emailAddresses: [{ emailAddress: MOCK_USER.email }],
      firstName,
      lastName: rest.join(' ') || null,
    }
  }
  return clerkCurrentUser()
}
