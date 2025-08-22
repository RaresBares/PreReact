import { Suspense, useState, useRef, useEffect } from 'react'
import ModernNavbar from './NavBar.tsx'
import SettingCard from './large_components/SettingCard.tsx'
import ElementList, { type ElementListHandle, type Item } from './large_components/ElementList.tsx'
import ElementEditCard from './large_components/ElementEditCard.tsx'
import MailingList from './large_components/MailingList.tsx'
import Protocol from './large_components/Protocol.tsx'
import QuickActions from './joker/QuickActions.tsx'

export default function PanelLayout() {
    const [editOpen, setEditOpen] = useState(false)
    const [filterOpen, setFilterOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState<Item | null>(null)
    const [activeTab, setActiveTab] = useState<'notifications' | 'protocol'>('notifications')
    const [showQuickActions, setShowQuickActions] = useState(false)
    const listRef = useRef<ElementListHandle>(null)

    const [simpleMode, setSimpleMode] = useState(false)
    const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 991.98px)').matches)
    const effectiveShowQuickActions = (isMobile || simpleMode) ? true : showQuickActions

    useEffect(() => {
        const open = () => setEditOpen(true)
        window.addEventListener('storemate:openEditCard', open)
        window.addEventListener('storemate:showEditCard', open)
        window.addEventListener('storemate:focus_editcard', open)
        return () => {
            window.removeEventListener('storemate:openEditCard', open)
            window.removeEventListener('storemate:showEditCard', open)
            window.removeEventListener('storemate:focus_editcard', open)
        }
    }, [])

    useEffect(() => {
        const mq = window.matchMedia('(max-width: 991.98px)')
        const onChange = () => setIsMobile(mq.matches)
        mq.addEventListener('change', onChange)
        onChange()
        return () => mq.removeEventListener('change', onChange)
    }, [])

    // Ensure Simple Mode is disabled on mobile (QuickActions is only mode there)
    useEffect(() => {
        if (isMobile && simpleMode) setSimpleMode(false)
    }, [isMobile, simpleMode])

    useEffect(() => {
        const toggle = () => { if (!isMobile) setSimpleMode(s => !s) }
        const set = (e: any) => { if (!isMobile) setSimpleMode(!!e.detail) }
        window.addEventListener('storemate:toggleSimpleMode', toggle)
        window.addEventListener('storemate:setSimpleMode', set)
        return () => {
            window.removeEventListener('storemate:toggleSimpleMode', toggle)
            window.removeEventListener('storemate:setSimpleMode', set)
        }
    }, [isMobile])

    useEffect(() => {
        window.dispatchEvent(new CustomEvent('storemate:simpleModeChanged', { detail: simpleMode }))
    }, [simpleMode])

    function createItemFromBarcode(code: string): Item {
        const id = Number.parseInt(code, 10) || 0;
        const now = new Date().toISOString();
        return {
            id,
            name: `Artikel #${code}`,
            amount: 0,
            min: 0,
            max: 0,
            createdAt: now,
            category: 'Unbekannt',
            expiry: now,
        };
    }

    const handleItemClick = (id: number) => {
        const item = listRef.current?.getItemById(id)
        if (item) {
            setSelectedItem(item)
            setEditOpen(true)
        }
    }

    const handleSaveSuccess = () => {
        if (selectedItem) {
            listRef.current?.updateItem(selectedItem.id, selectedItem)
        }
    }

    return (
        <div className="vh-100 vw-100 d-flex flex-column bg-dark text-white overflow-hidden">
            <ModernNavbar />
            <div className="container-fluid flex-grow-1 py-3 overflow-hidden">
                <div className="row h-100 g-3">

                    <div className={`${simpleMode ? 'col-12' : 'col-12 col-lg-6'} d-flex flex-column h-100 gap-3 overflow-hidden`}>
                        <div className="card military-card bg-success bg-opacity-75 text-white d-flex flex-column flex-grow-1 overflow-hidden p-4">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                {!effectiveShowQuickActions && (
                                    <div className="btn-group rounded-pill bg-dark bg-opacity-25 p-1 shadow-sm">
                                        <button
                                            className={`btn btn-sm rounded-pill px-3 fw-semibold ${activeTab === 'notifications' ? 'btn-light text-dark' : 'btn-outline-light'}`}
                                            onClick={() => setActiveTab('notifications')}
                                        >📬 Notifications</button>
                                        <button
                                            className={`btn btn-sm rounded-pill px-3 fw-semibold ${activeTab === 'protocol' ? 'btn-light text-dark' : 'btn-outline-light'}`}
                                            onClick={() => setActiveTab('protocol')}
                                        >📜 Protokoll</button>
                                    </div>
                                )}
                                <button
                                    className={`btn btn-sm rounded-circle ms-auto ${effectiveShowQuickActions ? 'btn-light text-dark' : 'btn-outline-light text-white'}`}
                                    onClick={() => { if (!isMobile) setShowQuickActions(f => !f) }}
                                    style={{ width: 32, height: 32, padding: 0 }}
                                    title={isMobile ? 'Schnellaktionen sind auf Mobilgeräten immer aktiv' : 'Schnellaktionen'}
                                >
                                    ⚡
                                </button>
                            </div>
                            <div className="flex-grow-1 overflow-auto" style={{ height: 0, backgroundColor: 'transparent', boxShadow: 'none', borderRadius: '1rem' }}>
                                {effectiveShowQuickActions ? (
                                    <QuickActions
                                        onSelectItem={(barcode) => {
                                            const item = createItemFromBarcode(barcode);
                                            setSelectedItem(item);
                                            setEditOpen(true);
                                        }}
                                    />
                                ) : activeTab === 'notifications'
                                    ? <MailingList />
                                    : <Protocol />}
                            </div>
                        </div>

                        <div
                            className="card military-card bg-success bg-opacity-50 text-white text-start p-0 flex-fill position-relative"
                            style={{ transition: 'max-height 0.5s ease', maxHeight: editOpen ? '50vh' : '4.5rem', overflow: editOpen ? 'visible' : 'hidden' }}
                        >
                            <div className="d-flex justify-content-between align-items-center p-3" style={{ minHeight: '4.5rem' }}>
                                <h5 className="mb-0 fw-bold text-white">📝 Element bearbeiten</h5>
                                <button
                                    className="btn btn-sm btn-outline-light rounded-pill px-3 py-1"
                                    onClick={() => setEditOpen(prev => !prev)}
                                >{editOpen ? 'Zuklappen' : 'Aufklappen'}</button>
                            </div>
                            <div
                                className="px-4 pt-1 pb-4"
                                style={{ opacity: editOpen ? 1 : 0, transition: 'opacity 0.5s ease', pointerEvents: editOpen ? 'auto' : 'none', zIndex: editOpen ? 10 : 'auto' }}
                            >
                                <ElementEditCard selectedItem={selectedItem} onSaveSuccess={handleSaveSuccess} />
                            </div>
                        </div>
                    </div>

                    <div className="col-12 col-lg-6 d-flex flex-column h-100 gap-3 overflow-hidden" style={{ display: simpleMode ? 'none' : 'flex' }}>
                        <div
                            className="card military-card bg-success bg-opacity-50 text-white text-start p-0 position-relative"
                            style={{ transition: 'max-height 0.5s ease', maxHeight: filterOpen ? '50vh' : '4.5rem', overflow: filterOpen ? 'visible' : 'hidden', flexShrink: 0 }}
                        >
                            <div className="d-flex justify-content-between align-items-center p-3" style={{ minHeight: '4.5rem' }}>
                                <h5 className="mb-0 fw-bold text-white">🧃 Suchfilter</h5>
                                <button
                                    className="btn btn-sm btn-outline-light rounded-pill px-3 py-1"
                                    onClick={() => setFilterOpen(prev => !prev)}
                                >{filterOpen ? 'Zuklappen' : 'Aufklappen'}</button>
                            </div>
                            <div
                                className="px-4 pt-1 pb-4"
                                style={{ opacity: filterOpen ? 1 : 0, transition: 'opacity 0.5s ease', pointerEvents: filterOpen ? 'auto' : 'none', zIndex: filterOpen ? 10 : 'auto' }}
                            >
                                <SettingCard onSearch={(filters) => listRef.current?.applyFilters(filters)} />
                            </div>
                        </div>

                        <div className="card military-card bg-success bg-opacity-50 p-3 d-flex flex-column flex-grow-1 overflow-hidden" style={{ minHeight: 0 }}>
                            <div className="flex-grow-1 overflow-auto">
                                <Suspense fallback={<p className="text-white">Loading...</p>}>
                                    <ElementList ref={listRef} onItemClick={handleItemClick} />
                                </Suspense>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .military-card {
                    border-radius: 1rem;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                    transition: all 0.3s ease;
                }
                .military-card:hover {
                    box-shadow: 0 6px 25px rgba(0,0,0,0.4);
                    transform: translateY(-2px);
                }
                body {
                    overflow: hidden;
                }
            `}</style>
        </div>
    )
}