import { ReactNode } from 'react'
import Sidebar from './Sidebar'
import { Toaster } from 'react-hot-toast'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--void)' }}>
      <Sidebar />
      <main className="pt-16 min-h-screen" style={{ background: 'var(--void)' }}>
        <div className="px-4 py-5 max-w-xl mx-auto">
          {children}
        </div>
      </main>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'var(--obsidian)',
            color: 'var(--sand)',
            border: '1px solid rgba(196,168,130,0.2)',
            fontFamily: 'Cinzel, serif',
            fontSize: '10px',
            letterSpacing: '0.2em',
          },
        }}
      />
    </div>
  )
}
