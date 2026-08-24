import {
    clearCachedJson,
    clearCachedJsonByPrefix,
    getCachedJson,
    setCachedJson,
} from "./apiCache";

export const PROFILE_CACHE_KEY = "account:profile";
export const ORDERS_CACHE_KEY = "account:orders";
export const CART_CACHE_KEY = "account:cart";
const ORDER_DETAILS_CACHE_PREFIX = "account:order:";
const ADMIN_CACHE_PREFIX = "admin:";
const ORDER_DETAILS_STALE_MS = 30 * 60 * 1000;

let pendingProfileRequest = null;
let pendingOrdersRequest = null;
const pendingOrderDetailRequests = new Map();
let pendingRefreshRequest = null;
let accountCacheVersion = 0;

const clearAccountCache = () => {
    accountCacheVersion += 1;
    clearCachedJson(PROFILE_CACHE_KEY);
    clearCachedJson(ORDERS_CACHE_KEY);
    clearCachedJson(CART_CACHE_KEY);
    clearCachedJsonByPrefix(ORDER_DETAILS_CACHE_PREFIX);
    clearCachedJsonByPrefix(ADMIN_CACHE_PREFIX);
    pendingOrderDetailRequests.clear();
    pendingProfileRequest = null;
    pendingOrdersRequest = null;
    pendingRefreshRequest = null;
};

export const saveTokens = (tokens) => {
    clearAccountCache();
    localStorage.setItem("access_token", tokens.access);
    localStorage.setItem("refresh_token", tokens.refresh);
};

export const clearTokens = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    clearAccountCache();
};

export const getAccessToken = () => {
    return localStorage.getItem("access_token");
};

export const getRefreshToken = () => {
    return localStorage.getItem("refresh_token");
};

const refreshAccessToken = () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;
    if (pendingRefreshRequest) return pendingRefreshRequest;

    const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL;
    const requestVersion = accountCacheVersion;
    const request = fetch(`${BASEURL}/api/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
    })
        .then(async (res) => {
            if (!res.ok) {
                if (requestVersion === accountCacheVersion) clearTokens();
                return null;
            }

            const data = await res.json();
            if (
                requestVersion !== accountCacheVersion ||
                getRefreshToken() !== refreshToken
            ) {
                return null;
            }
            localStorage.setItem("access_token", data.access);
            return data.access;
        })
        .catch(() => {
            if (requestVersion === accountCacheVersion) clearTokens();
            return null;
        })
        .finally(() => {
            if (pendingRefreshRequest === request) {
                pendingRefreshRequest = null;
            }
        });

    pendingRefreshRequest = request;
    return pendingRefreshRequest;
};

export const authFetch = async (url, options = {}) => {
    const token = getAccessToken();
    const headers = options.headers ? { ...options.headers } : {};
    const isFormData = options.body instanceof FormData;

    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (!isFormData && options.body && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
    }

    let res = await fetch(url, { ...options, headers });

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

export const getCachedProfile = () => getCachedJson(PROFILE_CACHE_KEY);

export const cacheProfile = (profile) => {
    if (profile) setCachedJson(PROFILE_CACHE_KEY, profile);
};

export const markOrderPlaced = () => {
    const profile = getCachedProfile();
    if (profile) {
        cacheProfile({
            ...profile,
            order_count: Number(profile.order_count || 0) + 1,
        });
    }
    clearCachedJson(ORDERS_CACHE_KEY);
    pendingOrdersRequest = null;
};

export const fetchProfile = async (baseUrl, { force = false } = {}) => {
    if (!force) {
        const cached = getCachedProfile();
        if (cached) return cached;
    }

    if (pendingProfileRequest) return pendingProfileRequest;

    const requestVersion = accountCacheVersion;
    const request = authFetch(`${baseUrl}/api/profile/`)
        .then(async (res) => {
            if (!res.ok) throw new Error("Could not load your account.");
            const profile = await res.json();
            if (
                requestVersion === accountCacheVersion &&
                getAccessToken()
            ) {
                cacheProfile(profile);
            }
            return profile;
        })
        .finally(() => {
            if (pendingProfileRequest === request) {
                pendingProfileRequest = null;
            }
        });

    pendingProfileRequest = request;
    return pendingProfileRequest;
};

export const fetchOrders = async (baseUrl, { force = false } = {}) => {
    if (!force) {
        const cached = getCachedJson(ORDERS_CACHE_KEY);
        if (cached) return cached;
    }

    if (pendingOrdersRequest) return pendingOrdersRequest;

    const requestVersion = accountCacheVersion;
    const request = authFetch(`${baseUrl}/api/orders/`)
        .then(async (res) => {
            if (!res.ok) throw new Error("Could not load your orders.");
            const orders = await res.json();
            if (
                requestVersion === accountCacheVersion &&
                getAccessToken()
            ) {
                setCachedJson(ORDERS_CACHE_KEY, orders);
            }
            return orders;
        })
        .finally(() => {
            if (pendingOrdersRequest === request) {
                pendingOrdersRequest = null;
            }
        });

    pendingOrdersRequest = request;
    return pendingOrdersRequest;
};

const orderDetailsCacheKey = (orderId) =>
    `${ORDER_DETAILS_CACHE_PREFIX}${orderId}`;

export const getCachedOrderDetails = (orderId) =>
    getCachedJson(orderDetailsCacheKey(orderId), ORDER_DETAILS_STALE_MS);

export const cacheOrderDetails = (order) => {
    if (order?.id) setCachedJson(orderDetailsCacheKey(order.id), order);
};

export const fetchOrderDetails = async (
    baseUrl,
    orderId,
    { force = false } = {},
) => {
    if (!force) {
        const cached = getCachedOrderDetails(orderId);
        if (cached) return cached;
    }

    const requestKey = String(orderId);
    const pendingRequest = pendingOrderDetailRequests.get(requestKey);
    if (pendingRequest) return pendingRequest;

    const requestVersion = accountCacheVersion;
    const request = authFetch(`${baseUrl}/api/orders/${orderId}/`)
        .then(async (res) => {
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.detail || "Order not found.");
            if (
                requestVersion === accountCacheVersion &&
                getAccessToken()
            ) {
                cacheOrderDetails(data);
            }
            return data;
        })
        .finally(() => {
            if (pendingOrderDetailRequests.get(requestKey) === request) {
                pendingOrderDetailRequests.delete(requestKey);
            }
        });

    pendingOrderDetailRequests.set(requestKey, request);
    return request;
};

export const preloadOrderDetails = (baseUrl, orderId) =>
    fetchOrderDetails(baseUrl, orderId).catch(() => undefined);
