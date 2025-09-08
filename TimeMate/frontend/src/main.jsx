import { StrictMode, useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

import SeatPick from './components/SeatPick.jsx';
import ReservationConfirm from './components/ReservationConfirm.jsx';

/* ---------------- Konfiguration ---------------- */
const minLeadHours = 2; // mind. X Stunden in der Zukunft (Dummy: 2)

/* Öffnungszeiten (Minuten seit Mitternacht) */
const opening = {
    morning:   { start: toMin('08:00'), end: toMin('12:00') },
    lunch:     { start: toMin('12:00'), end: toMin('13:00') },
    afternoon: { start: toMin('13:00'), end: toMin('18:00') },
};
function toMin(hm){ const [h,m] = hm.split(':').map(Number); return h*60+m }

/* ---------------- Dummy-APIs ---------------- */
function fetchZusatzOptions(){
    return new Promise(res => setTimeout(() => res(['Homeoffice','Kunde X','Reisezeit']), 120));
}
/* Ferien: ganzer Oktober (Monat 9) */
function isHoliday(date){ return date.getMonth() === 9 } // 0=Jan

/* ---------------- Helpers ---------------- */
const combineDateTime = (baseDate, hour, minute) => {
    const d = new Date(baseDate);
    d.setHours(hour, minute, 0, 0);
    return d;
};
const leadBound = (hrs=minLeadHours) => new Date(Date.now() + hrs*60*60*1000);
const isWithinOpening = (dt) => {
    const t = dt.getHours()*60 + dt.getMinutes();
    const inMorning   = t >= opening.morning.start   && t < opening.morning.end;
    const inLunch     = t >= opening.lunch.start     && t < opening.lunch.end;
    const inAfternoon = t >= opening.afternoon.start && t < opening.afternoon.end;
    return (inMorning || inAfternoon) && !inLunch;
};

/* ---------------- App ---------------- */
function App(){
    /* UI State */
    const [showMap,setShowMap] = useState(false);
    const [errorFx,setErrorFx] = useState(false);
    const [errorMsg,setErrorMsg] = useState('');
    const [showConfirm, setShowConfirm] = useState(false);

    /* Datum (Heute/Morgen/📝) */
    const today = new Date();
    const [dayOffset,setDayOffset] = useState(0);
    const baseDate = useMemo(() => {
        const d = new Date();
        d.setDate(today.getDate() + dayOffset);
        d.setHours(0,0,0,0);
        return d;
    }, [dayOffset]);

    const fmtShort = useMemo(()=> new Intl.DateTimeFormat('de-CH',{weekday:'short',day:'2-digit',month:'short'}), []);
    const fmtFull  = useMemo(()=> new Intl.DateTimeFormat('de-CH',{day:'2-digit',month:'2-digit',year:'numeric'}), []);
    const dateChipLabel = dayOffset===0 ? 'Heute' : dayOffset===1 ? 'Morgen' : fmtShort.format(baseDate).replace('.','');
    const fullDate = fmtFull.format(baseDate);

    /* Manuelle Datumsauswahl (Modal) */
    const [customOpen,setCustomOpen] = useState(false);
    const [cy,setCy] = useState(baseDate.getFullYear());
    const [cm,setCm] = useState(baseDate.getMonth()+1);
    const [cd,setCd] = useState(baseDate.getDate());
    useEffect(()=>{ setCy(baseDate.getFullYear()); setCm(baseDate.getMonth()+1); setCd(baseDate.getDate()) },[baseDate]);
    const daysInMonth = useMemo(()=> new Date(cy, cm, 0).getDate(), [cy,cm]);
    useEffect(()=>{ if(cd>daysInMonth) setCd(daysInMonth) },[daysInMonth]);

    /* Zeit (HH:MM, 15-Minuten Raster) */
    const round15 = m => Math.round(m/15)*15 % 1440;
    const initNow = round15(today.getHours()*60 + today.getMinutes());
    const [hour,setHour] = useState(Math.floor(initNow/60));
    const [minute,setMinute] = useState(initNow%60);
    const hh = String(hour).padStart(2,'0');
    const mm = String(minute).padStart(2,'0');

    /* Zusatz */
    const [options,setOptions] = useState([]);
    const [selected,setSelected] = useState(new Set());
    const [selectedSeat, setSelectedSeat] = useState(null);

    useEffect(()=>{ fetchZusatzOptions().then(setOptions) },[]);

    /* Reveal Safe-Mode */
    useEffect(()=>{
        document.body.classList.add('enhanced');
        const els=[...document.querySelectorAll('.reveal')];
        els.forEach(el=>el.classList.add('in-view'));
        const io=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting) e.target.classList.add('in-view') }), {rootMargin:'0px 0px -10% 0px'});
        els.forEach(el=>io.observe(el));
        return ()=>io.disconnect();
    },[]);

    /* -------- Zeit-Engine (+ oben / − unten, Überläufe inkl. Datum) -------- */
    const MINUTE_MS = 60*1000;
    const stripTime = d => { const x=new Date(d); x.setHours(0,0,0,0); return x; };

    // Simuliere delta-Minuten (kann Tag wechseln)
    const simulateStep = (deltaMinutes) => {
        const current = combineDateTime(baseDate, hour, minute);
        const next = new Date(current.getTime() + deltaMinutes * MINUTE_MS);
        const baseMid = stripTime(baseDate);
        const nextMid = stripTime(next);
        const dayDiff = Math.round((nextMid - baseMid) / (24*60*MINUTE_MS));
        return { next, nextHour: next.getHours(), nextMinute: next.getMinutes(), dayOffsetDiff: dayDiff };
    };

    // Minus-Schritte nur blockieren, wenn sie in die Vergangenheit gehen
    const canStepMinutes = (deltaMinutes) => {
        const { next } = simulateStep(deltaMinutes);
        return next >= new Date();
    };

    const applyMinute = (delta) => {
        const { nextHour, nextMinute, dayOffsetDiff } = simulateStep(delta);
        if (dayOffsetDiff) setDayOffset(o=>o + dayOffsetDiff);
        const snapped = Math.round(nextMinute/15)*15 % 60; // 15-Minuten Raster
        setHour(nextHour);
        setMinute(snapped);
    };
    const applyHour = (deltaHour) => applyMinute(deltaHour * 60);

    /* Datum-Handler */
    const stepDay = d => setDayOffset(o=>o+d);
    const confirmCustom = () => {
        const target = new Date(cy, cm-1, cd); target.setHours(0,0,0,0);
        const diff = Math.round((target - new Date(new Date().toDateString()))/(1000*60*60*24));
        setDayOffset(diff); setCustomOpen(false);
    };

    /* Zusatz-Handler */
    const toggleOption = (o) => {
        const n=new Set(selected);
        n.has(o)?n.delete(o):n.add(o);
        setSelected(n);
    };

    /* Status / Validierung live */
    const dt = combineDateTime(baseDate, hour, minute);
    const meetsLead   = dt >= leadBound(minLeadHours);
    const openOk      = isWithinOpening(dt);
    const holiday     = isHoliday(baseDate);
    const businessOk  = openOk && !holiday;

    let statusText = 'Verfügbar';
    if (holiday) statusText = 'Ferien';
    else if (!openOk) statusText = 'Außerhalb Öffnungszeiten';

    /* Fehler-Effekt */
    const pulseError = () => { setErrorFx(true); setTimeout(()=>setErrorFx(false), 550); };

    /* Bestätigen → Checks, dann Modal öffnen */
    const openConfirm = useCallback(() => {
        setErrorMsg('');
        if(!meetsLead){
            setErrorMsg(`Reservierung muss mind. ${minLeadHours} Stunden im Voraus erfolgen.`);
            pulseError(); return;
        }
        if(!businessOk){
            setErrorMsg(holiday ? 'Es sind Ferien.' : 'Außerhalb der Öffnungszeiten.');
            pulseError(); return;
        }
        if (showMap && !selectedSeat) {
            setErrorMsg('Bitte zuerst einen Sitzplatz wählen.');
            pulseError(); return;
        }
        setShowConfirm(true);
    }, [meetsLead, businessOk, holiday, showMap, selectedSeat]);

    return (
        <>
            {/* Blur-Ränder */}
            <div className="side-blur side-left d-none d-lg-block" />
            <div className="side-blur side-right d-none d-lg-block" />

            {/* Navbar */}
            <nav className="navbar navbar-dark fixed-top nav-veil">
                <div className="app-shell d-flex align-items-center justify-content-between">
                    <a className="navbar-brand d-flex align-items-center gap-2" href="#">
                        <span className="brand-logo" />
                        <span className="fw-semibold">Prereact • TimeMate</span>
                    </a>
                    <div className="d-flex align-items-center gap-2">
                        <a className="btn btn-light btn-sm" href="/">Home</a>
                    </div>
                </div>
            </nav>

            {/* Alert oben */}
            {errorMsg && (
                <div className="alert-container">
                    <div className="alert alert-danger py-2 px-3 m-0 d-flex justify-content-between align-items-center">
                        <span>{errorMsg}</span>
                        <button
                            type="button"
                            className="btn-close btn-close-white"
                            aria-label="Close"
                            onClick={()=>setErrorMsg('')}
                        ></button>
                    </div>
                </div>
            )}

            <main className={`app-shell pt-nav ${errorFx?'error-shake':''}`}>
                {/* ZEIT */}
                <section className="section h-40dvh reveal rounded-4 p-4 mb-4 surface">
                    <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
                        <h2 className="h5 m-0">Zeit</h2>
                        <div className="date-nav">
                            <button className="nav-chip" onClick={()=>stepDay(-1)} aria-label="Vortag">◀</button>
                            <div className="date-chip">{dateChipLabel}</div>
                            <button className="nav-chip" onClick={()=>stepDay(+1)} aria-label="Folgetag">▶</button>
                            <button className="nav-chip" onClick={()=>setCustomOpen(true)} title="Datum eingeben">📝</button>
                        </div>
                    </div>

                    {/* + oben / - unten; Minuten modulo 60 mit Überlauf */}
                    <div className="time-matrix subtle">
                        <div className="col-head text-center">Std</div>
                        <div></div>
                        <div className="col-head text-center">Min</div>

                        {/* + oben */}
                        <button className="time-btn" onClick={()=>applyHour(+1)} aria-label="Stunde +1">+1</button>
                        <div className="time-colon up-spacer"></div>
                        <button className="time-btn" onClick={()=>applyMinute(+15)} aria-label="Minute +15">+15</button>

                        {/* Anzeige */}
                        <div className="time-face slim"><div className="time-main">{hh}</div></div>
                        <div className="time-colon">:</div>
                        <div className="time-face slim"><div className="time-main">{mm}</div></div>

                        {/* - unten (blockt nur „Vergangenheit“) */}
                        <button
                            className="time-btn"
                            onClick={()=>applyHour(-1)}
                            disabled={!canStepMinutes(-60)}
                            aria-label="Stunde -1"
                        >-1</button>
                        <div className="time-colon down-spacer"></div>
                        <button
                            className="time-btn"
                            onClick={()=>applyMinute(-15)}
                            disabled={!canStepMinutes(-15)}
                            aria-label="Minute -15"
                        >-15</button>
                    </div>

                    <div className="time-inline">
                        <div className="pill-strong">{fullDate} • {hh}:{mm}</div>
                    </div>

                    {/* Status unten rechts */}
                    <div className="time-status">
                        <div className={`status-just ${businessOk ? 'ok' : 'bad'}`}>{businessOk ? 'Verfügbar' : statusText}</div>
                        <div className={`status-icon ${businessOk ? 'ok' : 'bad'}`}>{businessOk ? '✓' : '✕'}</div>
                    </div>
                </section>

                {/* ZUSATZ */}
                <section className="section h-40dvh reveal rounded-4 p-4 mb-4 surface">
                    <h2 className="h5 mb-3">Zusatz</h2>
                    {options.length===0?(
                        <div className="d-flex align-items-center gap-2">
                            <span className="spinner-border spinner-border-sm" role="status" />
                            <span>Lade…</span>
                        </div>
                    ):(
                        <div className="row g-2">
                            {options.map(o=>(
                                <div className="col-6 col-md-4" key={o}>
                                    <label
                                        className={(selected.has(o)?'chip chip-active':'chip')+' w-100 text-center option has-tip'}
                                        data-tip={`Info zu "${o}"`}
                                    >
                                        <input
                                            type="checkbox"
                                            className="d-none"
                                            checked={selected.has(o)}
                                            onChange={()=>toggleOption(o)}
                                        />
                                        <span>{o}</span>
                                    </label>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="selection-banner mt-3">
                        <div className="badge-cloud">
                            {[...selected].length ? (
                                [...selected].map(x=> <span key={x} className="mini-pill">{x}</span>)
                            ) : (
                                <span className="text-muted">Keine Auswahl</span>
                            )}
                        </div>
                    </div>
                </section>

                {/* KARTE – nur wenn showMap true */}
                {showMap && (
                    <SeatPick
                        baseDate={baseDate}
                        hour={hour}
                        minute={minute}
                        extras={[...selected]}
                        selectedSeatId={selectedSeat?.id || null}
                        onSelectSeat={(seat) => setSelectedSeat(seat)}
                    />
                )}

                {/* ZUSAMMENFASSUNG */}
                <section className="section reveal rounded-4 p-4 mb-5 surface">
                    <h2 className="h6 mb-3">Zusammenfassung</h2>
                    <div className="summary-grid">
                        <div className="summary-item"><span className="k">Datum</span><span className="v">{fullDate}</span></div>
                        <div className="summary-item"><span className="k">Zeit</span><span className="v">{hh}:{mm}</span></div>
                        {showMap && (
                            <div className="summary-item">
                                <span className="k">Sitzplatz</span>
                                <span className="v">{selectedSeat ? selectedSeat.label : '—'}</span>
                            </div>
                        )}
                        <div className="summary-item span2">
                            <span className="k">Zusatz</span>
                            <div className="badge-cloud">
                                {[...selected].length ? (
                                    [...selected].map(x=> <span key={x} className="mini-pill">{x}</span>)
                                ) : (
                                    <span className="text-muted">Keine Auswahl</span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="d-flex justify-content-end mt-3">
                        <button
                            className="btn btn-light btn-sm"
                            onClick={openConfirm}
                            disabled={showMap && !selectedSeat}
                        >
                            Bestätigen
                        </button>
                    </div>
                </section>
            </main>

            {/* Fehler-Overlay */}
            {errorFx && <div className="error-veil" />}

            {/* Reservierungs-Modal */}
            <ReservationConfirm
                open={showConfirm}
                onClose={() => setShowConfirm(false)}
                summary={{
                    date: fullDate,
                    time: `${hh}:${mm}`,
                    seatLabel: showMap ? (selectedSeat?.label || '—') : '—',
                    extras: [...selected],
                    peopleDefault: 2,
                }}
            />

            {/* Manuelle Datumsauswahl */}
            {customOpen && (
                <div className="date-modal">
                    <div className="date-card">
                        <div className="modal-head">Datum wählen</div>
                        <div className="row g-2">
                            <div className="col-4">
                                <select className="date-select" value={cd} onChange={e=>setCd(+e.target.value)}>
                                    {Array.from({length:daysInMonth},(_,i)=>i+1).map(d=> (
                                        <option key={d} value={d}>{String(d).padStart(2,'0')}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-4">
                                <select className="date-select" value={cm} onChange={e=>setCm(+e.target.value)}>
                                    {Array.from({length:12},(_,i)=>i+1).map(m=> (
                                        <option key={m} value={m}>{String(m).padStart(2,'0')}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-4">
                                <select className="date-select" value={cy} onChange={e=>setCy(+e.target.value)}>
                                    {Array.from({length:7},(_,i)=>today.getFullYear()-3+i).map(y=> (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="d-flex justify-content-end gap-2 mt-3">
                            <button className="btn btn-outline-light btn-sm" onClick={()=>setCustomOpen(false)}>Abbrechen</button>
                            <button className="btn btn-light btn-sm" onClick={confirmCustom}>Übernehmen</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <App/>
    </StrictMode>
);