import { useState, useEffect } from 'react'

type Props = {
    onSearch?: (filters: Record<string, string>) => void
}

type BarcodeEventDetail = {
    barcode?: string
    instant_submit?: boolean
}

export default function SettingCard({ onSearch }: Props) {
    const [name, setName] = useState('')
    const [shelf, setShelf] = useState('')
    const [barcode, setBarcode] = useState('')
    const [min, setMin] = useState('')
    const [max, setMax] = useState('')
    const [expires, setExpires] = useState('')
    const [expired, setExpired] = useState(false)

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        onSearch?.({
            name,
            shelf,
            barcode,
            min,
            max,
            expires,
            expired: expired ? '1' : '0',
        })
    }

    const handleReset = () => {
        setName('')
        setShelf('')
        setBarcode('')
        setMin('')
        setMax('')
        setExpires('')
        setExpired(false)
        onSearch?.({})
    }

    useEffect(() => {
        function onBarcodeSearch(evt: Event) {
            const ev = evt as CustomEvent<{ barcode?: string; instant_submit?: boolean }>
            const bc = (ev.detail?.barcode ?? '').toString().trim()
            if (!bc) return
            // wenn Flag fehlt → default: true (sofort absenden)
            const instant = ev.detail?.instant_submit !== false

            setBarcode(bc)

            if (instant) {
                onSearch?.({
                    name,
                    shelf,
                    barcode: bc,
                    min,
                    max,
                    expires,
                    expired: expired ? '1' : '0',
                })
            }
        }
        window.addEventListener('storemate:barcode-search', onBarcodeSearch)
        return () => window.removeEventListener('storemate:barcode-search', onBarcodeSearch)
    }, [name, shelf, min, max, expires, expired, onSearch])

    return (
        <div
            className="w-100 d-flex flex-column"
            style={{
                padding: '1rem',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '1rem',
                backdropFilter: 'blur(6px)',
                border: '1px solid rgba(255, 255, 255, 0.0)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                overflow: 'hidden',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
            }}
        >
            <form className="row g-2 text-white small" onSubmit={handleSubmit}>
                <div className="col-12">
                    <label className="form-label">Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="form-control form-control-sm rounded-pill"
                        placeholder="z.B. Kühlschrank"
                    />
                </div>

                <div className="col-6">
                    <label className="form-label">Shelf</label>
                    <input
                        type="text"
                        value={shelf}
                        onChange={e => setShelf(e.target.value)}
                        className="form-control form-control-sm rounded-pill"
                        placeholder="Shelf ID"
                    />
                </div>

                <div className="col-6">
                    <label className="form-label">Barcode</label>
                    <input
                        type="text"
                        value={barcode}
                        onChange={e => setBarcode(e.target.value)}
                        className="form-control form-control-sm rounded-pill"
                        placeholder="z.B. 123456789"
                    />
                </div>

                <div className="col-4">
                    <label className="form-label">Max-Amount</label>
                    <input
                        type="number"
                        value={max}
                        onChange={e => setMax(e.target.value)}
                        className="form-control form-control-sm rounded-pill"
                        placeholder="100"
                    />
                </div>

                <div className="col-4">
                    <label className="form-label">Min-Amount</label>
                    <input
                        type="number"
                        value={min}
                        onChange={e => setMin(e.target.value)}
                        className="form-control form-control-sm rounded-pill"
                        placeholder="5"
                    />
                </div>

                <div className="col-4">
                    <label className="form-label">Expires in (Tage)</label>
                    <input
                        type="number"
                        value={expires}
                        onChange={e => setExpires(e.target.value)}
                        className="form-control form-control-sm rounded-pill"
                        placeholder="30"
                    />
                </div>

                <div className="col-12 d-flex align-items-center gap-2">
                    <label className="form-label mb-0">Abgelaufen:</label>
                    <div className="form-check form-switch m-0">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            id="expiredCheck"
                            style={{ transform: 'scale(1.2)' }}
                            checked={expired}
                            onChange={e => setExpired(e.target.checked)}
                        />
                    </div>
                </div>

                <div className="col-12 d-flex justify-content-end gap-2 mt-2">
                    <button
                        type="button"
                        onClick={handleReset}
                        className="btn fancy-reset btn-outline-light btn-sm rounded-pill px-3 position-relative overflow-hidden text-white"
                    >
                        <span className="btn-text">Reset</span>
                        <span className="btn-icon">🔄</span>
                    </button>

                    <button
                        type="submit"
                        className="btn fancy-search btn-light btn-sm rounded-pill px-3 position-relative overflow-hidden text-dark"
                    >
                        <span className="btn-text">Suchen</span>
                        <span className="btn-icon">🔍</span>
                    </button>
                </div>
            </form>
        </div>
    )
}