'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const links = [
    { href: '/',          label: 'Overview'  },
    { href: '/charts',    label: 'Analytics' },
    { href: '/machines',  label: 'Machines'  },
    { href: '/pipeline',  label: 'Pipeline'  },
  ]

  return (
    <nav className="navbar" style={{ boxShadow: scrolled ? '0 4px 24px rgba(0,0,0,0.4)' : 'none' }}>
      <div className="container navbar-inner">
        <Link href="/" className="navbar-logo">
          <div className="logo-icon">🏭</div>
          FactoryPulse
          <span className="navbar-badge">Live</span>
        </Link>
        <ul className="navbar-links">
          {links.map(l => (
            <li key={l.href}>
              <Link href={l.href} className={pathname === l.href ? 'active' : ''}>
                {l.label}
              </Link>
            </li>
          ))}
          <li>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              GitHub ↗
            </a>
          </li>
        </ul>
      </div>
    </nav>
  )
}
