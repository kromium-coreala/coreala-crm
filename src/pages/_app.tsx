import type { AppProps } from 'next/app'
import '@/styles/globals.css'
import Layout from '@/components/layout/Layout'
import { AppProviders } from '@/components/layout/Sidebar'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AppProviders>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </AppProviders>
  )
}
