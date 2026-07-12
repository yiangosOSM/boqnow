import type { BOQResult } from '@/lib/boq-generator'

export const MOCK_CLERK_ID = 'user_mock_demo'

export const MOCK_USER = {
  clerkId: MOCK_CLERK_ID,
  email: 'demo@boqnow.local',
  name: 'Demo Contractor',
}

export function buildMockBOQ(projectName: string): BOQResult {
  return {
    projectName,
    generatedAt: new Date().toISOString(),
    confidence: 'high',
    method: 'hybrid',
    currency: 'EUR',
    grandTotal: 125_400.5,
    sections: [
      {
        title: 'Σκυροδέματα',
        subtotal: 45_200,
        items: [
          {
            id: 'Β.1.1',
            category: 'Σκυροδέματα',
            description: 'Σκυρόδεμα C20/25 θεμελίων',
            unit: 'm³',
            quantity: 42.5,
            unitPrice: 180,
            total: 7650,
            medskoCode: 'ΣΚ.1.1',
            notes: null,
          },
        ],
      },
      {
        title: 'Τοιχοποιία',
        subtotal: 80_200.5,
        items: [
          {
            id: 'Γ.1.1',
            category: 'Τοιχοποιία',
            description: 'Τοιχοποιία οπτόπλινθοι 9cm',
            unit: 'm²',
            quantity: 320,
            unitPrice: 28,
            total: 8960,
            medskoCode: null,
            notes: null,
          },
        ],
      },
    ],
  }
}
