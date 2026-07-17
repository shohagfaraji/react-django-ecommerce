const DEFAULT_STALE_MS = 5 * 60 * 1000;
const apiCache = new Map();
const preloadedImages = new Set();

export function getCachedJson(cacheKey, staleMs = DEFAULT_STALE_MS) {
    const cached = apiCache.get(cacheKey);
    if (!cached) return undefined;

    if (Date.now() - cached.cachedAt > staleMs) {
        apiCache.delete(cacheKey);
        return undefined;
    }

    return cached.data;
}

export function setCachedJson(cacheKey, data) {
    apiCache.set(cacheKey, {
        data,
        cachedAt: Date.now(),
    });
}

export async function fetchCachedJson(
    url,
    { cacheKey = url, errorMessage = "Failed to fetch data", signal } = {},
) {
    const cached = getCachedJson(cacheKey);
    if (cached !== undefined) return cached;

    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(errorMessage);

    const data = await res.json();
    setCachedJson(cacheKey, data);
    return data;
}

export function productCacheKey(productId) {
    return `product:${productId}`;
}

export function getCachedProduct(productId) {
    return getCachedJson(productCacheKey(productId));
}

export function rememberProducts(products) {
    if (!Array.isArray(products)) return;

    products.forEach((product) => {
        if (product?.id) {
            setCachedJson(productCacheKey(product.id), product);
        }
    });
}

export function preloadImage(src) {
    if (!src || preloadedImages.has(src)) return;

    preloadedImages.add(src);
    const image = new Image();
    image.onerror = () => preloadedImages.delete(src);
    image.src = src;
}

export function preloadProductImages(products, limit = 16) {
    if (!Array.isArray(products)) return;

    products.slice(0, limit).forEach((product) => {
        preloadImage(product?.image_url || product?.product_image);
    });
}
