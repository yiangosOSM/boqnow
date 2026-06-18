// src/lib/types.ts
// Single source of truth for BOQ types — used everywhere

export interface BOQItem {
  id: string
  category: string
  description: string
  unit: string
  quantity: number
  unitPrice: number
  total: number
  medskoCode?: string | null
  notes?: string | null
}

export interface BOQSection {
  title: string
  items: BOQItem[]
  subtotal: number
}

export interface EngineValidation {
  engineTotal: number
  aiTotal: number
  deviation: number
  requiresReview: boolean
}

export interface BOQResult {
  projectName: string
  sections: BOQSection[]
  grandTotal: number
  currency: 'EUR'
  generatedAt: string
  confidence: 'high' | 'medium' | 'low'
  method: 'hybrid' | 'ai_only' | 'multi_step_verified'
  engineValidation?: EngineValidation
  warnings?: string[]
  analysisNotes?: string
}

export interface ProjectWithBOQ {
  id: string
  name: string
  status: string
  totalAmount: number | null
  createdAt: Date
  inputFiles: string[]
  boqData: BOQResult | null
}
