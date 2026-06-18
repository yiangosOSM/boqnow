// src/lib/engine/cost-database.ts
// Cyprus & Greece verified cost rates (2024)
// Sources: Cyprus QS Association, market surveys, contractor data

export type Region = 'cyprus' | 'greece'
export type RateType = 'material' | 'labour' | 'assembly'

export interface CostRate {
  code: string          // ΜΕΔΣΚ code
  description: string
  unit: string
  cyprus: number        // EUR
  greece: number        // EUR
  notes?: string
  lastUpdated: string
}

// ── Assemblies (complete work items — most useful for BOQ) ────
// Assembly = material + labour combined rate
export const ASSEMBLY_RATES: CostRate[] = [
  // ΣΚΥΡΟΔΕΜΑΤΑ
  { code: 'ΣΚ.1.1', description: 'Σκυρόδεμα C16/20 θεμελίων', unit: 'm³', cyprus: 165, greece: 145, lastUpdated: '2024-01' },
  { code: 'ΣΚ.1.2', description: 'Σκυρόδεμα C20/25 θεμελίων', unit: 'm³', cyprus: 185, greece: 160, lastUpdated: '2024-01' },
  { code: 'ΣΚ.1.3', description: 'Σκυρόδεμα C25/30 πλακών/δοκών', unit: 'm³', cyprus: 210, greece: 185, lastUpdated: '2024-01' },
  { code: 'ΣΚ.1.4', description: 'Σκυρόδεμα C25/30 υποστυλωμάτων', unit: 'm³', cyprus: 225, greece: 200, lastUpdated: '2024-01' },
  { code: 'ΣΚ.2.1', description: 'Οπλισμός S500 (χάλυβας)', unit: 'kg', cyprus: 1.45, greece: 1.25, lastUpdated: '2024-01' },
  { code: 'ΣΚ.2.2', description: 'Ξυλότυπος θεμελίων', unit: 'm²', cyprus: 18, greece: 15, lastUpdated: '2024-01' },
  { code: 'ΣΚ.2.3', description: 'Ξυλότυπος πλακών', unit: 'm²', cyprus: 22, greece: 19, lastUpdated: '2024-01' },

  // ΧΩΜΑΤΟΥΡΓΙΚΑ
  { code: 'ΧΩ.1.1', description: 'Εκσκαφή θεμελίων με μηχανικά μέσα', unit: 'm³', cyprus: 12, greece: 10, lastUpdated: '2024-01' },
  { code: 'ΧΩ.1.2', description: 'Επιχωμάτωση-συμπύκνωση', unit: 'm³', cyprus: 8, greece: 7, lastUpdated: '2024-01' },
  { code: 'ΧΩ.1.3', description: 'Αποκομιδή προϊόντων εκσκαφής', unit: 'm³', cyprus: 15, greece: 12, lastUpdated: '2024-01' },

  // ΤΟΙΧΟΠΟΙΙΑ
  { code: 'ΤΟ.1.1', description: 'Τοιχοποιία οπτόπλινθοι 9cm', unit: 'm²', cyprus: 32, greece: 27, lastUpdated: '2024-01' },
  { code: 'ΤΟ.1.2', description: 'Τοιχοποιία οπτόπλινθοι 12cm', unit: 'm²', cyprus: 38, greece: 32, lastUpdated: '2024-01' },
  { code: 'ΤΟ.1.3', description: 'Τοιχοποιία οπτόπλινθοι 25cm', unit: 'm²', cyprus: 55, greece: 46, lastUpdated: '2024-01' },
  { code: 'ΤΟ.2.1', description: 'Γυψοσανίδα μονή (12.5mm)', unit: 'm²', cyprus: 28, greece: 24, lastUpdated: '2024-01' },
  { code: 'ΤΟ.2.2', description: 'Γυψοσανίδα διπλή', unit: 'm²', cyprus: 42, greece: 36, lastUpdated: '2024-01' },

  // ΕΠΙΧΡΙΣΜΑΤΑ
  { code: 'ΕΠ.1.1', description: 'Επίχρισμα τριφτό εξωτερικό', unit: 'm²', cyprus: 22, greece: 18, lastUpdated: '2024-01' },
  { code: 'ΕΠ.1.2', description: 'Επίχρισμα τριφτό εσωτερικό', unit: 'm²', cyprus: 18, greece: 15, lastUpdated: '2024-01' },
  { code: 'ΕΠ.1.3', description: 'Γυψαλοιφή εσωτερική', unit: 'm²', cyprus: 12, greece: 10, lastUpdated: '2024-01' },

  // ΜΟΝΩΣΕΙΣ
  { code: 'ΜΟ.1.1', description: 'Θερμομόνωση XPS 5cm', unit: 'm²', cyprus: 28, greece: 24, lastUpdated: '2024-01' },
  { code: 'ΜΟ.1.2', description: 'Θερμομόνωση XPS 8cm', unit: 'm²', cyprus: 38, greece: 33, lastUpdated: '2024-01' },
  { code: 'ΜΟ.1.3', description: 'Υδατομόνωση ταράτσας', unit: 'm²', cyprus: 35, greece: 29, lastUpdated: '2024-01' },
  { code: 'ΜΟ.1.4', description: 'Υδατομόνωση υπογείου', unit: 'm²', cyprus: 42, greece: 36, lastUpdated: '2024-01' },

  // ΔΑΠΕΔΑ
  { code: 'ΔΑ.1.1', description: 'Πλακάκι δαπέδου έως 30x30', unit: 'm²', cyprus: 38, greece: 32, lastUpdated: '2024-01' },
  { code: 'ΔΑ.1.2', description: 'Πλακάκι δαπέδου 30x60 έως 60x60', unit: 'm²', cyprus: 45, greece: 38, lastUpdated: '2024-01' },
  { code: 'ΔΑ.1.3', description: 'Πλακάκι δαπέδου 60x60 και άνω', unit: 'm²', cyprus: 55, greece: 46, lastUpdated: '2024-01' },
  { code: 'ΔΑ.1.4', description: 'Μάρμαρο δαπέδου (τοποθέτηση)', unit: 'm²', cyprus: 65, greece: 55, lastUpdated: '2024-01' },
  { code: 'ΔΑ.2.1', description: 'Τσιμεντοκονία ισοπέδωσης 5cm', unit: 'm²', cyprus: 18, greece: 15, lastUpdated: '2024-01' },
  { code: 'ΔΑ.3.1', description: 'Σκληρυντής δαπέδου (τσιμεντόστρωση)', unit: 'm²', cyprus: 25, greece: 21, lastUpdated: '2024-01' },

  // ΚΟΥΦΩΜΑΤΑ
  { code: 'ΚΟ.1.1', description: 'Κούφωμα αλουμινίου ανοιγόμενο τυπικό', unit: 'τεμ', cyprus: 380, greece: 320, lastUpdated: '2024-01' },
  { code: 'ΚΟ.1.2', description: 'Κούφωμα αλουμινίου συρόμενο τυπικό', unit: 'τεμ', cyprus: 450, greece: 380, lastUpdated: '2024-01' },
  { code: 'ΚΟ.1.3', description: 'Κούφωμα αλουμινίου ανοιγόμενο premium', unit: 'τεμ', cyprus: 650, greece: 550, lastUpdated: '2024-01' },
  { code: 'ΚΟ.1.4', description: 'Αλουμίνιο ανά m² (custom sizing)', unit: 'm²', cyprus: 320, greece: 270, lastUpdated: '2024-01' },
  { code: 'ΚΟ.2.1', description: 'Πόρτα εσωτερική HDF', unit: 'τεμ', cyprus: 280, greece: 240, lastUpdated: '2024-01' },
  { code: 'ΚΟ.2.2', description: 'Πόρτα εισόδου ασφαλείας', unit: 'τεμ', cyprus: 950, greece: 820, lastUpdated: '2024-01' },
  { code: 'ΚΟ.2.3', description: 'Πόρτα WC', unit: 'τεμ', cyprus: 220, greece: 190, lastUpdated: '2024-01' },

  // ΥΔΡΑΥΛΙΚΑ
  { code: 'ΥΔ.1.1', description: 'Σωλήνωση ύδρευσης PPR (ανά γραμμικό)', unit: 'm', cyprus: 22, greece: 18, lastUpdated: '2024-01' },
  { code: 'ΥΔ.1.2', description: 'Σωλήνωση αποχέτευσης PVC', unit: 'm', cyprus: 18, greece: 15, lastUpdated: '2024-01' },
  { code: 'ΥΔ.2.1', description: 'Λεκάνη WC με καζανάκι εντοιχισμένο', unit: 'τεμ', cyprus: 380, greece: 320, lastUpdated: '2024-01' },
  { code: 'ΥΔ.2.2', description: 'Νιπτήρας με μπαταρία', unit: 'τεμ', cyprus: 280, greece: 240, lastUpdated: '2024-01' },
  { code: 'ΥΔ.2.3', description: 'Ντουζιέρα με μπαταρία', unit: 'τεμ', cyprus: 320, greece: 270, lastUpdated: '2024-01' },
  { code: 'ΥΔ.2.4', description: 'Μπανιέρα με μπαταρία', unit: 'τεμ', cyprus: 480, greece: 410, lastUpdated: '2024-01' },
  { code: 'ΥΔ.3.1', description: 'Θερμαντικό σώμα panel (ανά kW)', unit: 'kW', cyprus: 85, greece: 72, lastUpdated: '2024-01' },

  // ΗΛΕΚΤΡΟΛΟΓΙΚΑ
  { code: 'ΗΛ.1.1', description: 'Καλωδίωση (ανά κύκλωμα)', unit: 'κύκλ', cyprus: 180, greece: 155, lastUpdated: '2024-01' },
  { code: 'ΗΛ.1.2', description: 'Πρίζα ρεύματος', unit: 'τεμ', cyprus: 38, greece: 32, lastUpdated: '2024-01' },
  { code: 'ΗΛ.1.3', description: 'Διακόπτης φωτισμού', unit: 'τεμ', cyprus: 32, greece: 27, lastUpdated: '2024-01' },
  { code: 'ΗΛ.1.4', description: 'Πίνακας διανομής (ανά θέση)', unit: 'θέση', cyprus: 55, greece: 46, lastUpdated: '2024-01' },
  { code: 'ΗΛ.2.1', description: 'Φωτιστικό οροφής (τοποθέτηση)', unit: 'τεμ', cyprus: 45, greece: 38, lastUpdated: '2024-01' },

  // ΧΡΩΜΑΤΙΣΜΟΙ
  { code: 'ΧΡ.1.1', description: 'Χρωματισμός εσωτερικός (2 χέρια)', unit: 'm²', cyprus: 8, greece: 7, lastUpdated: '2024-01' },
  { code: 'ΧΡ.1.2', description: 'Χρωματισμός εξωτερικός ακρυλικός', unit: 'm²', cyprus: 12, greece: 10, lastUpdated: '2024-01' },
  { code: 'ΧΡ.1.3', description: 'Στόκος εσωτερικός', unit: 'm²', cyprus: 6, greece: 5, lastUpdated: '2024-01' },

  // ΕΞΩΤΕΡΙΚΕΣ ΕΡΓΑΣΙΕΣ
  { code: 'ΕΞ.1.1', description: 'Πλακόστρωση εξωτερική τυπική', unit: 'm²', cyprus: 42, greece: 36, lastUpdated: '2024-01' },
  { code: 'ΕΞ.1.2', description: 'Περίφραξη μεταλλική', unit: 'm', cyprus: 85, greece: 72, lastUpdated: '2024-01' },
  { code: 'ΕΞ.1.3', description: 'Πισίνα τυπική (ανά m²)', unit: 'm²', cyprus: 1200, greece: 1000, lastUpdated: '2024-01' },

  // ΠΡΟΚΑΤΑΡΚΤΙΚΑ
  { code: 'ΠΡ.1.1', description: 'Εγκατάσταση εργοταξίου', unit: 'κπσ', cyprus: 2500, greece: 2000, notes: 'Κατ. αποκοπή — μικρά έργα', lastUpdated: '2024-01' },
  { code: 'ΠΡ.1.2', description: 'Αποξηλώσεις-καθαιρέσεις', unit: 'm²', cyprus: 15, greece: 12, lastUpdated: '2024-01' },
  { code: 'ΠΡ.1.3', description: 'Σκαλωσιά', unit: 'm²', cyprus: 8, greece: 7, lastUpdated: '2024-01' },
]

