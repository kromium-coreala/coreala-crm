import { useEffect, useState } from 'react'
import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import '@/styles/globals.css'
import Layout from '@/components/layout/Layout'
import { AppProviders } from '@/components/layout/Sidebar'
import SplashScreen from '@/components/SplashScreen'
import { supabase } from '@/lib/supabase'

type AppState = 'loading' | 'splash' | 'authed' | 'unauthed'

const PUBLIC_PAGES = ['/login']

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const [appState, setAppState] = useState<AppState>('loading')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const shown = sessionStorage.getItem('crm-splash-shown')
        if (!shown) {
          sessionStorage.setItem('crm-splash-shown', 'true')
          setAppState('splash')
        } else {
          setAppState('authed')
        }
      } else {
        setAppState('unauthed')
        if (!PUBLIC_PAGES.includes(router.pathname)) {
          router.replace('/login')
        }
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        sessionStorage.removeItem('crm-splash-shown')
        sessionStorage.removeItem('crm-theme')
        sessionStorage.removeItem('crm-discretion')
        router.replace('/login')
      }
      if (event === 'SIGNED_IN' && session) {
        setAppState('authed')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  if (appState === 'loading') {
    return <div style={{ background: '#0a0908', minHeight: '100vh' }} />
  }

  if (appState === 'splash') {
    return (
      <AppProviders>
        <SplashScreen onComplete={() => setAppState('authed')} duration={2200} />
      </AppProviders>
    )
  }

  if (PUBLIC_PAGES.includes(router.pathname)) {
    return (
      <AppProviders>
        <Component {...pageProps} />
      </AppProviders>
    )
  }

  if (appState === 'unauthed') {
    return <div style={{ background: '#0a0908', minHeight: '100vh' }} />
  }

  return (
    <AppProviders>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </AppProviders>
  )
}
