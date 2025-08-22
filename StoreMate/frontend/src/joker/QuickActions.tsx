import React, { useState } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css'

const API_BASE = (import.meta as any)?.env?.VITE_API_BASE ?? ''

function normalizeServerItem(d: any) {
  return {
    id: d.id != null ? Number(d.id) : undefined,
    barcode: d.barcode != null ? String(d.barcode) : undefined,
    name: d.name != null ? String(d.name) : '',
    amount: d.quantity != null ? Number(d.quantity) : (d.qty != null ? Number(d.qty) : (d.amount != null ? Number(d.amount) : 0)),
    min: d.lower_bound != null ? Number(d.lower_bound) : (d.min_amount != null ? Number(d.min_amount) : (d.min != null ? Number(d.min) : 0)),
    max: d.upper_bound != null ? Number(d.upper_bound) : (d.max_amount != null ? Number(d.max_amount) : (d.max != null ? Number(d.max) : 0)),
    expiry: d.exp_date ?? d.expiry_date ?? d.expiration_date ?? d.expiry ?? d.expiration ?? '',
    createdAt: d.created_at ?? d.createdAt ?? '',
    shelf: d.shelf_id ?? d.shelf ?? '',
    description: d.description ?? d.desc ?? '',
    category: d.category ?? d.cat ?? '',
  }
}

function upsertIntoListAndOpenCard(item: any) {
  const detail = normalizeServerItem(item)
  console.groupCollapsed('[QuickActions] setEditCard from server action')
  console.log('server item (raw):', item)
  console.log('detail used to set EditCard (normalized):', detail)
  console.groupEnd()
  window.dispatchEvent(new CustomEvent('storemate:inventory-upsert', { detail }))
  window.dispatchEvent(new CustomEvent('storemate:setEditCard', { detail }))
  window.dispatchEvent(new CustomEvent('storemate:openEditCard'))
  window.dispatchEvent(new CustomEvent('storemate:showEditCard'))
}

type Mode = 'scan' | 'consume' | 'search' | null

interface QuickActionsProps {
    onSelectItem: (itemId: string) => void
}

export default function QuickActions({ onSelectItem }: QuickActionsProps) {
    const [mode, setMode] = useState<Mode>(null)
    const [barcode, setBarcode] = useState<string>('')

    const scan = async (code: string): Promise<void> => {
        try {
            const url = new URL(`${API_BASE}/api/storemate/inventory/quick/scan`, window.location.origin)
            url.searchParams.set('barcode', code)
            const res = await fetch(url.toString(), { method: 'POST', credentials: 'include' })
            if (!res.ok) throw new Error(`scan failed: ${res.status}`)
            let payload: any = null
            try { payload = await res.json() } catch {}
            if (payload) upsertIntoListAndOpenCard(payload)
            window.dispatchEvent(new CustomEvent('storemate:barcode-search', {
                detail: { barcode: code, instant_submit: true }
            }))
        } catch (e) {
            console.error('scan failed', e)
        }
    }

    const consume = async (code: string): Promise<void> => {
        try {
            const url = new URL(`${API_BASE}/api/storemate/inventory/quick/consume`, window.location.origin)
            url.searchParams.set('barcode', code)
            const res = await fetch(url.toString(), { method: 'POST', credentials: 'include' })
            if (!res.ok) throw new Error(`consume failed: ${res.status}`)
            let payload: any = null
            try { payload = await res.json() } catch {}
            if (payload) upsertIntoListAndOpenCard(payload)
            window.dispatchEvent(new CustomEvent('storemate:barcode-search', {
                detail: { barcode: code, instant_submit: true }
            }))
        } catch (e) {
            console.error('consume failed', e)
        }
    }

    const search = async (code: string): Promise<void> => {
        try {
            window.dispatchEvent(new CustomEvent('storemate:focus_editcard', { detail: { barcode: code} }))
        } catch (e) {
            console.error('search event failed', e)
        }
    }

    const handleSubmit = async (): Promise<void> => {
        if (!barcode.trim()) return
        const code = barcode.trim()
        if (mode === 'scan') {
            await scan(code)
            onSelectItem(code)
            setBarcode('')
            return
        }
        if (mode === 'consume') {
            await consume(code)
            onSelectItem(code)
            setBarcode('')
            return
        }
        if (mode === 'search') {
            await search(code)
            onSelectItem(code)
            setBarcode('')
            setMode(null)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
        if (e.key === 'Enter') {
            e.preventDefault()
            handleSubmit()
        }
    }

    return (
        <div className="quick-actions-panel d-flex flex-column justify-content-center rounded h-100">
            {mode ? (
                <div className="mode-container d-flex flex-column p-3">
                    <input
                        type="text"
                        className="form-control mb-3"
                        placeholder="Eingabe..."
                        value={barcode}
                        onChange={e => setBarcode(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoFocus
                    />
                    <div className="d-flex gap-2">
                        <button
                            className="btn btn-outline-secondary flex-fill"
                            onClick={() => { setMode(null); setBarcode('') }}
                        >Abbrechen</button>
                        <button
                            className="btn btn-primary flex-fill"
                            onClick={handleSubmit}
                        >Senden</button>
                    </div>
                </div>
            ) : (
                <div className="button-container d-flex justify-content-center align-items-center gap-2">
                    <button
                        className="quick-action-button"
                        onClick={() => setMode('scan')}
                    >🔍 Scan</button>
                    <button
                        className="quick-action-button text-dark"
                        onClick={() => setMode('consume')}
                    >🍽️ Consume</button>
                    <button
                        className="quick-action-button"
                        onClick={() => setMode('search')}
                    >🔎 Search</button>
                </div>
            )}

            <style>{`
                .quick-actions-panel {
                    background-color: transparent !important;
                    box-shadow: 0 10px 30px rgba(0, 128, 64, 0.3);
                    overflow: hidden;
                    padding: 1rem;
                }
                .button-container {
                    flex: none;
                    padding: 1rem;
                    background: transparent;
                }
                .mode-container {
                    background: transparent;
                }
                .quick-action-button {
                    flex: 1;
                    padding: 0.8rem;
                    border-radius: 0.75rem;
                    font-size: 1rem;
                    font-weight: bold;
                    border: none;
                    background-color: #28a745;
                    color: white;
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
                    transition: transform 0.2s ease, box-shadow 0.3s ease;
                }
                .quick-action-button:hover {
                    transform: scale(1.05);
                    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5);
                }
                .quick-action-button:active {
                    transform: scale(0.95);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
                }
            `}</style>
        </div>
    )
}