// src/components/ReservationConfirm.jsx
import { useEffect, useMemo, useState } from "react";

/** Dummy-API: simuliert Server-Antwort */
async function submitReservation(payload) {
    // warte ein bisschen
    await new Promise((r) => setTimeout(r, 1200));
    // Demo: 30% Fehlerchance (zum Testen). Für konstanten Erfolg => setze alwaysSuccess = true
    const alwaysSuccess = false;
    const fail = !alwaysSuccess && Math.random() < 0.3;

    if (fail) {
        return {
            success: false,
            message: "Tisch wurde soeben vergeben. Bitte wähle eine andere Zeit oder einen anderen Sitzplatz.",
        };
    }
    // Dummy-Redirect
    return {
        success: true,
        message: "Reservierung bestätigt.",
        redirectUrl: "/thank-you?ref=demo", // Dummy-Ziel
    };
}

export default function ReservationConfirm({
                                               open,
                                               onClose,
                                               summary, // { date, time, seatLabel, extras: string[], peopleDefault?:number }
                                           }) {
    const [firstName, setFirstName] = useState("");
    const [lastName,  setLastName]  = useState("");
    const [email,     setEmail]     = useState("");
    const [phone,     setPhone]     = useState("");
    const [people,    setPeople]    = useState(summary?.peopleDefault ?? 2);

    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg]     = useState("");
    const [shake, setShake]           = useState(false);

    useEffect(() => {
        if (!open) {
            // reset bei Schließen
            setSubmitting(false);
            setErrorMsg("");
            setShake(false);
        }
    }, [open]);

    const canSubmit = useMemo(() => {
        // very basic checks
        const okNames  = firstName.trim().length >= 2 && lastName.trim().length >= 2;
        const okEmail  = /\S+@\S+\.\S+/.test(email);
        const okPhone  = phone.trim().length >= 6;
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
                customer: { firstName, lastName, email, phone, people: Number(people) },
                selection: {
                    date: summary?.date,
                    time: summary?.time,
                    seatLabel: summary?.seatLabel,
                    extras: summary?.extras || [],
                },
            };

            const res = await submitReservation(payload);

            if (!res.success) {
                setErrorMsg(res.message || "Unbekannter Fehler.");
                setShake(true);
                setTimeout(() => setShake(false), 500);
                setSubmitting(false);
                return;
            }

            // success → weiterleiten
            window.location.assign(res.redirectUrl || "/thank-you");
        } catch (e) {
            setErrorMsg("Netzwerkfehler. Bitte später erneut versuchen.");
            setShake(true);
            setTimeout(() => setShake(false), 500);
            setSubmitting(false);
        }
    };

    if (!open) return null;

    return (
        <div className="date-modal" style={{ zIndex: 20 }}>
            <div
                className={`date-card ${shake ? "error-shake" : ""}`}
                style={{ width: "min(860px, 94vw)" }}
            >
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="modal-head">Reservierung bestätigen</div>
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-light"
                        onClick={onClose}
                        disabled={submitting}
                    >
                        Schließen
                    </button>
                </div>

                {errorMsg && (
                    <div className="alert alert-danger py-2 px-3">{errorMsg}</div>
                )}

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
                                        {summary?.extras?.length
                                            ? summary.extras.map((x) => (
                                                <span key={x} className="mini-pill">{x}</span>
                                            ))
                                            : <span className="text-muted">Keine</span>}
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
                    <button
                        type="button"
                        className="btn btn-outline-light btn-sm"
                        onClick={onClose}
                        disabled={submitting}
                    >
                        Abbrechen
                    </button>
                    <button
                        type="button"
                        className="btn btn-light btn-sm"
                        onClick={onSubmit}
                        disabled={submitting || !canSubmit}
                    >
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