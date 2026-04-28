import './globals.css'
import { SuperTokensProvider } from './components/SupertokensProvider'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <SuperTokensProvider>
        <body>{children}</body>
      </SuperTokensProvider>
    </html>
  )
}