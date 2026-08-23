import { authFetch } from "./auth";

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

