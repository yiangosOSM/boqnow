// src/lib/errors.ts
// Centralized error handling, retry logic, and timeout utilities

// ── Custom error types ────────────────────────────────────────
export class MeasurError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 500,
    public userMessage?: string
  ) {
    super(message)
    this.name = 'MeasurError'
  }
}

export class RateLimitError extends MeasurError {
  constructor(retryAfter?: number) {
    super('Rate limit exceeded', 'RATE_LIMIT', 429,
      `Πάρα πολλά αιτήματα. Δοκίμασε ξανά${retryAfter ? ` σε ${retryAfter} δευτερόλεπτα` : ' σε λίγο'}.`)
  }
}

export class PlanLimitError extends MeasurError {
  constructor(plan: string, limit: number) {
    super('Plan limit exceeded', 'PLAN_LIMIT', 429,
      `Έφτασες το όριο των ${limit} projects για τον μήνα με το πλάνο ${plan}. Αναβάθμισε για να συνεχίσεις.`)
  }
}

export class FileTooBigError extends MeasurError {
  constructor(filename: string, maxMB: number) {
    super('File too large', 'FILE_TOO_LARGE', 413,
      `Το αρχείο "${filename}" είναι πολύ μεγάλο. Μέγιστο μέγεθος: ${maxMB}MB.`)
  }
}

export class UnsupportedFileError extends MeasurError {
  constructor(filename: string) {
    super('Unsupported file type', 'UNSUPPORTED_FILE', 415,
      `Ο τύπος αρχείου "${filename}" δεν υποστηρίζεται. Χρησιμοποίησε PDF, Excel, DWG, DXF, ή CSV.`)
  }
}

export class AIGenerationError extends MeasurError {
  constructor(detail?: string) {
    super('AI generation failed', 'AI_ERROR', 500,
      'Σφάλμα κατά τη δημιουργία BOQ. Παρακαλώ δοκίμασε ξανά.')
  }
}

// ── Retry with exponential backoff ───────────────────────────
interface RetryOptions {
  maxAttempts?: number
  initialDelay?: number  // ms
  maxDelay?: number      // ms
  onRetry?: (attempt: number, error: Error) => void
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    onRetry,
  } = options

  let lastError: Error

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      // Don't retry on client errors (4xx)
      if (error instanceof MeasurError && error.status < 500) throw error

      if (attempt < maxAttempts) {
        const delay = Math.min(initialDelay * Math.pow(2, attempt - 1), maxDelay)
        onRetry?.(attempt, lastError)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError!
}

// ── Timeout wrapper ───────────────────────────────────────────
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  timeoutMessage = 'Η λειτουργία άργησε πολύ. Δοκίμασε ξανά.'
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new MeasurError(timeoutMessage, 'TIMEOUT', 408, timeoutMessage)), timeoutMs)
  )
  return Promise.race([fn(), timeoutPromise])
}

// ── Safe JSON parse ───────────────────────────────────────────
export function safeParseJSON<T>(text: string, fallback?: T): T | undefined {
  try {
    // Strip markdown code fences if present
    const clean = text.replace(/^```json\s*|^```\s*|```\s*$/gm, '').trim()
    return JSON.parse(clean) as T
  } catch {
    return fallback
  }
}

// ── Format error for API response ────────────────────────────
export function formatErrorResponse(error: unknown): { error: string; code?: string } {
  if (error instanceof MeasurError) {
    return { error: error.userMessage || error.message, code: error.code }
  }
  if (error instanceof Error) {
    return { error: error.message }
  }
  return { error: 'Άγνωστο σφάλμα. Δοκίμασε ξανά.' }
}

// ── Client-side error messages ────────────────────────────────
export const ERROR_MESSAGES: Record<string, string> = {
  RATE_LIMIT: 'Πολλά αιτήματα. Περίμενε λίγο και δοκίμασε ξανά.',
  PLAN_LIMIT: 'Έφτασες το μηνιαίο όριο projects. Αναβάθμισε το πλάνο σου.',
  FILE_TOO_LARGE: 'Αρχείο πολύ μεγάλο (μέγιστο 100MB).',
  UNSUPPORTED_FILE: 'Μη υποστηριζόμενος τύπος αρχείου.',
  AI_ERROR: 'Σφάλμα AI. Δοκίμασε ξανά σε λίγο.',
  TIMEOUT: 'Η ανάλυση άργησε. Δοκίμασε με λιγότερα αρχεία.',
  UNAUTHORIZED: 'Παρακαλώ συνδέσου για να συνεχίσεις.',
  DEFAULT: 'Κάτι πήγε στραβά. Δοκίμασε ξανά.',
}

export function getErrorMessage(code?: string): string {
  return ERROR_MESSAGES[code || 'DEFAULT'] || ERROR_MESSAGES.DEFAULT
}
