import {
    useState,
    useEffect,
    useImperativeHandle,
    forwardRef,
    useRef,
    type ForwardRefRenderFunction
} from 'react'

const INVENTORY_ENDPOINT = `${(import.meta as any)?.env?.VITE_API_BASE ?? ''}/api/storemate/inventory/`;

export type Item = {
    id: number
    category: string
    name: string
    amount: number
    min: number
    max: number
    expiry: string
    createdAt?: string
    barcode?: string
    description?: string
    shelf?: string
}

export type ElementListHandle = {
    getItemById: (id: number) => Item | undefined
    updateItem: (id: number, newData: Partial<Item>) => void
    applyFilters: (filters: Record<string, any>) => void
}

type ElementListProps = {
    onItemClick?: (id: number) => void
}

async function fetchInfo(filters?: Record<string, any>): Promise<Item[]> {
    const hasFilters = !!filters && Object.entries(filters)
        .some(([_, v]) => v !== undefined && v !== null && String(v).trim() !== '');

    const url = new URL(INVENTORY_ENDPOINT, window.location.origin);
    if (hasFilters) {
        url.searchParams.set('filter', 'true');
        Object.entries(filters as Record<string, any>).forEach(([k, v]) => {
            if (v !== undefined && v !== null && String(v).trim() !== '') {
                url.searchParams.set(k, String(v));
            }
        });
    }

    url.searchParams.set('_ts', String(Date.now()));

    const res = await fetch(url.toString(), { method: 'GET', credentials: 'include', cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } });
    if (!res.ok) {
        throw new Error(`Inventory request failed: ${res.status}`);
    }

    const raw = await res.json();
    console.log('[ElementList] raw fetch:', raw);
    const normalized: Item[] = (Array.isArray(raw) ? raw : []).map((d: any) => ({
        id: Number(d.id ?? 0),
        category: String(d.category ?? d.cat ?? ''),
        name: String(d.name ?? d.title ?? ''),
        amount: Number(d.amount ?? d.quantity ?? d.qty ?? 0),
        min: Number(d.min ?? d.lower_bound ?? d.min_amount ?? 0),
        max: Number(d.max ?? d.upper_bound ?? d.max_amount ?? 0),
        expiry: String(d.expiry ?? d.expiration ?? d.expiry_date ?? d.expiration_date ?? d.exp_date ?? ''),
        createdAt: String(d.createdAt ?? d.created_at ?? ''),
        barcode: d.barcode != null ? String(d.barcode) : undefined,
        description: d.description != null ? String(d.description) : (d.desc != null ? String(d.desc) : undefined),
        shelf: d.shelf != null ? String(d.shelf) : (d.shelf_id != null ? String(d.shelf_id) : undefined),
    }));
    console.log('[ElementList] normalized:', normalized);
    return normalized;
}

