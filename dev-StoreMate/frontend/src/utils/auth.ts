export function getCookie(name: string): string | null {
  const prefix = name + "=";
  const cookies = document.cookie ? document.cookie.split("; ") : [];
  for (const c of cookies) {
    if (c.startsWith(prefix)) return decodeURIComponent(c.slice(prefix.length));
  }
  return null;
}

export function getToken(): string | null {
    let t = localStorage.getItem("token");
    if (!t) {
        const c = getCookie("access_token");
        if (c) {
            localStorage.setItem("token", c);
            t = c;
        }
    }
    return t;
}

export async function introspect(token: string) {
    const res = await fetch("/auth/introspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
    });
    if (!res.ok) return { active: false };
    return res.json();
}