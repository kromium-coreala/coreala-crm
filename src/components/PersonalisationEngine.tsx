import { useState } from 'react'
import { Sparkles, Loader, RefreshCw, Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
  guest: any
  reservations: any[]
  experiences: any[]
}

interface Suggestion {
  category: string
  icon: string
  title: string
  detail: string
  confidence: 'High' | 'Medium' | 'Likely'
}

interface PersonalisationPlan {
  welcome: string
  suggestions: Suggestion[]
  diningNote: string
  conciergeScript: string
}

export default function PersonalisationEngine({ guest, reservations, experiences }: Props) {
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState<PersonalisationPlan | null>(null)
  const [copied, setCopied] = useState(false)

  async function generate() {
    setLoading(true)
    setPlan(null)

    // Build rich context from guest data
    const completedStays = reservations.filter(r => r.status === 'checked_out')
    const completedExp = experiences.filter(e => e.status === 'completed')
    const expByType = completedExp.reduce((acc: Record<string, number>, e) => {
      acc[e.experience_type] = (acc[e.experience_type] || 0) + 1
      return acc
    }, {})
    const topExp = Object.entries(expByType).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k.replace('_', ' '))
    const totalSpend = reservations.reduce((s, r) => s + (r.total_amount || 0), 0)
    const expSpend = experiences.reduce((s, e) => s + (e.amount || 0), 0)
    const lastStay = completedStays[0]
    const months = completedStays.map(r => new Date(r.check_in).getMonth())
    const visitPattern = months.length > 1 ? `typically visits in ${months.map(m => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m]).join(', ')}` : ''

    const prompt = `You are the head concierge at Coraléa Private Retreat, an ultra-premium boutique resort on the West Coast of Barbados. You have access to a guest's full history and must generate a hyper-personalised preparation plan for their next stay.

GUEST PROFILE:
Name: ${guest.first_name} ${guest.last_name}
Nationality: ${guest.nationality || 'Unknown'}
VIP Tier: ${guest.vip_tier}
Discretion Level: ${guest.discretion_level}
Total Stays: ${guest.total_stays || 0}
Total Lifetime Spend: $${Math.round(totalSpend + expSpend).toLocaleString()} USD
Dietary Requirements: ${guest.dietary_requirements || 'None specified'}
Allergies: ${guest.allergies || 'None'}
Pillow Preference: ${guest.pillow_preference || 'Not specified'}
Room Temperature: ${guest.room_temperature ? guest.room_temperature + '°C' : 'Not specified'}
Preferred Activities: ${(guest.preferred_activities || []).join(', ') || 'Not specified'}
Arrival Preference: ${guest.arrival_preference || 'Not specified'}
Birthday: ${guest.birthday || 'Unknown'}
Anniversary: ${guest.anniversary_date || 'Unknown'}
Preferred Currency: ${guest.preferred_currency || 'USD'}
Concierge Notes: ${guest.notes || 'None'}

STAY HISTORY:
${completedStays.slice(0, 5).map(r => `- ${new Date(r.check_in).toDateString()}: Room ${r.room_number} (${r.accommodation_type?.replace(/_/g,' ')}), ${Math.round((new Date(r.check_out).getTime()-new Date(r.check_in).getTime())/86400000)} nights`).join('\n') || 'No completed stays'}
${visitPattern ? `Visit pattern: ${visitPattern}` : ''}

EXPERIENCE HISTORY:
${completedExp.slice(0, 8).map(e => `- ${e.name} (${new Date(e.date).toDateString()}) — ${e.experience_type?.replace('_',' ')}`).join('\n') || 'No experiences'}
Most booked experience types: ${topExp.join(', ') || 'None yet'}

Based on ALL of this, generate a JSON object with this EXACT structure (no markdown, no backticks, pure JSON):
{
  "welcome": "A 2-sentence personalised welcome note from the GM, referencing specific details from their history. Warm, discreet, ultra-luxury tone.",
  "suggestions": [
    {
      "category": "Room Setup",
      "icon": "🛏",
      "title": "Short action title (max 8 words)",
      "detail": "Specific, actionable detail for the concierge team. Reference their history.",
      "confidence": "High"
    }
  ],
  "diningNote": "A specific note for Chef Antoine about this guest's dining preferences, history, and what to prepare or avoid.",
  "conciergeScript": "A 3-sentence script for the concierge to use when welcoming the guest at arrival, referencing their history naturally."
}

Generate exactly 6 suggestions covering: Room Setup, Dining, Experiences, Wellness, Transport/Arrival, and one surprise/delight moment. Confidence must be one of: High, Medium, Likely. Be SPECIFIC — use actual names, dates, preferences from the profile. Never be generic. This is a $2,500/night retreat.`

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })

      const data = await response.json()
      const raw = data.content?.[0]?.text || ''

      // Parse JSON response
      const jsonStr = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const parsed: PersonalisationPlan = JSON.parse(jsonStr)
      setPlan(parsed)
    } catch (e) {
      console.error(e)
      toast.error('Failed to generate suggestions — check console')
    }

    setLoading(false)
  }

  async function copyScript() {
    if (!plan?.conciergeScript) return
    await navigator.clipboard.writeText(plan.conciergeScript)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Script copied to clipboard')
  }

  const confidenceColor: Record<string, string> = {
    High: 'var(--status-in)', Medium: 'var(--gold)', Likely: '#a78bfa',
  }

  return (
    <div className="card card-elevated" style={{ borderColor: plan ? 'rgba(201,169,110,0.3)' : 'var(--border-subtle)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: plan ? 20 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 'var(--radius-sm)', background: 'var(--gold-glow)', border: '1px solid var(--border-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={15} color="var(--gold)" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Personalisation Engine</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>AI-powered stay preparation · Based on {guest.total_stays || 0} stays</div>
          </div>
        </div>
        <button
          className={`btn ${plan ? 'btn-ghost' : 'btn-primary'} btn-sm`}
          onClick={generate}
          disabled={loading}
          style={{ gap: 6 }}
        >
          {loading
            ? <><Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> Analysing…</>
            : plan
              ? <><RefreshCw size={12} /> Regenerate</>
              : <><Sparkles size={12} /> Generate Plan</>
          }
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)', animation: `bounce 1.2s ${i * 0.2}s infinite` }} />
            ))}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>
            Analysing {guest.first_name}'s history across {guest.total_stays || 0} stays…
          </div>
        </div>
      )}

      {/* Results */}
      {plan && !loading && (
        <div>
          {/* Welcome message */}
          <div style={{ padding: '14px 16px', background: 'var(--gold-glow)', border: '1px solid var(--border-mid)', borderRadius: 'var(--radius-sm)', marginBottom: 20 }}>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 8 }}>GM Welcome Message</div>
            <div style={{ fontSize: 15, color: 'var(--text-primary)', lineHeight: 1.7, fontStyle: 'italic', fontFamily: 'var(--font-editorial)' }}>{plan.welcome}</div>
          </div>

          {/* Suggestions grid */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>Preparation Recommendations</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {plan.suggestions?.map((s, i) => (
                <div key={i} style={{ padding: '12px 14px', background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 14 }}>{s.icon}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.category}</span>
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 600, color: confidenceColor[s.confidence] || 'var(--text-muted)', padding: '2px 6px', borderRadius: 10, background: `${confidenceColor[s.confidence]}15`, border: `1px solid ${confidenceColor[s.confidence]}30` }}>
                      {s.confidence}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{s.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s.detail}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Chef's note */}
          <div style={{ padding: '12px 14px', background: 'rgba(251,146,60,0.06)', border: '1px solid rgba(251,146,60,0.2)', borderRadius: 'var(--radius-sm)', marginBottom: 14 }}>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#fb923c', marginBottom: 8 }}>Note for Chef Antoine</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{plan.diningNote}</div>
          </div>

          {/* Concierge script */}
          <div style={{ padding: '12px 14px', background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#60a5fa' }}>Arrival Welcome Script</div>
              <button className="btn btn-ghost btn-sm" onClick={copyScript} style={{ gap: 5 }}>
                {copied ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
              </button>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, fontStyle: 'italic' }}>"{plan.conciergeScript}"</div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-8px)} }
      `}</style>
    </div>
  )
}
