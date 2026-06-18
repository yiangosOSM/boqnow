// src/lib/logger.ts
// Structured logging + Sentry error capture

import * as Sentry from '@sentry/nextjs'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  userId?: string
  projectId?: string
  plan?: string
  [key: string]: unknown
}

function log(level: LogLevel, message: string, context?: LogContext) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  }

  if (process.env.NODE_ENV === 'development') {
    const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
    fn(`[${level.toUpperCase()}] ${message}`, context || '')
    return
  }

  // Production: structured JSON (Vercel logs / Logtail picks this up)
  console.log(JSON.stringify(entry))
}

export const logger = {
  debug: (msg: string, ctx?: LogContext) => log('debug', msg, ctx),
  info:  (msg: string, ctx?: LogContext) => log('info', msg, ctx),
  warn:  (msg: string, ctx?: LogContext) => log('warn', msg, ctx),

  error: (msg: string, error?: unknown, ctx?: LogContext) => {
    log('error', msg, ctx)

    // Capture to Sentry
    if (error instanceof Error) {
      Sentry.captureException(error, { extra: ctx })
    } else if (error) {
      Sentry.captureMessage(msg, { level: 'error', extra: { error, ...ctx } })
    }
  },

  // Business events — useful for debugging Stripe/BOQ issues
  boqGenerated: (ctx: { userId: string; projectId: string; plan: string; method: string; total: number; durationMs: number }) => {
    log('info', 'BOQ generated', ctx)
    Sentry.addBreadcrumb({ message: 'BOQ generated', data: ctx, level: 'info' })
  },

  stripeEvent: (event: string, ctx?: LogContext) => {
    log('info', `Stripe: ${event}`, ctx)
  },

  securityEvent: (event: string, ctx?: LogContext) => {
    log('warn', `Security: ${event}`, ctx)
    Sentry.captureMessage(`Security event: ${event}`, { level: 'warning', extra: ctx })
  },
}
