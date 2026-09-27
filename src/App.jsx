import { useCallback, useEffect, useState } from 'react'
import { Route, Switch, useLocation } from 'wouter'
import { translations } from './i18n'
import { AuthProvider, useAuth } from './context/Auth'
import Nav from './components/Nav'
import PreLaunchBanner from './components/PreLaunchBanner'
import HomePage from './pages/HomePage'
import BuyersPage from './pages/BuyersPage'
import PrivacyPage from './pages/PrivacyPage'
import TermsPage from './pages/TermsPage'
import Footer from './components/Footer'
import MarketGuidePage from './pages/MarketGuidePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ErrorBoundary from './components/ErrorBoundary'
import WatchlistDashboard from './components/WatchlistDashboard.jsx'

const pagePaths = {
  home: '/',
  buyers: '/buyers',
  marketGuide: '/market-guide',
  monitor: '/monitor',
  privacy: '/privacy',
  terms: '/terms',
  login: '/login',
  register: '/register',
}

function AppInner() {
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem('nexallure_lang')
    return saved || 'ZH'
  })
  const [location, navigate] = useLocation()
  const [hasDeviceToken, setHasDeviceToken] = useState(false)
  const { session } = useAuth()

  const t = { ...(translations[lang] || translations.ZH), _lang: lang }

  const setPage = useCallback(
    (page) => {
      navigate(pagePaths[page] || pagePaths.home)
    },
    [navigate],
  )

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location])

  useEffect(() => {
    const map = { EN: 'en', ZH: 'zh-CN', TW: 'zh-TW' }
    document.documentElement.lang = map[lang] || 'zh-CN'
  }, [lang])

  useEffect(() => {
    localStorage.setItem('nexallure_lang', lang)
  }, [lang])

  useEffect(() => {
    const token = localStorage.getItem('nexallure_device_token')
    if (token) {
      setHasDeviceToken(true)
    }
  }, [])

  return (
    <>
      <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
        <Nav setPage={setPage} lang={lang} setLang={setLang} t={t} />
        <PreLaunchBanner t={t} />
        <Switch>
          <Route path="/buyers">
            <BuyersPage setPage={setPage} t={t} />
          </Route>
          <Route path="/market-guide">
            <MarketGuidePage t={t} setPage={setPage} />
          </Route>

          {/* Watchlist Dashboard Page Route */}
          <Route path="/monitor">
            <WatchlistDashboard userId={session?.user?.id} t={t} setPage={setPage} />
          </Route>

          <Route path="/privacy">
            <PrivacyPage setPage={setPage} t={t} />
          </Route>
          <Route path="/terms">
            <TermsPage setPage={setPage} t={t} />
          </Route>
          <Route path="/login">
            <LoginPage t={t} setPage={setPage} />
          </Route>
          <Route path="/register">
            <RegisterPage t={t} setPage={setPage} />
          </Route>
          <Route>
            <HomePage t={t} setPage={setPage} />
          </Route>
        </Switch>
        <Footer t={t} setPage={setPage} hasDeviceToken={hasDeviceToken} />
      </div>
    </>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </ErrorBoundary>
  )
}
