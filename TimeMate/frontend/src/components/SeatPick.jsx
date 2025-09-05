// src/components/SeatPick.jsx
import { useEffect, useMemo, useRef, useState } from "react";

/* ========================== Dummy APIs ========================== */
async function fetchHallSvg() {
  return {
    viewBox: "0 0 1000 600",
    inner: `
      <defs>
        <linearGradient id="bg" x1="0" x2="1">
          <stop offset="0%" stop-color="#0d1117"/>
          <stop offset="100%" stop-color="#111827"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="1000" height="600" fill="url(#bg)" />
      <g opacity=".18">
        <rect x="60" y="60" width="880" height="480" rx="18" fill="#fff" />
      </g>
    `,
  };
}

async function fetchSeatsDummy({ datetime, extras }) {
  const hour = datetime.getHours();
  const eCount = extras.length;
  const base = [
    { id: "A-11", x: 220, y: 180, label: "A-11", info: "Fensterplatz, 2 Pers." },
    { id: "A-12", x: 320, y: 180, label: "A-12", info: "Zentral, 4 Pers." },
    { id: "B-05", x: 520, y: 260, label: "B-05", info: "Nähe Eingang, 2 Pers." },
    { id: "C-21", x: 780, y: 360, label: "C-21", info: "Ecke, 6 Pers." },
    { id: "D-02", x: 420, y: 420, label: "D-02", info: "Ruhebereich, 2 Pers." },
  ];
  return base.map((s, idx) => {
    let status = "free";
    if ((idx + hour) % 5 === 0) status = "reserved";
    if ((idx + eCount) % 7 === 0) status = "unsuitable";
    return { ...s, status };
  });
}

/* ========================== Utils ========================== */
function useDebouncedValue(v, ms) {
  const [d, setD] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setD(v), ms);
    return () => clearTimeout(t);
  }, [v, ms]);
  return d;
}

function SeatIcon({ status, selected }) {
  let fill = "#7fffb0", stroke = "#0f5132", glyph = null;
  if (status === "reserved") {
    fill = "#ff9aa2"; stroke = "#842029";
    glyph = <path d="M -5 -5 L 5 5 M 5 -5 L -5 5" stroke={stroke} strokeWidth="2.5" />;
  } else if (status === "unsuitable") {
    fill = "#bfc7d5"; stroke = "#374151";
    glyph = <path d="M -6 0 L 6 0" stroke={stroke} strokeWidth="3" />;
  } else {
    glyph = <path d="M -6 1 L 6 1 M 0 -6 L 0 6" stroke={stroke} strokeWidth="2" opacity=".65" />;
  }
  if (selected) { fill = "#a5b4fc"; stroke = "#312e81"; }
  return (
    <g>
      <circle r="12" fill={fill} stroke={stroke} strokeWidth="2" />
      {glyph}
      {selected && <circle r="16" fill="none" stroke={stroke} strokeWidth="2" opacity=".45" />}
    </g>
  );
}

