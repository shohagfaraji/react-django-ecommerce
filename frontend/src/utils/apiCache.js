const DEFAULT_STALE_MS = 5 * 60 * 1000;
const apiCache = new Map();
const preloadedImages = new Set();
const pendingImagePreloads = new Map();
const pendingRequests = new Map();
const SESSION_PREFIX = "winkelo-api:";

export function getCachedJson(cacheKey, staleMs = DEFAULT_STALE_MS) {
    let cached = apiCache.get(cacheKey);

    if (!cached) {
        try {
            const stored = sessionStorage.getItem(`${SESSION_PREFIX}${cacheKey}`);
            cached = stored ? JSON.parse(stored) : undefined;
            if (cached) apiCache.set(cacheKey, cached);
        } catch {
            return undefined;
        }
    }

    if (!cached) return undefined;

    if (Date.now() - cached.cachedAt > staleMs) {
        apiCache.delete(cacheKey);
        try {
            sessionStorage.removeItem(`${SESSION_PREFIX}${cacheKey}`);
        } catch {
            return undefined;
        }
        return undefined;
    }

    return cached.data;
}

export function setCachedJson(cacheKey, data) {
    const entry = {
        data,
        cachedAt: Date.now(),
    };
    apiCache.set(cacheKey, entry);

    if (!cacheKey.startsWith("product:")) {
        try {
            sessionStorage.setItem(`${SESSION_PREFIX}${cacheKey}`, JSON.stringify(entry));
        } catch {
            return;
        }
    }
}

export function clearCachedJson(cacheKey) {
    apiCache.delete(cacheKey);
    pendingRequests.delete(cacheKey);

    try {
        sessionStorage.removeItem(`${SESSION_PREFIX}${cacheKey}`);
    } catch {
        return;
    }
}

export function clearCachedJsonByPrefix(cacheKeyPrefix) {
    for (const cacheKey of apiCache.keys()) {
        if (cacheKey.startsWith(cacheKeyPrefix)) {
            apiCache.delete(cacheKey);
            pendingRequests.delete(cacheKey);
        }
    }

    try {
        const storagePrefix = `${SESSION_PREFIX}${cacheKeyPrefix}`;
        const matchingKeys = [];
        for (let index = 0; index < sessionStorage.length; index += 1) {
            const key = sessionStorage.key(index);
            if (key?.startsWith(storagePrefix)) matchingKeys.push(key);
        }
        matchingKeys.forEach((key) => sessionStorage.removeItem(key));
    } catch {
        return;
    }
}

export async function fetchCachedJson(
    url,
    {
        cacheKey = url,
        errorMessage = "Failed to fetch data",
        signal,
        staleMs = DEFAULT_STALE_MS,
    } = {},
) {
    const cached = getCachedJson(cacheKey, staleMs);
    if (cached !== undefined) return cached;

    if (pendingRequests.has(cacheKey)) return pendingRequests.get(cacheKey);

    const request = fetch(url)
        .then((res) => {
            if (!res.ok) throw new Error(errorMessage);
            return res.json();
        })
        .then((data) => {
            setCachedJson(cacheKey, data);
            return data;
        })
        .finally(() => pendingRequests.delete(cacheKey));

    pendingRequests.set(cacheKey, request);
    if (!signal) return request;
    if (signal.aborted) {
        throw new DOMException("The operation was aborted.", "AbortError");
    }

    return Promise.race([
        request,
        new Promise((_, reject) => {
            signal.addEventListener(
                "abort",
                () =>
                    reject(
                        new DOMException(
                            "The operation was aborted.",
                            "AbortError",
                        ),
                    ),
                { once: true },
            );
        }),
    ]);
}

export function productCacheKey(productId) {
    return `product:${productId}`;
}

export function productDetailsCacheKey(productId) {
    return `product-details:${productId}`;
}

export function productReviewsCacheKey(productId) {
    return `product-reviews:${productId}`;
}

export function getCachedProductDetails(productId) {
    return getCachedJson(productDetailsCacheKey(productId));
}

export function getCachedProduct(productId) {
    return (
        getCachedProductDetails(productId) ||
        getCachedJson(productCacheKey(productId))
    );
}

export function rememberProducts(products) {
    if (!Array.isArray(products)) return;

    products.forEach((product) => {
        if (product?.id) {
            setCachedJson(productCacheKey(product.id), product);
        }
    });
}

export function rememberProductDetails(product) {
    if (!product?.id) return;
    setCachedJson(productDetailsCacheKey(product.id), product);
    setCachedJson(productCacheKey(product.id), product);
}

export function preloadProductDetails(baseUrl, productId) {
    return fetchCachedJson(`${baseUrl}/api/product/${productId}/`, {
        cacheKey: productDetailsCacheKey(productId),
        errorMessage: "Failed to fetch product",
    }).then((product) => {
        rememberProductDetails(product);
        preloadImage(product.image_url);
        return product;
    });
}

export function clearProductData(productId) {
    clearCachedJson(productCacheKey(productId));
    clearCachedJson(productDetailsCacheKey(productId));
    clearCachedJson(productReviewsCacheKey(productId));
}

export function preloadImage(src) {
    if (!src || preloadedImages.has(src)) return Promise.resolve();
    if (pendingImagePreloads.has(src)) return pendingImagePreloads.get(src);

    const preload = new Promise((resolve) => {
        const image = new Image();
        image.onload = () => {
            preloadedImages.add(src);
            resolve();
        };
        image.onerror = resolve;
        image.src = src;
    }).finally(() => pendingImagePreloads.delete(src));

    pendingImagePreloads.set(src, preload);
    return preload;
}
