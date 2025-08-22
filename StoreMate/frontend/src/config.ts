export const LOGIN_URL = "/auth/";
export const CALLBACK_PATH = "/auth/callback";
export const AUTH_LOGIN_URL = LOGIN_URL;
export function buildLoginRedirectUrl(currentPath: string = window.location.pathname + window.location.search) {
    const redirectUri = encodeURIComponent(
        window.location.origin + CALLBACK_PATH + "?next=" + encodeURIComponent(currentPath) + "&token_invalid=true"
    );
    return `${LOGIN_URL}?redirect_uri=${redirectUri}`;
}