import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestConnection() {
  const [results, setResults] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function test() {
      const checks: any = {}

      // Show what URL is being used
      checks.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET'
      checks.keySet = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'YES (set)' : 'NOT SET'

      // Test each table
      const tables = ['guests', 'reservations', 'experiences', 'events', 'revenue_records', 'staff', 'vendors', 'vendor_orders', 'hurricane_alerts', 'event_tasks']
      for (const table of tables) {
        const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true })
        checks[table] = error ? `ERROR: ${error.message}` : `${count} rows`
      }

      setResults(checks)
      setLoading(false)
    }
    test()
  }, [])

  return (
    <div style={{ fontFamily: 'monospace', padding: 40, background: '#0a0a0a', color: '#fff', minHeight: '100vh' }}>
      <h1 style={{ color: '#c9a96e', marginBottom: 24 }}>Coraléa — Connection Diagnostic</h1>
      {loading ? <p>Testing connection...</p> : (
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <tbody>
            {Object.entries(results).map(([key, val]: any) => (
              <tr key={key} style={{ borderBottom: '1px solid #222' }}>
                <td style={{ padding: '8px 16px', color: '#aaa', width: 280 }}>{key}</td>
                <td style={{ padding: '8px 16px', color: val.toString().startsWith('ERROR') ? '#ff6b6b' : val === 'NOT SET' ? '#ffaa00' : '#4ade80' }}>
                  {val.toString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p style={{ marginTop: 32, color: '#666', fontSize: 12 }}>
        Visit <strong style={{color:'#c9a96e'}}>/test-connection</strong> to run this diagnostic. Delete this page when done.
      </p>
    </div>
  )
}