/* ========================== Component ========================== */
export default function SeatPick({
  baseDate, hour, minute, extras,
  selectedSeatId = null, onSelectSeat,
  debounceMs = 800,
}) {
  /* ---- data ---- */
  const [hall, setHall] = useState({ viewBox: "0 0 1000 600", inner: "" });
  const [seats, setSeats] = useState([]);
  const [loadingSeats, setLoadingSeats] = useState(false);

  /* ---- ui ---- */
  const [activeSeat, setActiveSeat] = useState(null);
  const [infoPos, setInfoPos] = useState({ x: 0, y: 0 });
  const [infoVisible, setInfoVisible] = useState(false);
  const infoRef = useRef(null);
  const [cardSize, setCardSize] = useState({ w: 260, h: 130 });
  const infoSide = useRef('right'); // 'right' or 'left' with hysteresis to avoid teleporting

  /* ---- pan/zoom ---- */
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);

  const containerRef = useRef(null);
  const pointers = useRef(new Map()); // pointerId -> {x,y}
  const lastTapTs   = useRef(0);
  const tapInfo     = useRef({ startX: 0, startY: 0, moved: false });
  const lastSeatClickTs = useRef(0);

  const vb = useMemo(() => {
    const [x, y, w, h] = hall.viewBox.split(" ").map(Number);
    return { x, y, w, h };
  }, [hall.viewBox]);

  const dateTime = useMemo(() => {
    const d = new Date(baseDate);
    d.setHours(hour, minute, 0, 0);
    return d;
  }, [baseDate, hour, minute]);

  const debouncedDateTime = useDebouncedValue(dateTime, debounceMs);
  const debouncedExtras   = useDebouncedValue(Array.isArray(extras) ? extras : [...extras], debounceMs);

  /* ---- helpers ---- */
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const minScale = 0.6, maxScale = 5;

  /* ---- load map once ---- */
  useEffect(() => {
    let alive = true;
    (async () => {
      const h = await fetchHallSvg();
      if (!alive) return;
      setHall(h);
    })();
    return () => { alive = false; };
  }, []);

  /* ---- initial fit (zentriert + Innenabstand) + on resize ---- */
  useEffect(() => {
    const wrap = containerRef.current;
    if (!wrap || !vb.w || !vb.h) return;

    const fit = () => {
      const { width: cw, height: ch } = wrap.getBoundingClientRect();
      if (!cw || !ch) return;

      // ~5% Innenabstand (mind. 12px), dann maximaler Scale der in beide Richtungen passt
      const pad = Math.max(12, Math.min(cw, ch) * 0.05);
      const s   = Math.min((cw - 2 * pad) / vb.w, (ch - 2 * pad) / vb.h);
      const contentW = vb.w * s;
      const contentH = vb.h * s;

      setScale(s);
      setTx((cw - contentW) / 2);
      setTy((ch - contentH) / 2);
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [vb.w, vb.h]);

  /* ---- fetch seats debounced ---- */
  useEffect(() => {
    let alive = true;
    setLoadingSeats(true);
    (async () => {
      try {
        const data = await fetchSeatsDummy({ datetime: debouncedDateTime, extras: debouncedExtras });
        if (!alive) return;
        setSeats(data);
        setActiveSeat(null);
        setInfoVisible(false);
      } finally {
        if (alive) setLoadingSeats(false);
      }
    })();
    return () => { alive = false; };
  }, [debouncedDateTime, debouncedExtras]);

  /* ---- pan/zoom helpers ---- */
  const clampPan = (ntx, nty, s) => {
    const wrap = containerRef.current;
    if (!wrap) return { ntx, nty };

    const { width: cw, height: ch } = wrap.getBoundingClientRect();
    const contentW = vb.w * s;
    const contentH = vb.h * s;

    // Wenn Content kleiner ist → zentrieren; sonst clampen
    let minX, maxX;
    if (contentW <= cw) { minX = maxX = (cw - contentW) / 2; }
    else { minX = cw - contentW; maxX = 0; }

    let minY, maxY;
    if (contentH <= ch) { minY = maxY = (ch - contentH) / 2; }
    else { minY = ch - contentH; maxY = 0; }

    const ctX = clamp(ntx, minX, maxX);
    const ctY = clamp(nty, minY, maxY);
    return { ntx: ctX, nty: ctY };
  };

  const applyPan = (dx, dy) => {
    const { ntx, nty } = clampPan(tx + dx, ty + dy, scale);
    setTx(ntx); setTy(nty);
    if (activeSeat) repositionInfo(activeSeat, ntx, nty, scale);
  };

  const zoomAt = (cx, cy, factor) => {
    const newScale = clamp(scale * factor, minScale, maxScale);

    const sx = (cx - tx) / scale;
    const sy = (cy - ty) / scale;
    let ntx = cx - sx * newScale;
    let nty = cy - sy * newScale;

    ({ ntx, nty } = clampPan(ntx, nty, newScale));
    setScale(newScale);
    setTx(ntx);
    setTy(nty);
    if (activeSeat) repositionInfo(activeSeat, ntx, nty, newScale);
  };

  /* ---- wheel (Desktop + Trackpad) ---- */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      if (e.ctrlKey) {
        const factor = Math.exp(-e.deltaY * 0.002);
        zoomAt(cx, cy, factor);
      } else {
        applyPan(-e.deltaX, -e.deltaY);
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [scale, tx, ty, activeSeat]);

  /* ---- pointer gestures (Mobile + Desktop) ---- */
  const onPointerDown = (e) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    tapInfo.current = { startX: e.clientX, startY: e.clientY, moved: false };
    if (e.pointerType === "touch") {
      const now = Date.now();
      if (now - lastTapTs.current < 300) {
        const rect = containerRef.current.getBoundingClientRect();
        zoomAt(e.clientX - rect.left, e.clientY - rect.top, 1.6);
      }
      lastTapTs.current = now;
    }
  };
  const onPointerUp = (e) => { pointers.current.delete(e.pointerId); };
  const onPointerMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return;

    // Tap vs. Drag
    if (!tapInfo.current.moved) {
      const d = Math.hypot(e.clientX - tapInfo.current.startX, e.clientY - tapInfo.current.startY);
      if (d > 6) tapInfo.current.moved = true;
    }

    const count = pointers.current.size;
    if (count === 1) {
      const prev = pointers.current.get(e.pointerId);
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      applyPan(dx, dy);
      return;
    }
    if (count === 2) {
      const entries = [...pointers.current.entries()];
      const [id1, p1] = entries[0];
      const [id2, p2] = entries[1];
      let n1 = p1, n2 = p2;
      if (e.pointerId === id1) n1 = { x: e.clientX, y: e.clientY };
      if (e.pointerId === id2) n2 = { x: e.clientX, y: e.clientY };

      const prevDist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      const nextDist = Math.hypot(n1.x - n2.x, n1.y - n2.y);
      const factor = prevDist ? nextDist / prevDist : 1;

      const rect = containerRef.current.getBoundingClientRect();
      const mid = { x: (n1.x + n2.x) / 2 - rect.left, y: (n1.y + n2.y) / 2 - rect.top };
      zoomAt(mid.x, mid.y, factor);

      pointers.current.set(id1, n1);
      pointers.current.set(id2, n2);
    }
  };

  const onDoubleClick = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    zoomAt(e.clientX - rect.left, e.clientY - rect.top, 1.6);
  };

  /* ---- info card positioning ---- */
  const svgToClient = (x, y, s = scale, ox = tx, oy = ty) => ({
    left: x * s + ox,
    top:  y * s + oy,
  });

  const repositionInfo = (seat, ox = tx, oy = ty, s = scale) => {
    const wrap = containerRef.current;
    if (!wrap || !seat) return;

    const { width: cw, height: ch } = wrap.getBoundingClientRect();
    const p = svgToClient(seat.x, seat.y, s, ox, oy);

    const margin = 8;         // keep a small margin to container edges
    const pad = 12;           // gap seat ↔ card when side-by-side
    const cardW = cardSize.w || 260;
    const cardH = cardSize.h || 130;

    // Is seat inside the visible container (with a small safety margin)?
    const seatInside =
      p.left >= margin &&
      p.left <= cw - margin &&
      p.top  >= margin &&
      p.top  <= ch - margin;

    // --- If seat is visible: keep card near it within a radius; avoid teleport by sticky side ---
    if (seatInside) {
      // Hysteresis for choosing left/right side (prevents rapid flipping)
      const spaceRight = (cw - margin) - (p.left + pad) - cardW;         // free pixels on right
      const spaceLeft  = (p.left - pad) - margin - cardW;                 // free pixels on left
      const switchNeed = -12;   // how far "negative" we allow before considering a switch
      const switchGap  = 24;    // require some advantage before switching side

      if (infoSide.current === 'right') {
        if (spaceRight < switchNeed && spaceLeft > spaceRight + switchGap) {
          infoSide.current = 'left';
        }
      } else { // 'left'
        if (spaceLeft < switchNeed && spaceRight > spaceLeft + switchGap) {
          infoSide.current = 'right';
        }
      }

      // Base position: to the chosen side, vertically centered to the seat
      let left = (infoSide.current === 'right')
        ? (p.left + pad)
        : (p.left - cardW - pad);
      let top  = p.top - cardH / 2;

      // Limit movement to a circle around the seat → smooth following without big jumps
      const R = Math.max(64, Math.min(cw, ch) * 0.12); // radius in px
      let cx = left + cardW / 2;
      let cy = top  + cardH / 2;
      let dx = cx - p.left;
      let dy = cy - p.top;
      const dist = Math.hypot(dx, dy);
      if (dist > R) {
        const k = R / dist;
        cx = p.left + dx * k;
        cy = p.top  + dy * k;
        left = cx - cardW / 2;
        top  = cy - cardH / 2;
      }

      // Finally clamp to container so card always remains fully inside
      left = Math.max(margin, Math.min(left, cw - margin - cardW));
      top  = Math.max(margin, Math.min(top,  ch - margin - cardH));

      setInfoPos({ x: left, y: top });
      return;
    }

    // --- If seat is off-screen: stick to nearest wall along the direction toward the seat ---
    // Compute ray from container center → seat point, and intersect with the "inner" rectangle
    const ccx = cw / 2;
    const ccy = ch / 2;
    const vx = p.left - ccx;
    const vy = p.top  - ccy;

    // if seat projects exactly at center (degenerate), just center the card
    if (vx === 0 && vy === 0) {
      const left = Math.max(margin, Math.min(ccx - cardW / 2, cw - margin - cardW));
      const top  = Math.max(margin, Math.min(ccy - cardH / 2, ch - margin - cardH));
      setInfoPos({ x: left, y: top });
      return;
    }

    const innerLeft   = margin + cardW / 2;
    const innerRight  = cw - margin - cardW / 2;
    const innerTop    = margin + cardH / 2;
    const innerBottom = ch - margin - cardH / 2;

    const ts = [];
    if (vx > 0) ts.push((innerRight  - ccx) / vx);
    if (vx < 0) ts.push((innerLeft   - ccx) / vx);
    if (vy > 0) ts.push((innerBottom - ccy) / vy);
    if (vy < 0) ts.push((innerTop    - ccy) / vy);

    const candidates = ts.filter(t => t > 0);
    const tMin = Math.min(...candidates);
    const hitX = ccx + vx * tMin;
    const hitY = ccy + vy * tMin;

    const left = hitX - cardW / 2;
    const top  = hitY - cardH / 2;

    setInfoPos({
      x: Math.max(margin, Math.min(left, cw - margin - cardW)),
      y: Math.max(margin, Math.min(top,  ch - margin - cardH)),
    });
  };
  useEffect(() => {
    if (!activeSeat) return;
    const el = infoRef.current;
    if (!el) return;
    const measure = () => {
      setCardSize({ w: el.offsetWidth || 260, h: el.offsetHeight || 130 });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [activeSeat]);

  useEffect(() => { if (activeSeat) repositionInfo(activeSeat); }, [activeSeat, scale, tx, ty]);

  useEffect(() => {
    const wrap = containerRef.current; if (!wrap) return;
    const ro = new ResizeObserver(() => activeSeat && repositionInfo(activeSeat));
    ro.observe(wrap); return () => ro.disconnect();
  }, [activeSeat]);

  /* ---- seat tap/click ---- */
  const openSeatInfo = (seat) => {
    setActiveSeat(seat);
    repositionInfo(seat);
    setInfoVisible(false);
    requestAnimationFrame(() => setInfoVisible(true));
  };

  const handleSeatPointerUp = (seat, e) => {
    e.stopPropagation();
    if (seat.status === "reserved") return;
    if (!tapInfo.current.moved) {
      // einige Mobile-Browser feuern click zusätzlich → debounce
      const now = Date.now();
      if (now - lastSeatClickTs.current < 250) return;
      lastSeatClickTs.current = now;
      openSeatInfo(seat);
    }
  };

  const handleSeatClick = (seat, e) => {
    // Fallback (ältere WebViews)
    e.stopPropagation();
    const now = Date.now();
    if (now - lastSeatClickTs.current < 250) return;
    lastSeatClickTs.current = now;
    if (seat.status !== "reserved") openSeatInfo(seat);
  };

  const handleSelectSeat = () => {
    if (activeSeat) onSelectSeat?.(activeSeat);
  };

  const gTransform = `translate(${tx} ${ty}) scale(${scale})`;

  return (
    <section className="section h-80dvh reveal rounded-4 p-4 mb-4 surface d-flex flex-column">
      <h2 className="h5 mb-3">Karte</h2>

      <div
        ref={containerRef}
        className="position-relative w-100 flex-grow-1"
        style={{
          minHeight: 0,                 // verhindert Überlaufen
          overflow: "hidden",
          borderRadius: 12,
          touchAction: "none",
          overscrollBehavior: "contain",
          WebkitUserSelect: "none",
          userSelect: "none",
          cursor: pointers.current.size ? "grabbing" : "default",
        }}
        onDoubleClick={onDoubleClick}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <svg
          viewBox={hall.viewBox}
          width="100%"
          height="100%"
          style={{ background: "rgba(255,255,255,.02)", display: "block" }}
        >
          <g transform={gTransform}>
            <g dangerouslySetInnerHTML={{ __html: hall.inner }} />
            {seats.map((seat) => (
              <g
                key={seat.id}
                pointerEvents="visiblePainted"
                transform={`translate(${seat.x} ${seat.y})`}
                style={{ cursor: seat.status === "reserved" ? "not-allowed" : "pointer" }}
                onPointerUp={(e) => handleSeatPointerUp(seat, e)}
                onClick={(e) => handleSeatClick(seat, e)}
              >
                <SeatIcon status={seat.status} selected={selectedSeatId === seat.id} />
                <text
                  y="28"
                  fontSize="10"
                  textAnchor="middle"
                  fill="rgba(255,255,255,.85)"
                  style={{ pointerEvents: "none" }}
                >
                  {seat.label}
                </text>
              </g>
            ))}
          </g>
        </svg>

        {/* Info-Card */}
        {activeSeat && (
          <div
            ref={infoRef}
            className="surface"
            style={{
              position: "absolute",
              left: infoPos.x,
              top: infoPos.y,
              minWidth: 220,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,.12)",
              background: "linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.04))",
              boxShadow: "0 12px 28px rgba(0,0,0,.35)",
              padding: 10,
              transform: infoVisible ? "translateY(0)" : "translateY(-6px)",
              opacity: infoVisible ? 1 : 0,
              transition: "opacity .18s ease, transform .18s ease",
              zIndex: 5,
            }}
          >
            <div className="d-flex justify-content-between align-items-center mb-1">
              <strong>{activeSeat.label}</strong>
              <span
                className="badge"
                style={{
                  background:
                    activeSeat.status === "free" ? "rgba(70,255,150,.15)" :
                    activeSeat.status === "reserved" ? "rgba(255,70,120,.15)" :
                    "rgba(180,190,200,.15)",
                  color:
                    activeSeat.status === "free" ? "#8ff5c2" :
                    activeSeat.status === "reserved" ? "#ff9fb6" :
                    "#cbd5e1",
                }}
              >
                {activeSeat.status === "free" ? "frei" : activeSeat.status === "reserved" ? "belegt" : "nicht passend"}
              </span>
            </div>
            <div className="text-muted small mb-2">{activeSeat.info}</div>
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-light"
                onClick={() => { setInfoVisible(false); setTimeout(() => setActiveSeat(null), 120); }}
              >
                Schließen
              </button>
              <button
                type="button"
                className="btn btn-sm btn-light"
                disabled={activeSeat.status !== "free"}
                onClick={handleSelectSeat}
                title={activeSeat.status !== "free" ? "Nicht auswählbar" : "Diesen Platz wählen"}
              >
                Auswählen
              </button>
            </div>
          </div>
        )}

        {/* Zoom Controls */}
        <div
          className="d-flex flex-column"
          style={{ position: "absolute", left: 12, bottom: 12, gap: 8, zIndex: 4 }}
        >
          <button
            type="button"
            className="btn btn-light btn-sm"
            onClick={() => {
              const rect = containerRef.current.getBoundingClientRect();
              zoomAt(rect.width / 2, rect.height / 2, 1.2);
            }}
            title="Zoom in"
          >
            ＋
          </button>
          <button
            type="button"
            className="btn btn-light btn-sm"
            onClick={() => {
              const rect = containerRef.current.getBoundingClientRect();
              zoomAt(rect.width / 2, rect.height / 2, 1 / 1.2);
            }}
            title="Zoom out"
          >
            －
          </button>
        </div>

        {/* Loader */}
        {loadingSeats && (
          <div
            className="position-absolute"
            style={{
              right: 12,
              top: 12,
              zIndex: 4,
              padding: "6px 10px",
              borderRadius: 10,
              background: "rgba(0,0,0,.35)",
              border: "1px solid rgba(255,255,255,.12)",
              backdropFilter: "blur(2px)",
              fontSize: 12
            }}
          >
            Aktualisiere Plätze…
          </div>
        )}
      </div>
    </section>
  );
}