const ElementList: ForwardRefRenderFunction<ElementListHandle, ElementListProps> = (props, ref) => {
    const [items, setItems] = useState<Item[]>([])
    const [loading, setLoading] = useState(true)
    const [categoryFilter, setCategoryFilter] = useState('all')
    const lastFiltersRef = useRef<Record<string, any> | undefined>(undefined)

    useEffect(() => {
        lastFiltersRef.current = undefined
        setLoading(true)
        fetchInfo()
            .then(data => setItems(data))
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => {
        function onUpdate(e?: Event) {
          const ev = (arguments && (arguments[0] as CustomEvent<any>)) as any
          if (ev && ev.detail && (ev.detail.id || ev.detail.barcode)) {
              setItems(prev => prev.filter(x =>
                  (ev.detail.id ? x.id !== ev.detail.id : true) &&
                  (ev.detail.barcode ? x.barcode !== ev.detail.barcode : true)
              ))
          }
          setLoading(true)
          fetchInfo(lastFiltersRef.current)
              .then(data => setItems(data))
              .finally(() => setLoading(false))
        }
        window.addEventListener('storemate:updateElements', onUpdate as EventListener)
        return () => window.removeEventListener('storemate:updateElements', onUpdate as EventListener)
    }, [])

    useImperativeHandle(ref, () => ({
        getItemById: id => items.find(item => item.id === id),
        updateItem: (id, newData) => {
            setItems(prev =>
                prev.map(item => (item.id === id ? { ...item, ...newData } : item))
            )
        },
        applyFilters: filters => {
            lastFiltersRef.current = filters
            setLoading(true)
            fetchInfo(filters)
                .then(data => setItems(data))
                .finally(() => setLoading(false))
        }
    }), [items])

    const visibleItems =
        categoryFilter === 'all'
            ? items
            : categoryFilter === 'existent'
                ? items.filter(item => item.amount > 0)
                : items.filter(item => item.category === categoryFilter)

    return (
        <div className="h-100 d-flex flex-column px-3 py-2">
            <div className="d-flex flex-wrap gap-2 mb-3">
                {['all', 'existent', 'A', 'B'].map(cat => (
                    <button
                        key={cat}
                        className={`btn btn-sm ${categoryFilter === cat ? 'btn-success text-white' : 'btn-outline-success'} rounded-pill px-3 py-1 shadow`}
                        onClick={() => setCategoryFilter(cat)}
                    >
                        {cat === 'all' ? 'Alle' : cat === 'existent' ? 'Existent' : `Kategorie ${cat}`}
                    </button>
                ))}
            </div>

            <div className="flex-grow-1 overflow-auto">
                {loading ? (
                    <div className="d-flex justify-content-center align-items-center h-100">
                        <div className="spinner-border text-success" role="status" />
                    </div>
                ) : visibleItems.length === 0 ? (
                    <p className="text-white small opacity-50 text-center mt-4">Keine Elemente gefunden</p>
                ) : (
                    <div className="list-group">
                        {visibleItems.map((item, idx) => {
                            const baseKey = item.barcode ? `bc:${item.barcode}` : ((item as any).id != null ? `id:${(item as any).id}` : undefined)
                            const safeKey = baseKey && baseKey !== 'id:0' && baseKey !== '0' ? baseKey : `row:${idx}`
                            if (!safeKey) console.warn('[ElementList] item key is empty for item:', item)
                            return (
                            <div
                                key={safeKey}
                                className="list-group-item list-group-item-action border-success d-flex justify-content-between align-items-center mb-2 shadow-sm rounded"
                                style={{
                                    backgroundColor: '#103d28',
                                    color: 'white',
                                    border: '1px solid #2fbf71',
                                    transition: 'background-color 0.2s ease',
                                    cursor: 'pointer',
                                    padding: '0.75rem 1rem'
                                }}
                                onClick={(e) => {
                                  props.onItemClick?.(item.id)

                                  try {
                                    e.currentTarget.animate(
                                      [
                                        { transform: 'scale(1)',   filter: 'brightness(1)' },
                                        { transform: 'scale(1.02)', filter: 'brightness(1.05)' },
                                        { transform: 'scale(1)',   filter: 'brightness(1)' }
                                      ],
                                      { duration: 250, easing: 'ease' }
                                    )
                                  } catch{}

                                  console.log('[ElementList] clicked item:', item)

                                  const detail = {
                                    id: item.id,
                                    category: item.category,
                                    name: item.name,
                                    barcode: item.barcode ?? '',
                                    amount: item.amount,
                                    min: item.min,
                                    max: item.max,
                                    expiry: item.expiry,
                                    createdAt: item.createdAt ?? '',
                                    shelf: item.shelf && item.shelf !== 'null' ? item.shelf : '',
                                    description: item.description && item.description !== 'null' ? item.description : ''
                                  }
                                  console.log('[ElementList] dispatch detail:', detail)
                                  window.dispatchEvent(new CustomEvent('storemate:setEditCard', { detail }))

                                  window.dispatchEvent(new CustomEvent('storemate:openEditCard'))
                                  window.dispatchEvent(new CustomEvent('storemate:showEditCard'))
                                }}                                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#165534')}
                                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#103d28')}
                            >
                                <div style={{ flex: 2 }}>{item.name}</div>
                                <div style={{ flex: 1, textAlign: 'center' }}>Menge: {item.amount}</div>
                                <div style={{ flex: 1, textAlign: 'center' }}>Min: {item.min}</div>
                                <div style={{ flex: 1, textAlign: 'center' }}>Max: {item.max}</div>
                                <div style={{ flex: 1, textAlign: 'end' }} className="text-muted small">
                                    {item.expiry}
                                </div>
                            </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}

export default forwardRef(ElementList)
