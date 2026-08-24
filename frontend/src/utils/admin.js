import { authFetch, getAccessToken } from "./auth";
import { getCachedJson, setCachedJson } from "./apiCache";

const ADMIN_CACHE_PREFIX = "admin:";
const pendingAdminRequests = new Map();

const adminCacheKey = (path) => `${ADMIN_CACHE_PREFIX}${path}`;

const firstError = (value) => {
    if (typeof value === "string") return value;
    if (Array.isArray(value)) return firstError(value[0]);
    if (value && typeof value === "object") {
        for (const item of Object.values(value)) {
            const message = firstError(item);
            if (message) return message;
        }
    }
    return "The request could not be completed.";
};

export const adminRequest = async (baseUrl, path, options = {}) => {
    const response = await authFetch(`${baseUrl}/api/admin/${path}`, options);
    if (response.status === 204) return null;

    let data = null;
    try {
        data = await response.json();
    } catch {
        data = null;
    }

    if (!response.ok) {
        const error = new Error(firstError(data));
        error.status = response.status;
        throw error;
    }
    return data;
};

export const getCachedAdminData = (path) =>
    getCachedJson(adminCacheKey(path));

export const cacheAdminData = (path, data) =>
    setCachedJson(adminCacheKey(path), data);

export const fetchAdminData = (baseUrl, path) => {
    const accessToken = getAccessToken();
    const requestKey = `${accessToken}:${path}`;
    if (pendingAdminRequests.has(requestKey)) {
        return pendingAdminRequests.get(requestKey);
    }

    const request = adminRequest(baseUrl, path)
        .then((data) => {
            if (getAccessToken() === accessToken) {
                cacheAdminData(path, data);
            }
            return data;
        })
        .finally(() => pendingAdminRequests.delete(requestKey));

    pendingAdminRequests.set(requestKey, request);
    return request;
};
