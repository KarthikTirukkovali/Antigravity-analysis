import './globals.css'
import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { TimelineProvider } from '@/lib/TimelineContext'
import ChatBox from '@/components/ChatBox'

export const metadata: Metadata = {
  title: 'FactoryPulse — Machine Telemetry Dashboard',
  description: 'Real-time cable manufacturing machine telemetry dashboard. 131 machines, 2M+ sensor readings processed in parallel using Polars and ThreadPoolExecutor.',
  keywords: ['manufacturing', 'machine telemetry', 'ETL', 'Polars', 'cable factory', 'OEE', 'uptime'],
  openGraph: {
    title: 'FactoryPulse — Cable Manufacturing Intelligence',
    description: 'Live telemetry from 131 cable manufacturing machines across 30 production days.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <TimelineProvider>
          <div className="layout">
            <Navbar />
            <main className="main-content">
              {children}
            </main>
            <Footer />
          </div>
          <ChatBox />
        </TimelineProvider>
      </body>
    </html>
  )
}
