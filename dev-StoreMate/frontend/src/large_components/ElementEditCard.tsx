import { useState, useEffect, useRef } from 'react'
import type { Item } from './ElementList.tsx'

const API_BASE = (import.meta as any)?.env?.VITE_API_BASE ?? ''

const isNil = (v: any) => v === undefined || v === null || v === ''
const filledCount = (o: any, keys: string[]) => keys.reduce((n, k) => n + (isNil(o?.[k]) ? 0 : 1), 0)

function dispatchUpdate() {
    window.dispatchEvent(new CustomEvent('storemate:updateElements'))
}

async function apiAdjustAmount(barcode: string, delta: number) {
    const u = new URL(`${API_BASE}/api/inventory/adjust_amount`, window.location.origin)
    u.searchParams.set('barcode', barcode)
    u.searchParams.set('delta', String(delta))
    const res = await fetch(u.toString(), { method: 'POST', credentials: 'include' })
    if (!res.ok) throw new Error(`adjust failed ${res.status}`)
    return res.json()
}

async function apiUpdateMeta(barcode: string, body: Record<string, any>) {
    const u = new URL(`${API_BASE}/api/inventory/update_metadata/${encodeURIComponent(barcode)}`, window.location.origin)
    const res = await fetch(u.toString(), {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`update meta failed ${res.status}`)
    return res.json()
}

async function apiDeleteItem(barcode: string) {
    const u = new URL(`${API_BASE}/api/inventory/delete_item/${encodeURIComponent(barcode)}`, window.location.origin)
    const res = await fetch(u.toString(), { method: 'DELETE', credentials: 'include' })
    if (!res.ok) throw new Error(`delete failed ${res.status}`)
    return res.json()
}

async function apiGetItemInfo(barcode: string) {
    const u = new URL(`${API_BASE}/api/inventory/get_item_info/${encodeURIComponent(barcode)}`, window.location.origin)
    const res = await fetch(u.toString(), { method: 'GET', credentials: 'include' })
    if (!res.ok) throw new Error(`get_item_info failed ${res.status}`)
    return res.json()
}

type Props = {
    selectedItem: Item | null
    onSaveSuccess: () => void
}

export default function ElementEditCard({ selectedItem: _selectedItem, onSaveSuccess }: Props) {
    const [formData, setFormData] = useState<Item | null>(null)
    const [original, setOriginal] = useState<Item | null>(null)
    const [animationKey, setAnimationKey] = useState(0)
    const containerRef = useRef<HTMLDivElement>(null)
    const lastDetailRef = useRef<any>(null)
    const lastWriteRef = useRef<{ ts: number, source: 'event' | 'prop' } | null>(null)


    useEffect(() => {
        function onSet(evt: Event) {
            const d = (evt as CustomEvent<Partial<Item>>).detail || {}
            if (!d || !(d as any).barcode) return
            lastDetailRef.current = d
            let rawAmount: any = undefined; let amountSrc: string | null = null
            if ((d as any).amount !== undefined) { rawAmount = (d as any).amount; amountSrc = 'amount' }
            else if ((d as any).qty !== undefined) { rawAmount = (d as any).qty; amountSrc = 'qty' }
            else if ((d as any).quantity !== undefined) { rawAmount = (d as any).quantity; amountSrc = 'quantity' }
            const rawMin = (d as any).min ?? (d as any).min_amount ?? (d as any).lower_bound
            const rawMax = (d as any).max ?? (d as any).max_amount ?? (d as any).upper_bound
            const rawExpiry = (d as any).expiry ?? (d as any).expiration ?? (d as any).expiry_date ?? (d as any).expiration_date ?? (d as any).exp_date
            const rawCreatedAt = (d as any).createdAt ?? (d as any).created_at
            const rawShelf = (d as any).shelf ?? (d as any).shelf_id
            const rawDesc = (d as any).description ?? (d as any).desc
            const rawCategory = (d as any).category ?? (d as any).cat
            const toNum = (v: any) => (v === '' || v === null || v === undefined ? undefined : Number(v))
            const next: Item = {
                id: (d as any).id as any ?? (formData as any)?.id,
                name: (d as any).name as any ?? (formData as any)?.name ?? '',
                barcode: String((d as any).barcode ?? (formData as any)?.barcode ?? ''),
                amount: amountSrc ? Number(rawAmount) as any : ((formData as any)?.amount ?? 0),
                min: toNum((d as any).min ?? (d as any).min_amount ?? (d as any).lower_bound) as any ?? ((formData as any)?.min ?? 0),
                max: toNum((d as any).max ?? (d as any).max_amount ?? (d as any).upper_bound) as any ?? ((formData as any)?.max ?? 0),
                expiry: (rawExpiry) ?? ((formData as any)?.expiry ?? ''),
                createdAt: (rawCreatedAt) ?? ((formData as any)?.createdAt ?? ''),
                shelf: (rawShelf) ?? ((formData as any)?.shelf ?? ''),
                description: (rawDesc) ?? ((formData as any)?.description ?? ''),
                category: (rawCategory) ?? ((formData as any)?.category ?? ''),
            }
            lastWriteRef.current = { ts: Date.now(), source: 'event' }
            setFormData(next)
            setAnimationKey(k => k + 1)
            setOriginal(prev => {
                if (!prev || (prev as any).barcode !== (next as any).barcode) return { ...next }
                return prev
            })
        }
        window.addEventListener('storemate:setEditCard', onSet)
        return () => window.removeEventListener('storemate:setEditCard', onSet)
    }, [formData])

    useEffect(() => {
        async function onFocus(evt: Event) {
            const detail = (evt as CustomEvent<{ barcode?: string }>).detail || {}
            const bc = detail.barcode ? String(detail.barcode) : ''
            if (!bc) return
            try {
                const data = await apiGetItemInfo(bc)
                const toNum = (v: any) => (v === '' || v === null || v === undefined ? undefined : Number(v))
                const next: Item = {
                    id: (data as any).id as any ?? (formData as any)?.id,
                    name: (data as any).name ?? (formData as any)?.name ?? '',
                    barcode: String((data as any).barcode ?? bc),
                    amount: toNum((data as any).amount ?? (data as any).quantity) as any ?? ((formData as any)?.amount ?? 0),
                    min: toNum((data as any).min ?? (data as any).lower_bound) as any ?? ((formData as any)?.min ?? 0),
                    max: toNum((data as any).max ?? (data as any).upper_bound) as any ?? ((formData as any)?.max ?? 0),
                    expiry: (data as any).expiry ?? (data as any).exp_date ?? (formData as any)?.expiry ?? '',
                    createdAt: (data as any).createdAt ?? (data as any).created_at ?? (formData as any)?.createdAt ?? '',
                    shelf: (data as any).shelf ?? (data as any).shelf_id ?? (formData as any)?.shelf ?? '',
                    description: (data as any).description ?? (formData as any)?.description ?? '',
                    category: (data as any).category ?? (formData as any)?.category ?? '',
                }
                lastWriteRef.current = { ts: Date.now(), source: 'event' }
                setFormData(next)
                setAnimationKey(k => k + 1)
                setOriginal(prev => {
                    if (!prev || (prev as any).barcode !== (next as any).barcode) return { ...next }
                    return prev
                })
                window.dispatchEvent(new CustomEvent('storemate:openEditCard'))
                window.dispatchEvent(new CustomEvent('storemate:showEditCard'))
            } catch (e: any) {
                const msg = String(e?.message || '')
                if (msg.includes('404') || msg.includes('Item nicht gefunden')) {
                    window.dispatchEvent(new CustomEvent('storemate:clearEditCard'))
                }
            }
        }
        window.addEventListener('storemate:focus_editcard', onFocus as EventListener)
        return () => window.removeEventListener('storemate:focus_editcard', onFocus as EventListener)
    }, [formData])

    useEffect(() => {
        function onClear() {
            try { (document.activeElement as HTMLElement | null)?.blur() } catch {}
            lastDetailRef.current = null
            lastWriteRef.current = null
            setFormData(null)
            setOriginal(null)
            setAnimationKey(k => k + 1)
        }
        window.addEventListener('storemate:clearEditCard', onClear)
        return () => window.removeEventListener('storemate:clearEditCard', onClear)
    }, [])

    const handleChange = (field: keyof Item, value: string) => {
        if (!formData) return
        let v: any = value
        if (field === 'amount' || field === 'min' || field === 'max') v = value === '' ? '' : Number(value)
        setFormData({ ...formData, [field]: v })
    }

    const sendToServer = async (data: Item) => {
        if (!original) return
        const barcode = data.barcode
        if (!barcode) throw new Error('barcode missing')
        const current = Number(original.amount ?? 0)
        const target = Number((data as any).amount ?? 0)
        const delta = target - current
        const meta: Record<string, any> = {}
        const norm = (v: any) => (v === '' ? null : v)
        if ((data.name ?? '') !== (original.name ?? '')) meta.name = norm(data.name)
        if ((data.shelf ?? '') !== (original.shelf ?? '')) meta.shelf_id = norm(data.shelf)
        if ((data.description ?? '') !== (original.description ?? '')) meta.description = norm(data.description)
        if ((data.expiry ?? '') !== (original.expiry ?? '')) meta.exp_date = norm(data.expiry)
        const toNumOrNull = (v: any) => (v === '' || v === undefined || v === null ? null : Number(v))
        if (toNumOrNull((data as any).min) !== toNumOrNull((original as any).min)) meta.lower_bound = toNumOrNull((data as any).min)
        if (toNumOrNull((data as any).max) !== toNumOrNull((original as any).max)) meta.upper_bound = toNumOrNull((data as any).max)
        if (delta !== 0) await apiAdjustAmount(barcode, delta)
        if (Object.keys(meta).length) await apiUpdateMeta(barcode, meta)
        const upsertDetail: Partial<Item> = { ...data }
        window.dispatchEvent(new CustomEvent('storemate:inventory-upsert', { detail: upsertDetail }))
    }

    // Helper to re-fetch (refocus) the current card by barcode
    const handleRefetch = async (e?: React.MouseEvent) => {
        if (e) { e.preventDefault(); e.stopPropagation() }
        const bc = (formData as any)?.barcode
        if (!bc) return
        try {
            const data = await apiGetItemInfo(String(bc))
            const toNum = (v: any) => (v === '' || v === null || v === undefined ? undefined : Number(v))
            const next: Item = {
                id: (data as any).id as any ?? (formData as any)?.id,
                name: (data as any).name ?? (formData as any)?.name ?? '',
                barcode: String((data as any).barcode ?? bc),
                amount: toNum((data as any).amount ?? (data as any).quantity) as any ?? ((formData as any)?.amount ?? 0),
                min: toNum((data as any).min ?? (data as any).lower_bound) as any ?? ((formData as any)?.min ?? 0),
                max: toNum((data as any).max ?? (data as any).upper_bound) as any ?? ((formData as any)?.max ?? 0),
                expiry: (data as any).expiry ?? (data as any).exp_date ?? (formData as any)?.expiry ?? '',
                createdAt: (data as any).createdAt ?? (data as any).created_at ?? (formData as any)?.createdAt ?? '',
                shelf: (data as any).shelf ?? (data as any).shelf_id ?? (formData as any)?.shelf ?? '',
                description: (data as any).description ?? (formData as any)?.description ?? '',
                category: (data as any).category ?? (formData as any)?.category ?? '',
            }
            lastWriteRef.current = { ts: Date.now(), source: 'event' }
            setFormData(next)
            setAnimationKey(k => k + 1)
            setOriginal(prev => {
                if (!prev || (prev as any).barcode !== (next as any).barcode) return { ...next }
                return prev
            })
        } catch (err: any) {
            const msg = String(err?.message || '')
            if (msg.includes('404') || msg.includes('Item nicht gefunden')) {
                window.dispatchEvent(new CustomEvent('storemate:clearEditCard'))
            }
            console.error('[ElementEditCard] refetch failed', err)
        }
    }

    const handleSave = async () => {
        if (!formData) return
        await sendToServer(formData)
        dispatchUpdate()
        onSaveSuccess()
        setOriginal({ ...formData })
    }

    const handleDelete = async (e?: React.MouseEvent) => {
        if (e) { e.preventDefault(); e.stopPropagation() }
        if (!formData?.barcode) return
        await apiDeleteItem(formData.barcode)
        dispatchUpdate()
        setFormData(null)
        setOriginal(null)
    }

    const handleReset = (e?: React.MouseEvent) => {
        if (e) { e.preventDefault(); e.stopPropagation() }
        if (original) setFormData({ ...original })
    }

    if (!formData) {
        return <p className="text-light">Kein Element ausgewählt.</p>
    }

    return (
        <>
            <div
                key={animationKey}
                ref={containerRef}
                className="w-100 h-100 d-flex flex-column pulse-anim"
                style={{
                    padding: '1rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '1rem',
                    backdropFilter: 'blur(6px)',
                    border: '1px solid rgba(255, 255, 255, 0.0)',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                    overflowY: 'hidden'
                }}
            >
                <form
                    className="row g-2 text-white small"
                    onSubmit={e => { e.preventDefault(); handleSave() }}
                    onKeyDown={e => {
                        if (
                            e.key === 'Enter' &&
                            !e.shiftKey &&
                            !e.altKey &&
                            !e.ctrlKey &&
                            !e.metaKey &&
                            !(e.target as HTMLElement)?.closest('textarea')
                        ) {
                            e.preventDefault()
                            handleSave()
                        }
                    }}
                >
                    <div className="col-12">
                        <label className="form-label">Name</label>
                        <input type="text" className="form-control form-control-sm rounded-pill" value={(formData as any).name} onChange={e => handleChange('name', e.target.value)} />
                    </div>
                    <div className="col-4">
                        <label className="form-label">Anzahl</label>
                        <input type="text" className="form-control form-control-sm rounded-pill" value={(formData as any).amount} onChange={e => handleChange('amount', e.target.value)} />
                    </div>
                    <div className="col-4">
                        <label className="form-label">Shelf_id</label>
                        <input type="text" className="form-control form-control-sm rounded-pill" value={(formData as any).shelf} onChange={e => handleChange('shelf', e.target.value)} />
                    </div>
                    <div className="col-4">
                        <label className="form-label">Barcode</label>
                        <input
                            type="text"
                            className="form-control form-control-sm rounded-pill bg-secondary text-light"
                            value={(formData as any).barcode}
                            disabled
                            readOnly
                            aria-readonly="true"
                            title="Barcode ist schreibgeschützt"
                        />
                    </div>
                    <div className="col-4">
                        <label className="form-label">Upper Bound</label>
                        <input type="text" className="form-control form-control-sm rounded-pill" value={(formData as any).max} onChange={e => handleChange('max', e.target.value)} />
                    </div>
                    <div className="col-4">
                        <label className="form-label">Lower Bound</label>
                        <input type="text" className="form-control form-control-sm rounded-pill" value={(formData as any).min} onChange={e => handleChange('min', e.target.value)} />
                    </div>
                    <div className="col-4">
                        <label className="form-label">Expiry Date</label>
                        <input type="text" className="form-control form-control-sm rounded-pill" value={(formData as any).expiry} onChange={e => handleChange('expiry', e.target.value)} />
                    </div>
                    <div className="col-6">
                        <label className="form-label">Created At</label>
                        <input type="text" className="form-control form-control-sm rounded-pill" value={(formData as any).createdAt} onChange={e => handleChange('createdAt', e.target.value)} />
                    </div>
                    <div className="col-6">
                        <label className="form-label">Beschreibung</label>
                        <input type="text" className="form-control form-control-sm rounded-pill" value={(formData as any).description} onChange={e => handleChange('description', e.target.value)} />
                    </div>
                    <div className="col-12 d-flex justify-content-end gap-2 mt-2" style={{ paddingTop: '1rem' }}>
                        <button className="btn fancy-delete btn-danger btn-sm rounded-pill px-3 text-white position-relative overflow-hidden" onClick={(e)=>handleDelete(e)}>
                            <span className="btn-text">Löschen</span>
                            <span className="btn-icon">🗑️</span>
                        </button>
                        <button type="button" className="btn fancy-reset btn-outline-light btn-sm rounded-pill px-3 position-relative overflow-hidden text-white" onClick={(e)=>handleRefetch(e)}>
                            <span className="btn-text">Reset</span>
                            <span className="btn-icon">🔄</span>
                        </button>
                        <button type="submit" className="btn fancy-save btn-light btn-sm rounded-pill px-3 position-relative overflow-hidden text-dark">
                            <span className="btn-text">Speichern</span>
                            <span className="btn-icon">💾</span>
                        </button>
                    </div>
                </form>
            </div>
            <style>{`
    .pulse-anim { animation: pulse-grow 0.3s ease; }
    @keyframes pulse-grow { 0% { transform: scale(1); filter: brightness(1); } 30% { transform: scale(1.01); filter: brightness(1.03); } 100% { transform: scale(1); filter: brightness(1); } }
`}</style>
        </>
    )
}