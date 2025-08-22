import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
type JWTPayload = {
    exp: number;
    [key: string]: unknown;
};

async function postAuthDebug(body: unknown) {
    try {
        const res = await fetch("/auth/debug", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        const text = await res.text();
        const payload = { ok: res.ok, status: res.status, text };
        sessionStorage.setItem("auth_debug", JSON.stringify(payload));
        console.log("AUTH_DEBUG", payload);
        return payload;
    } catch (e) {
        const err = { ok: false, error: String(e) };
        sessionStorage.setItem("auth_debug", JSON.stringify(err));
        console.error("AUTH_DEBUG_ERROR", e);
        return err;
    }
}

export default function Callback() {
    const [sp] = useSearchParams();
    const nav = useNavigate();
    const showDebug = sp.get("debug") === "1";

    useEffect(() => {
        (async () => {
            const token = sp.get("access_token");
            let next = sp.get("next") || "/";
            let decoded: JWTPayload | null = null;
            let status = "ok";

            try {
                if (token) {
                    decoded = jwtDecode<JWTPayload>(token);
                    if (decoded.exp * 1000 < Date.now()) throw new Error("Token expired");
                    localStorage.setItem("access_token", token);
                } else {
                    status = "no_token";
                    throw new Error("No token");
                }
            } catch {
                status = "invalid";
                next = "/login";
            }

            const dbg = await postAuthDebug({
                status,
                token_present: Boolean(token),
                token_len: token ? token.length : 0,
                decoded,
                now: Date.now(),
                next
            });

            if (showDebug) {
                alert(typeof dbg === "object" ? JSON.stringify(dbg) : String(dbg));
            }

            if (!next.startsWith("/")) next = "/";
            nav(next, { replace: true });
        })();
    }, []);

    return null;
}