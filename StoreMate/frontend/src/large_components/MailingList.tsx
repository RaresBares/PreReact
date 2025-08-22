import { useEffect, useState } from 'react'

type Notification = {
    id: number
    title: string
    description: string
    date: string
}

async function fetch_notifications(signal?: AbortSignal): Promise<Notification[]> {
    const res = await fetch('/api/storemate/notification/', {
        method: 'GET',
        credentials: 'include',
        signal,
        headers: { 'Accept': 'application/json' },
    })
    if (!res.ok) {
        throw new Error(`Failed to fetch notifications: HTTP ${res.status}`)
    }
    const data = await res.json()
    // Normalize to our shape
    return (Array.isArray(data) ? data : []).map((n: any) => ({
        id: Number(n.id),
        title: String(n.title ?? ''),
        description: String(n.description ?? ''),
        date: String(n.date ?? n.created_at ?? n.timestamp ?? ''),
    }))
}

function notify_deletion(id: number): void {
    console.log(`Benachrichtigung mit ID ${id} wurde gelöscht.`)
}

export default function MailingList() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [openNotification, setOpenNotification] = useState<Notification | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const ac = new AbortController()
        setLoading(true)
        fetch_notifications(ac.signal)
            .then(data => setNotifications(data))
            .catch(err => {
                console.error('[MailingList] load notifications failed', err)
                setNotifications([])
            })
            .finally(() => setLoading(false))
        return () => ac.abort()
    }, [])

    useEffect(() => {
        if (openNotification) {
            document.body.classList.add('modal-open')
        } else {
            document.body.classList.remove('modal-open')
        }
    }, [openNotification])

    const removeNotification = (id: number) => {
        notify_deletion(id)
        setNotifications(prev => prev.filter(n => n.id !== id))
    }

    return (
        <>
            <div className="d-flex flex-column gap-2" style={{
                padding: '1rem',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '1rem',
                backdropFilter: 'blur(6px)',
                border: '1px solid rgba(255, 255, 255, 0.0)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                overflowY: 'auto',
                scrollbarGutter: 'stable both-edges',

                height: '100%'
            }}>
                {loading ? (
                    <div className="d-flex justify-content-center py-4">
                        <div className="spinner"></div>
                    </div>
                ) : notifications.length === 0 ? (
                    <p className="text-white text-center small opacity-50">Keine Benachrichtigungen</p>
                ) : (
                    notifications.map(n => (
                        <div
                            key={n.id}
                            className="notification-entry"
                            onClick={() => setOpenNotification(n)}
                        >
                            <div className="notification-date">{n.date}</div>
                            <div className="notification-title">{n.title}</div>
                            <button
                                className="btn btn-sm fancy-x shadow-sm"
                                onClick={e => {
                                    e.stopPropagation()
                                    removeNotification(n.id)
                                }}
                            >
                                ✕
                            </button>
                        </div>
                    ))
                )}
            </div>

            {openNotification && (
                <div
                    className="notification-overlay"
                    onClick={() => setOpenNotification(null)}
                >
                    <div
                        className="bg-dark text-white rounded-4 shadow-lg p-4"
                        style={{ maxWidth: '90%', width: '400px', backdropFilter: 'blur(8px)' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <h5 className="mb-2 fw-bold">{openNotification.title}</h5>
                        <p className="text-secondary small mb-2">{openNotification.date}</p>
                        <p className="mb-0">{openNotification.description}</p>
                        <div className="text-end mt-3">
                            <button
                                className="btn btn-sm btn-light rounded-pill px-3"
                                onClick={() => setOpenNotification(null)}
                            >
                                Schließen
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .notification-entry {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 1rem;
                    border-radius: 1rem;
                    background-color: rgba(255, 255, 255, 0.06);
                    backdrop-filter: blur(4px);
                    cursor: pointer;
                    transition: all 0.25s ease;
                    color: white;
                    font-size: 0.92rem;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    font-family: 'Inter', sans-serif;
                }

                .notification-entry:hover {
                    transform: translateY(-2px);
                    background-color: rgba(255, 255, 255, 0.1);
                }

                .notification-date {
                    color: #9fa7b3;
                    font-weight: 500;
                    font-size: 0.85rem;
                    flex: 0 0 40%;
                }

                .notification-title {
                    flex: 1;
                    font-size: 0.95rem;
                    font-weight: 600;
                    text-align: right;
                }

                .fancy-x {
                    margin-left: 0.75rem;
                    border: none;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                    font-size: 0.9rem;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: all 0.3s ease;
                }

                .notification-entry:hover .fancy-x {
                    opacity: 1;
                    background: rgba(255, 80, 80, 0.2);
                    color: #ffdddd;
                }

                .fancy-x:hover {
                    background: rgba(255, 80, 80, 0.3);
                    color: #ffffff;
                    box-shadow: 0 0 6px rgba(255, 100, 100, 0.5);
                }

                .spinner {
                    width: 32px;
                    height: 32px;
                    border: 4px solid rgba(255,255,255,0.15);
                    border-top: 4px solid white;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .notification-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 9999;
                    background-color: rgba(0, 0, 0, 0.6);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    pointer-events: auto;
                }

                body.modal-open .military-card:hover {
                    transform: none !important;
                    background-color: inherit !important;
                    transition: none !important;
                }
            `}</style>
        </>
    )
}