import './globals.css'
import { SuperTokensProvider } from './components/SupertokensProvider'
import Navbar from './components/Navbar'
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
      <SuperTokensProvider>
        <div>
          <Navbar />  {/* 👈 appears on every page */}
          {children}
        </div>
      </SuperTokensProvider>
  )
}