import { createBrowserRouter } from "react-router-dom";
import { getToken, introspect } from "./utils/auth.ts";
import PanelLayout from "./PanelLayout.tsx";
import { AUTH_LOGIN_URL } from "./config.ts";

async function requireAuth() {
    const token = getToken();
    const result = await introspect(token ?? "");
    if (!result?.active) {
        const loginUrl = AUTH_LOGIN_URL || "/login/";
        window.location.href = `${loginUrl}?redirect_uri=${encodeURIComponent(window.location.href)}`;
        return null;
    }
    return null;
}

export const router = createBrowserRouter([
    { path: "/storemate/*", loader: requireAuth, element: <PanelLayout /> },
    { path: "/", loader: requireAuth, element: <PanelLayout /> }
]);