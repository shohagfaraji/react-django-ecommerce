export const saveTokens = (tokens) => {
    localStorage.setItem("access_token", tokens.access);
    localStorage.setItem("refresh_token", tokens.refresh);
};

export const clearTokens = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
};

export const getAccessToken = () => {
    return localStorage.getItem("access_token");
};

export const getRefreshToken = () => {
    return localStorage.getItem("refresh_token");
};

// Calls the backend's /api/token/refresh/ endpoint to get a new access token
// using the stored refresh token. Returns the new access token, or null if
// the refresh failed (e.g. refresh token also expired) — in which case the
// stored tokens are cleared so the app treats the user as logged out.
const refreshAccessToken = async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;

    const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL;

    try {
        const res = await fetch(`${BASEURL}/api/token/refresh/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh: refreshToken }),
        });

        if (!res.ok) {
            clearTokens();
            return null;
        }

        const data = await res.json();
        localStorage.setItem("access_token", data.access);
        return data.access;
    } catch (error) {
        clearTokens();
        return null;
    }
};

export const authFetch = async (url, options = {}) => {
    const token = getAccessToken();
    const headers = options.headers ? { ...options.headers } : {};

    if (token) headers["Authorization"] = `Bearer ${token}`;
    headers["Content-Type"] = "application/json";

    let res = await fetch(url, { ...options, headers });

    // Access token expired or invalid — try refreshing once, then retry the request
    if (res.status === 401) {
        const newToken = await refreshAccessToken();

        if (newToken) {
            const retryHeaders = {
                ...headers,
                Authorization: `Bearer ${newToken}`,
            };
            res = await fetch(url, { ...options, headers: retryHeaders });
        }
    }

    return res;
};