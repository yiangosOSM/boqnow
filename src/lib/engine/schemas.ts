// src/lib/engine/schemas.ts
// Zod schemas for runtime validation of Claude AI output

import { z } from 'zod'

// ── BOQ Item ──────────────────────────────────────────────────
export const BOQItemSchema = z.object({
  id:          z.string().min(1),
  category:    z.string().min(1),
  description: z.string().min(1).max(500),
  unit:        z.string().min(1).max(20),
  quantity:    z.number().nonnegative().finite(),
  unitPrice:   z.number().nonnegative().finite(),
  total:       z.number().nonnegative().finite(),
  medskoCode:  z.string().nullable().optional(),
  notes:       z.string().nullable().optional(),
}).transform(item => ({
  ...item,
  // Recalculate total from quantity × unitPrice to catch AI math errors
  total: parseFloat((item.quantity * item.unitPrice).toFixed(2)),
}))

// ── BOQ Section ───────────────────────────────────────────────
export const BOQSectionSchema = z.object({
  title:    z.string().min(1).max(100),
  items:    z.array(BOQItemSchema).min(1),
  subtotal: z.number().nonnegative().finite(),
}).transform(section => ({
  ...section,
  // Recalculate subtotal from items
  subtotal: parseFloat(section.items.reduce((s, i) => s + i.total, 0).toFixed(2)),
}))

// ── Full BOQ ──────────────────────────────────────────────────
export const BOQResultSchema = z.object({
  projectName:   z.string().min(1).max(200),
  sections:      z.array(BOQSectionSchema).min(1),
  grandTotal:    z.number().positive().finite().max(50_000_000), // max €50M sanity check
  currency:      z.literal('EUR'),
  confidence:    z.enum(['high', 'medium', 'low']),
  analysisNotes: z.string().optional(),
}).transform(boq => ({
  ...boq,
  // Recalculate grand total from sections
  grandTotal: parseFloat(boq.sections.reduce((s, sec) => s + sec.subtotal, 0).toFixed(2)),
}))

// ── Geometry extraction schema ─────────────────────────────────
export const DoorSchema = z.object({
  width:  z.number().positive().max(10),
  height: z.number().positive().max(5),
  type:   z.enum(['internal', 'entrance', 'wc']),
  count:  z.number().int().positive().max(20),
})

export const WindowSchema = z.object({
  width:  z.number().positive().max(10),
  height: z.number().positive().max(5),
  type:   z.enum(['openable', 'sliding', 'fixed']),
  count:  z.number().int().positive().max(30),
})

export const RoomSchema = z.object({
  name:      z.string().min(1).max(100),
  area:      z.number().positive().max(2000),
  perimeter: z.number().positive().max(500),
  height:    z.number().positive().max(10).default(2.8),
  doors:     z.array(DoorSchema).default([]),
  windows:   z.array(WindowSchema).default([]),
  wetRoom:   z.boolean().default(false),
})

export const GeometrySchema = z.object({
  rooms:                z.array(RoomSchema).min(1),
  totalFloorArea:       z.number().positive().max(50000),
  floors:               z.number().int().positive().max(50).default(1),
  hasPatio:             z.boolean().default(false),
  patioArea:            z.number().nonnegative().max(10000).default(0),
  hasPool:              z.boolean().default(false),
  poolArea:             z.number().nonnegative().max(5000).default(0),
  extractionConfidence: z.enum(['high', 'medium', 'low']).default('medium'),
  extractionNotes:      z.string().optional(),
})

// ── Parse + validate with auto-fix ────────────────────────────
export function validateBOQOutput(raw: unknown): {
  success: boolean
  data?: z.infer<typeof BOQResultSchema>
  errors?: string[]
} {
  const result = BOQResultSchema.safeParse(raw)
  if (result.success) {
    return { success: true, data: result.data }
  }
  const errors = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`)
  return { success: false, errors }
}

export function validateGeometry(raw: unknown): {
  success: boolean
  data?: z.infer<typeof GeometrySchema>
  errors?: string[]
} {
  const result = GeometrySchema.safeParse(raw)
  if (result.success) {
    return { success: true, data: result.data }
  }
  const errors = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`)
  return { success: false, errors }
}
