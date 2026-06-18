// sentry.server.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  enabled: !!process.env.SENTRY_DSN,
  beforeSend(event) {
    // Don't send user PII
    if (event.user) {
      delete event.user.email
      delete event.user.ip_address
    }
    return event
  },
})
