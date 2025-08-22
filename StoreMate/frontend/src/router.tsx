import { createBrowserRouter, redirect, type LoaderFunctionArgs } from "react-router-dom";
import { getToken, introspect } from "./utils/auth.ts";
import PanelLayout from "./PanelLayout.tsx";
import { AUTH_LOGIN_URL } from "./config.ts";

async function requireAuth({ request }: LoaderFunctionArgs) {
    const FORCE_REDIRECT = false;
    if (FORCE_REDIRECT) {
        return redirect(new URL("/auth", new URL(request.url).origin).toString());
    }
    const token = getToken();
    const result = await introspect(token ?? "");

    if (!result?.active) {
        const loginUrl = AUTH_LOGIN_URL ;
        window.location.href = `${loginUrl}?redirectt_uri=${encodeURIComponent(window.location.href)}`;
        return null;
    }
    return null;
}

export const router = createBrowserRouter(
  [
    { path: "/", loader: requireAuth, element: <PanelLayout /> },
  ],
  { basename: "/storemate" }
);