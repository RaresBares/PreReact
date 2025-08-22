import React, { useEffect, useState } from 'react'

export default function ModernNavbar() {
    const [menuOpen, setMenuOpen] = useState(false)
    const [simpleMode, setSimpleMode] = useState(false)
    const [isDesktop, setIsDesktop] = useState(() => window.matchMedia('(min-width: 992px)').matches)

    useEffect(() => {
        const mq = window.matchMedia('(min-width: 992px)')
        const onChange = () => setIsDesktop(mq.matches)
        mq.addEventListener('change', onChange)
        onChange()
        return () => mq.removeEventListener('change', onChange)
    }, [])

    useEffect(() => {
        const toggle = () => setSimpleMode(s => !s)
        const set = (e: any) => setSimpleMode(!!e.detail)
        const reflect = (e: any) => setSimpleMode(!!e.detail)
        window.addEventListener('storemate:toggleSimpleMode', toggle)
        window.addEventListener('storemate:setSimpleMode', set)
        window.addEventListener('storemate:simpleModeChanged', reflect)
        return () => {
            window.removeEventListener('storemate:toggleSimpleMode', toggle)
            window.removeEventListener('storemate:setSimpleMode', set)
            window.removeEventListener('storemate:simpleModeChanged', reflect)
        }
    }, [])
    useEffect(() => {
        if (!isDesktop && simpleMode) setSimpleMode(false)
    }, [isDesktop, simpleMode])

    const closeMenu = () => setMenuOpen(false)

    const handleHoverIn = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
        const t = e.currentTarget as HTMLElement
        t.style.backgroundColor = '#52796F'
        t.style.color = '#CAD2C5'
    }
    const handleHoverOut = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
        const t = e.currentTarget as HTMLElement
        t.style.backgroundColor = 'transparent'
        t.style.color = isDesktop ? '#84A98C' : '#6c757d'
    }

    const handleLogout = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault()
        e.stopPropagation()
        try {
            await fetch('/auth/auth/logout', { method: 'POST', credentials: 'include' })
        } catch (_) {
        } finally {
            window.location.reload()
        }
    }

    return (
        <nav className="navbar navbar-expand-md px-4 navbar-dark" style={{ backgroundColor: '#2F3E46' }}>
            <div className="container-fluid">
                <a className="navbar-brand fw-semibold" href="#" style={{ color: '#CAD2C5', letterSpacing: '0.08em', fontSize: '1.25rem' }}>STORE MATE</a>

                <button
                    className="navbar-toggler border-0"
                    type="button"
                    aria-controls="navbarMenu"
                    aria-expanded={menuOpen}
                    aria-label="Toggle navigation"
                    onClick={() => setMenuOpen(o => !o)}
                >
                    <span className="navbar-toggler-icon" />
                </button>

                <div
                    id="navbarMenu"
                    className={`collapse navbar-collapse justify-content-end ${menuOpen ? 'show' : ''} d-md-flex`}
                    style={{ maxHeight: isDesktop ? 'none' : (menuOpen ? '60vh' : 0), overflow: 'hidden', transition: 'max-height .35s ease' }}
                >
                    <ul className="navbar-nav gap-2 m-0 w-100 flex-column flex-md-row align-items-stretch align-items-md-center">
                        <li className="nav-item m-0">
                            <a
                                className="nav-link px-3 py-2"
                                href="/servicepanel/"
                                style={{ color: '#84A98C', fontWeight: 500, borderRadius: '0.5rem', transition: 'background-color .3s ease, color .3s ease' }}
                                onMouseEnter={handleHoverIn}
                                onMouseLeave={handleHoverOut}
                                onClick={closeMenu}
                            >
                                Home
                            </a>
                        </li>

                        <li className="nav-item m-0">
                            <button
                                className="nav-link px-3 py-2 btn btn-link text-decoration-none"
                                style={{ color: isDesktop ? '#84A98C' : '#6c757d', fontWeight: 600, borderRadius: '0.5rem', transition: 'background-color .3s ease, color .3s ease', cursor: isDesktop ? 'pointer' : 'not-allowed' }}
                                onMouseEnter={isDesktop ? handleHoverIn : undefined}
                                onMouseLeave={isDesktop ? handleHoverOut : undefined}
                                onClick={() => {
                                    if (!isDesktop) return;
                                    window.dispatchEvent(new CustomEvent('storemate:setSimpleMode', { detail: !simpleMode }))
                                    closeMenu()
                                }}
                                title={isDesktop ? 'Simple/Extended umschalten (nur Desktop)' : 'Nur auf Desktop verfügbar'}
                                disabled={!isDesktop}
                            >
                                {simpleMode ? 'Simple' : 'Extended'}
                            </button>
                        </li>

                        <li className="nav-item m-0">
                            <button
                                className="nav-link px-3 py-2 btn btn-link text-decoration-none"
                                style={{ color: '#84A98C', fontWeight: 600, borderRadius: '0.5rem', transition: 'background-color .3s ease, color .3s ease' }}
                                onMouseEnter={handleHoverIn}
                                onMouseLeave={handleHoverOut}
                                onClick={(e) => { handleLogout(e); closeMenu() }}
                            >
                                Abmelden
                            </button>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    )
}