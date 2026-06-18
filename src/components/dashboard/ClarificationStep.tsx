'use client'
// src/components/dashboard/ClarificationStep.tsx
// Shows smart questions to contractor before final BOQ generation

import { useState } from 'react'
import { ChevronRight, HelpCircle } from 'lucide-react'
import type { ClarificationQuestion, ClarificationAnswer } from '@/lib/engine/pipeline'

interface Props {
  questions: ClarificationQuestion[]
  onSubmit: (answers: ClarificationAnswer[]) => void
  onSkip: () => void
  loading?: boolean
}

export default function ClarificationStep({ questions, onSubmit, onSkip, loading }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    questions.forEach(q => { if (q.default) init[q.id] = q.default })
    return init
  })

  const setAnswer = (id: string, value: string) => {
    setAnswers(prev => ({ ...prev, [id]: value }))
  }

  const allAnswered = questions.every(q => answers[q.id])

  const handleSubmit = () => {
    const result: ClarificationAnswer[] = questions.map(q => ({
      questionId: q.id,
      answer: answers[q.id] || q.default || 'Δεν απαντήθηκε',
    }))
    onSubmit(result)
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #E0E0E0', borderRadius: 8, padding: 32 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 24 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#FFF8E6', border: '1px solid #FFE0A0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <HelpCircle size={18} color="#B8860B" />
        </div>
        <div>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: '#0A0A0A', marginBottom: 4 }}>
            Λίγες ερωτήσεις πριν το τελικό BOQ
          </h2>
          <p style={{ fontSize: 13, color: '#9A9A9A', lineHeight: 1.5 }}>
            Οι απαντήσεις σου αυξάνουν σημαντικά την ακρίβεια. Διαρκεί &lt;2 λεπτά.
          </p>
        </div>
      </div>

      {/* Questions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 28 }}>
        {questions.map((q, i) => (
          <div key={q.id} style={{ padding: '16px 20px', background: '#FAFAFA', borderRadius: 8, border: '1px solid #F0F0F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <label style={{ fontSize: 14, fontWeight: 600, color: '#0A0A0A', lineHeight: 1.4, flex: 1, paddingRight: 12 }}>
                <span style={{ color: '#9A9A9A', marginRight: 6 }}>{i + 1}.</span>
                {q.question}
              </label>
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 8, flexShrink: 0,
                background: q.impact === 'high' ? '#FFF0F0' : '#FFF8E6',
                color: q.impact === 'high' ? '#CC3333' : '#B8860B',
              }}>
                {q.estimated_cost_impact}
              </span>
            </div>

            {q.type === 'yes_no' && (
              <div style={{ display: 'flex', gap: 8 }}>
                {['Ναι', 'Όχι'].map(opt => (
                  <button
                    key={opt}
                    onClick={() => setAnswer(q.id, opt)}
                    style={{
                      padding: '7px 20px', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontWeight: 500,
                      border: `1px solid ${answers[q.id] === opt ? '#0A0A0A' : '#E0E0E0'}`,
                      background: answers[q.id] === opt ? '#0A0A0A' : '#fff',
                      color: answers[q.id] === opt ? '#FAFAFA' : '#0A0A0A',
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {q.type === 'multiple_choice' && q.options && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {q.options.map(opt => (
                  <button
                    key={opt}
                    onClick={() => setAnswer(q.id, opt)}
                    style={{
                      padding: '7px 14px', borderRadius: 6, fontSize: 13, cursor: 'pointer',
                      border: `1px solid ${answers[q.id] === opt ? '#0A0A0A' : '#E0E0E0'}`,
                      background: answers[q.id] === opt ? '#0A0A0A' : '#fff',
                      color: answers[q.id] === opt ? '#FAFAFA' : '#0A0A0A',
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {q.type === 'text' && (
              <input
                type="text"
                value={answers[q.id] || ''}
                onChange={e => setAnswer(q.id, e.target.value)}
                placeholder={q.default || 'Απάντηση...'}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #E0E0E0', borderRadius: 6, fontSize: 13, outline: 'none' }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button
          onClick={onSkip}
          disabled={loading}
          style={{ padding: '10px 20px', background: '#fff', color: '#9A9A9A', border: '1px solid #E0E0E0', borderRadius: 6, fontSize: 14, cursor: 'pointer' }}
        >
          Παράλειψη — συνέχισε χωρίς απαντήσεις
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 24px', background: '#0A0A0A', color: '#FAFAFA',
            border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Δημιουργία BOQ...' : 'Δημιούργησε BOQ'}
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
