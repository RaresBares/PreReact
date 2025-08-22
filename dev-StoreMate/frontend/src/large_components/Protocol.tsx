import { useEffect, useState } from 'react'

type ProtocolEntry = {
    id: number
    timestamp: string
    description: string
    details: string
    action?: string
    barcode?: string
}


function minutesDiffFromNow(whenIso: string): number {
    const d = new Date(whenIso)
    const ms = Date.now() - d.getTime()
    return Math.max(0, Math.floor(ms / 60000))
}

function humanizeWhen(whenIso: string): string {
    const mins = minutesDiffFromNow(whenIso)
    if (mins < 15) {
        if (mins <= 1) return 'vor 1 Minute'
        return `vor ${mins} Minuten`
    }
    const d = new Date(whenIso)
    if (isNaN(d.getTime())) return String(whenIso)
    return d.toLocaleString('de-CH', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

async function fetchEntries(count: number): Promise<ProtocolEntry[]> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    try {
        const res = await fetch(`/api/logs/last?n=${count}`, { signal: controller.signal })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        return (Array.isArray(data) ? data : []).map((log: any, i: number) => {
            const created = log.created_at || log.timestamp || log.time || log.createdAt || new Date().toISOString()
            const iso = new Date(created).toISOString()
            return {
                id: Number(log.id) || i + 1,
                timestamp: iso,
                description: String(log.description || log.message || ''),
                details: String(log.details || log.meta || log.payload || ''),
                action: String(log.action || log.event || ''),
                barcode: log.barcode ? String(log.barcode) : undefined,
            } as ProtocolEntry
        })
    } finally {
        clearTimeout(timeout)
    }
}


export default function Protocol() {
    const [entries, setEntries] = useState<ProtocolEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let mounted = true
        setLoading(true)
        setError(null)
        fetchEntries(50)
            .then((rows) => { if (mounted) setEntries(rows) })
            .catch((e) => { if (mounted) setError(e instanceof Error ? e.message : 'Fehler') })
            .finally(() => { if (mounted) setLoading(false) })
        return () => { mounted = false }
    }, [])

    return (
        <div className="d-flex flex-column h-100">
            {/* Scrollbarer Bereich, füllt die gesamte Card-Höhe aus */}
            <div className="flex-grow-1 overflow-auto px-3 py-2">
                {error && (
                    <div className="alert alert-danger py-2 small" role="alert">
                        Fehler beim Laden der Protokolle: {error}
                    </div>
                )}
                {loading ? (
                    <div className="d-flex justify-content-center align-items-center h-100">
                        <div className="spinner-border text-light" role="status" />
                    </div>
                ) : entries.length === 0 ? (
                    <p className="text-white text-center small opacity-50">
                        Keine Protokolleinträge
                    </p>
                ) : (
                    entries.map((entry) => (
                        <div
                            key={entry.id}
                            role="button"
                            tabIndex={0}
                            aria-label={`Protokolleintrag ${entry.action || ''} ${entry.barcode || ''}`}
                            className="d-flex mb-2 p-3 rounded-3 shadow-sm"
                            style={{
                                background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
                                border: '1px solid rgba(255,255,255,0.10)',
                                backdropFilter: 'blur(4px)',
                                transition: 'transform .15s ease, box-shadow .2s ease, background-color .2s ease, border-color .2s ease',
                                cursor: 'pointer',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)'
                                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.25)'
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'
                                e.currentTarget.style.background = 'linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.05))'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)'
                                e.currentTarget.style.boxShadow = ''
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'
                                e.currentTarget.style.background = 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))'
                            }}
                            onFocus={(e) => {
                                e.currentTarget.style.boxShadow = '0 0 0 0.25rem rgba(25,135,84,0.25)'
                                e.currentTarget.style.borderColor = 'rgba(25,135,84,0.45)'
                            }}
                            onBlur={(e) => {
                                e.currentTarget.style.boxShadow = ''
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'
                            }}
                            onClick={() => {
                                const evt = new CustomEvent('storemate:focus_editcard', {
                                    detail: { barcode: entry.barcode },
                                })
                                window.dispatchEvent(evt)
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault()
                                    const evt = new CustomEvent('storemate:focus_editcard', {
                                        detail: { barcode: entry.barcode },
                                    })
                                    window.dispatchEvent(evt)
                                }
                            }}
                        >
                            <div className="flex-grow-1 d-flex flex-column">
                                <div className="d-flex align-items-center gap-3 flex-wrap">
                                    <div
                                        className="text-muted small"
                                        style={{ flex: '0 0 auto', opacity: 0.85 }}
                                        title={new Date(entry.timestamp).toString()}
                                    >
                                        {humanizeWhen(entry.timestamp)}
                                    </div>
                                    {entry.action && (
                                        <span className="badge rounded-pill border" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
                                            {entry.action}
                                        </span>
                                    )}
                                    {entry.barcode && (
                                        <code className="small" style={{ userSelect: 'text' }}>{entry.barcode}</code>
                                    )}
                                </div>
                                {entry.description && (
                                    <div className="small text-secondary mt-1" style={{ opacity: 0.8 }}>
                                        {entry.description}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
