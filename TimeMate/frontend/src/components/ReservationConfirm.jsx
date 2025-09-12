// src/components/ReservationConfirm.jsx
import { useEffect, useMemo, useState } from "react";

/* Wir bekommen backend={ API_BASE, RESTAURANT_ID, getToken } aus main.jsx */
export default function ReservationConfirm({ open, onClose, summary, backend }) {
  const API_BASE = backend?.API_BASE || "http://localhost:8302";
  const RESTAURANT_ID = backend?.RESTAURANT_ID || "demo-restaurant";
  const getToken = backend?.getToken || (() => "string");

  async function api(path, { method = "GET", body } = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return {};
    }
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.success === false) {
      const payload = json?.payload || {};
      const err = new Error(payload.message || `HTTP ${res.status}`);
      err.code = payload.code || "error";
      err.status = res.status;
      throw err;
    }
    return json?.payload ?? json;
  }

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [people, setPeople] = useState(summary?.peopleDefault ?? 2);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (!open) {
      // reset bei Schließen
      setSubmitting(false);
      setErrorMsg("");
      setShake(false);
      // Eingaben behalten wir, damit Nutzer nicht alles verliert, wenn er schließt
    }
  }, [open]);

  const canSubmit = useMemo(() => {
    const okNames = firstName.trim().length >= 2 && lastName.trim().length >= 2;
    const okEmail = /\S+@\S+\.\S+/.test(email);
    const okPhone = phone.trim().length >= 6;
    const okPeople = Number(people) >= 1;
    return okNames && okEmail && okPhone && okPeople;
  }, [firstName, lastName, email, phone, people]);

  const onSubmit = async () => {
    setErrorMsg("");
    if (!canSubmit) {
      setErrorMsg("Bitte alle Felder korrekt ausfüllen.");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        restaurant_id: RESTAURANT_ID,
        seat_id: summary?.seatId || null,
        date: summary?.iso, // ISO8601
        people: Number(people),
        extras: summary?.extras || [],
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
      };

      const res = await api("/reserve", { method: "POST", body: payload });

      // Erfolg → zur Verifizierung auf Backend-URL weiterleiten (optional)
      const verifyUrl = res.verify_url || "/verify";
      // Hart auf Backend leiten, damit Code verifiziert wird
      window.location.assign(`${API_BASE}${verifyUrl}`);
    } catch (e) {
      if (e.code === "occupied") setErrorMsg("Der ausgewählte Platz ist soeben belegt worden.");
      else if (e.code === "capacity_reached") setErrorMsg("Keine Kapazität verfügbar.");
      else if (e.code === "holiday") setErrorMsg("Heute ist ein Feiertag – geschlossen.");
      else if (e.code === "closed") setErrorMsg("Außerhalb der Öffnungszeiten.");
      else if (e.code === "lead_time_violation") setErrorMsg("Mindestvorlauf nicht erfüllt.");
      else setErrorMsg("Netzwerk-/Serverfehler. Bitte später erneut versuchen.");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="date-modal" style={{ zIndex: 20 }}>
      <div className={`date-card ${shake ? "error-shake" : ""}`} style={{ width: "min(860px, 94vw)" }}>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div className="modal-head">Reservierung bestätigen</div>
          <button type="button" className="btn btn-sm btn-outline-light" onClick={onClose} disabled={submitting}>
            Schließen
          </button>
        </div>

        {errorMsg && <div className="alert alert-danger py-2 px-3">{errorMsg}</div>}

        <div className="row g-3">
          {/* Formular */}
          <div className="col-12 col-lg-6">
            <div className="mb-2">
              <label className="form-label">Vorname</label>
              <input
                type="text"
                className="form-control"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Max"
              />
            </div>
            <div className="mb-2">
              <label className="form-label">Nachname</label>
              <input
                type="text"
                className="form-control"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Muster"
              />
            </div>
            <div className="mb-2">
              <label className="form-label">E-Mail</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="max@muster.ch"
              />
            </div>
            <div className="mb-2">
              <label className="form-label">Telefonnummer</label>
              <input
                type="tel"
                className="form-control"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+41 79 123 45 67"
              />
            </div>
            <div className="mb-2">
              <label className="form-label">Personen</label>
              <input
                type="number"
                min={1}
                className="form-control"
                value={people}
                onChange={(e) => setPeople(e.target.value)}
              />
            </div>
          </div>

          {/* Zusammenfassung */}
          <div className="col-12 col-lg-6">
            <div className="surface p-3" style={{ borderRadius: 12 }}>
              <div className="h6 mb-3">Zusammenfassung</div>
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="k">Datum</span>
                  <span className="v">{summary?.date || "—"}</span>
                </div>
                <div className="summary-item">
                  <span className="k">Zeit</span>
                  <span className="v">{summary?.time || "—"}</span>
                </div>
                <div className="summary-item">
                  <span className="k">Sitzplatz</span>
                  <span className="v">{summary?.seatLabel || "—"}</span>
                </div>
                <div className="summary-item span2">
                  <span className="k">Zusätze</span>
                  <div className="badge-cloud">
                    {summary?.extras?.length ? (
                      summary.extras.map((x) => (
                        <span key={x} className="mini-pill">
                          {x}
                        </span>
                      ))
                    ) : (
                      <span className="text-muted">Keine</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-muted small mt-2">
                Mit dem Klick auf „Jetzt verbindlich buchen“ stimmst du unseren AGB zu.
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-end gap-2 mt-3">
          <button type="button" className="btn btn-outline-light btn-sm" onClick={onClose} disabled={submitting}>
            Abbrechen
          </button>
          <button type="button" className="btn btn-light btn-sm" onClick={onSubmit} disabled={submitting || !canSubmit}>
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" />
                Sende…
              </>
            ) : (
              "Jetzt verbindlich buchen"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
