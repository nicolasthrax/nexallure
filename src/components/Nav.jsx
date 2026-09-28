import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../context/Auth'
import { NotificationFeed } from './NotificationFeed.jsx'
import { Logo } from './Logo.jsx'

const LANGS = [
  { code: 'EN', label: 'EN', name: 'English' },
  { code: 'ZH', label: '简', name: '简体中文' },
  { code: 'TW', label: '繁', name: '繁體中文' },
]

export default function Nav({ setPage, lang, setLang, t }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [location] = useLocation()
  const { session, signOut } = useAuth()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setMenuOpen(false), [location])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false) }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const go = (target) => {
    setMenuOpen(false)
    if (target === 'marketGuide' || target === 'monitor' || target === 'buyers') {
      setPage(target)
      return
    }
    // Section ids live on the home page: go home first, then scroll.
    setPage('home')
    setTimeout(() => {
      document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 60)
  }

  const links = [
    { label: t.nav_market_guide, target: 'marketGuide', path: '/market-guide' },
    { label: t.nav_monitor, target: 'monitor', path: '/monitor' },
    { label: t.nav_compliance, target: 'compliance' },
    { label: t.nav_buyers, target: 'buyers', path: '/buyers' },
  ]

  return (
    <>
      <style>{`
        .nx-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          height: 64px;
          background: var(--paper);
          color: var(--ink);
          border-bottom: 2px solid var(--ink);
        }
        .nx-nav__row { height: 62px; display: flex; align-items: center; gap: 40px; }
        .nx-brand {
          display: flex; align-items: center; min-height: 44px;
          background: none; border: 0; padding: 0; color: var(--ink);
        }
        .nx-links { display: flex; gap: 6px; flex: 1; }
        .nx-links button {
          position: relative; background: none; border: 0; padding: 8px 10px;
          font-size: 16px; font-weight: 600; color: var(--ink-2);
          transition: color 150ms ease;
        }
        /* A highlighter stroke that sweeps under the link. */
        .nx-links button::before {
          content: ''; position: absolute; left: 6px; right: 6px; bottom: 8px; height: 9px; z-index: -1;
          background: var(--yellow); transform: scaleX(0); transform-origin: left;
          transition: transform 280ms var(--ease-out);
        }
        .nx-links button { isolation: isolate; }
        .nx-links button:hover, .nx-links button[aria-current="page"] { color: var(--ink); }
        .nx-links button:hover::before, .nx-links button[aria-current="page"]::before { transform: scaleX(1); }
        .nx-right { display: flex; align-items: center; gap: 12px; }
        .nx-lang { display: flex; border: 2px solid var(--ink); }
        .nx-lang button {
          min-width: 38px; height: 34px; border: 0;
          background: transparent; color: var(--ink);
          font-size: 15px; font-weight: 600;
          transition: background-color 150ms ease, color 150ms ease;
        }
        .nx-lang button + button { border-left: 2px solid var(--ink); }
        .nx-lang button:hover { background: var(--yellow); }
        .nx-lang button[aria-pressed="true"] { background: var(--ink); color: var(--paper); }
        .nx-plain {
          background: none; border: 0; font-size: 16px; font-weight: 600; color: var(--ink);
          min-height: 44px; padding: 0 8px;
          text-decoration: underline; text-decoration-thickness: 2px; text-underline-offset: 5px; text-decoration-color: transparent;
          transition: text-decoration-color 150ms ease;
        }
        .nx-plain:hover { text-decoration-color: var(--blue); }
        .nx-nav .nx-btn { min-height: 40px; padding: 0 16px; font-size: 15px; }
        .nx-burger { display: none; }
        .nx-sheet {
          position: fixed; inset: 64px 0 0 0; z-index: 99; background: var(--paper); color: var(--ink);
          display: flex; flex-direction: column; padding: 16px var(--gutter) 40px; gap: 0;
          overflow-y: auto;
        }
        .nx-sheet > button {
          text-align: left; background: none; border: 0; border-bottom: 2px solid var(--ink);
          padding: 18px 0; font-family: var(--font-display); font-weight: 800; font-stretch: 80%;
          font-size: 40px; line-height: 1; color: var(--ink);
        }
        .nx-sheet .nx-lang button { min-width: 56px; height: 44px; }
        @media (max-width: 960px) {
          .nx-links, .nx-right .nx-hide-sm { display: none; }
          .nx-nav__row { justify-content: space-between; gap: 12px; }
          .nx-burger {
            display: inline-flex; align-items: center; gap: 8px; height: 44px; padding: 0 16px;
            border: 2px solid var(--ink); background: transparent;
            color: var(--ink); font-size: 16px; font-weight: 700;
          }
        }
      `}</style>

      <nav className="nx-nav" data-scrolled={scrolled || menuOpen} aria-label="Main">
        <div className="nx-wrap nx-nav__row">
          <button className="nx-brand" onClick={() => { setPage('home'); window.scrollTo(0, 0) }} aria-label="Nexallure home">
            <Logo size={26} color="var(--ink)" />
          </button>

          <div className="nx-links">
            {links.map((link) => (
              <button
                key={link.target}
                onClick={() => go(link.target)}
                aria-current={link.path && location === link.path ? 'page' : undefined}
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="nx-right">
            <div className="nx-lang nx-hide-sm" role="group" aria-label={t.nav_lang}>
              {LANGS.map((l) => (
                <button key={l.code} aria-pressed={lang === l.code} aria-label={l.name} onClick={() => setLang(l.code)}>
                  {l.label}
                </button>
              ))}
            </div>
            {session && <NotificationFeed userId={session.user?.id} t={t} />}
            {session ? (
              <button className="nx-plain nx-hide-sm" onClick={signOut}>{t.nav_signout}</button>
            ) : (
              <button className="nx-plain nx-hide-sm" onClick={() => setPage('login')}>{t.nav_signin}</button>
            )}
            {!session && (
              <button className="nx-btn nx-btn--seal nx-hide-sm" onClick={() => setPage('register')}>
                {t.mg_blur_signup}
              </button>
            )}
            <button
              className="nx-burger"
              aria-expanded={menuOpen}
              aria-controls="nx-sheet"
              onClick={() => setMenuOpen((o) => !o)}
            >
              {menuOpen ? t.nav_close : t.nav_menu}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                {menuOpen
                  ? <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" />
                  : <path d="M2 5h12M2 11h12" stroke="currentColor" strokeWidth="1.6" />}
              </svg>
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="nx-sheet"
            className="nx-sheet"
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            exit={{ clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            {links.map((link) => (
              <button key={link.target} onClick={() => go(link.target)}>{link.label}</button>
            ))}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 32 }}>
              <div className="nx-lang" role="group" aria-label={t.nav_lang} style={{ alignSelf: 'flex-start' }}>
                {LANGS.map((l) => (
                  <button key={l.code} aria-pressed={lang === l.code} aria-label={l.name} onClick={() => setLang(l.code)} >
                    {l.label}
                  </button>
                ))}
              </div>
              {session ? (
                <button className="nx-btn nx-btn--line" onClick={signOut}>{t.nav_signout}</button>
              ) : (
                <>
                  <button className="nx-btn nx-btn--seal" onClick={() => { setMenuOpen(false); setPage('register') }}>{t.mg_blur_signup}</button>
                  <button className="nx-btn nx-btn--line" onClick={() => { setMenuOpen(false); setPage('login') }}>{t.nav_signin}</button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
