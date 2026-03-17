import type { Metadata, Viewport } from 'next'
import './globals.css'

export const viewport: Viewport = {
  themeColor: '#0a0f1e',
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: 'Antillia Assurance Group — CRM',
  description: 'Caribbean Property & Catastrophe Insurance Platform',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Antillia CRM',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Antillia CRM" />
        <meta name="mobile-web-app-capable" content="yes" />
        {/* Inline script: apply saved theme before first paint to avoid flash */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var t = localStorage.getItem('antillia-theme');
              if (!t) {
                t = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
              }
              document.documentElement.setAttribute('data-theme', t);
            } catch(e) {}
          })();
        `}} />
      </head>
      <body>{children}</body>
    </html>
  )
}