// ── Rate lookup by ΜΕΔΣΚ code ─────────────────────────────────
export function getRateByCode(code: string, region: Region = 'cyprus'): number | null {
  const rate = ASSEMBLY_RATES.find(r => r.code === code)
  if (!rate) return null
  return rate[region]
}

// ── Fuzzy rate lookup by description keywords ─────────────────
export function findRate(keywords: string, region: Region = 'cyprus'): CostRate | null {
  const kw = keywords.toLowerCase()
  const match = ASSEMBLY_RATES.find(r =>
    r.description.toLowerCase().includes(kw) ||
    r.code.toLowerCase().includes(kw)
  )
  return match || null
}

// ── Get all rates for a category ──────────────────────────────
export function getRatesByCategory(categoryPrefix: string, region: Region = 'cyprus'): CostRate[] {
  return ASSEMBLY_RATES.filter(r => r.code.startsWith(categoryPrefix))
}

// ── Apply custom company rates (override defaults) ────────────
export function applyCustomRates(
  defaultRates: CostRate[],
  customRates: Record<string, number>
): CostRate[] {
  return defaultRates.map(rate => ({
    ...rate,
    cyprus: customRates[rate.code] ?? rate.cyprus,
    greece: customRates[rate.code] ?? rate.greece,
  }))
}
