import {
    fetchCachedJson,
    getCachedJson,
    preloadImage,
    rememberProducts,
} from "./apiCache";

export const CATALOG_PAGE_SIZE = 20;
const API_PAGE_SIZE = CATALOG_PAGE_SIZE + 1;

const CATALOGS = {
    "new-arrivals": {
        path: "/new-arrivals",
        endpoint: "/api/products/new-arrivals/",
        cachePrefix: "products:new-arrivals",
    },
    sale: {
        path: "/sale",
        endpoint: "/api/products/sale/",
        cachePrefix: "products:sale",
    },
    "weekly-top-selling": {
        path: "/weekly-top-selling",
        endpoint: "/api/products/weekly-top-selling/",
        cachePrefix: "products:weekly-top-selling",
    },
};

export function getCatalogConfig(catalog) {
    return CATALOGS[catalog];
}

export function catalogPageCacheKey(catalog, offset = 0) {
    const config = getCatalogConfig(catalog);
    return `${config.cachePrefix}:limit=${API_PAGE_SIZE}:offset=${offset}`;
}

export function getCachedCatalogPage(catalog, offset = 0) {
    return getCachedJson(catalogPageCacheKey(catalog, offset));
}

export function getCatalogSeed(catalog) {
    const homepage = getCachedJson("homepage");

    if (catalog === "new-arrivals") {
        return getCachedJson("products:limit=15") || [];
    }
    if (catalog === "sale") {
        return homepage?.offer_products || [];
    }
    if (catalog === "weekly-top-selling") {
        return (homepage?.hot_products || []).filter(
            (product) => product.is_weekly_top,
        );
    }
    return [];
}

export function fetchCatalogPage(baseUrl, catalog, offset = 0) {
    const config = getCatalogConfig(catalog);
    const params = new URLSearchParams({
        limit: String(API_PAGE_SIZE),
        offset: String(offset),
    });

    return fetchCachedJson(`${baseUrl}${config.endpoint}?${params}`, {
        cacheKey: catalogPageCacheKey(catalog, offset),
        errorMessage: "Could not load these products.",
    }).then((products) => {
        rememberProducts(products);
        return products;
    });
}

export function productListingPageCacheKey({
    category = "",
    search = "",
    offset = 0,
}) {
    const params = buildProductListingParams({ category, search, offset });
    return `products:${params.toString()}`;
}

export function getCachedProductListingPage(filters) {
    return getCachedJson(productListingPageCacheKey(filters));
}

export function fetchProductListingPage(baseUrl, filters = {}) {
    const params = buildProductListingParams(filters);
    return fetchCachedJson(`${baseUrl}/api/products/?${params}`, {
        cacheKey: `products:${params.toString()}`,
        errorMessage: "Could not load the product catalog.",
    }).then((products) => {
        rememberProducts(products);
        return products;
    });
}

export function preloadCatalogDestination(baseUrl, target) {
    const destination = new URL(target, window.location.origin);
    const catalog = Object.keys(CATALOGS).find(
        (key) => CATALOGS[key].path === destination.pathname,
    );

    const request = catalog
        ? fetchCatalogPage(baseUrl, catalog)
        : destination.pathname === "/products" ||
            (destination.pathname === "/" &&
                (destination.searchParams.has("category") ||
                    destination.searchParams.has("search")))
          ? fetchProductListingPage(baseUrl, {
                category: destination.searchParams.get("category") || "",
                search: destination.searchParams.get("search") || "",
            })
          : null;

    if (!request) return Promise.resolve();
    if (!catalog) return request.then(() => undefined);
    return request.then((products) =>
        Promise.all(
            products
                .slice(0, 2)
                .map((product) => preloadImage(product.image_url)),
        ),
    );
}

function buildProductListingParams({
    category = "",
    search = "",
    offset = 0,
}) {
    const params = new URLSearchParams();
    const normalizedCategory = category.trim().toLowerCase();
    const normalizedSearch = search.trim().toLowerCase();

    if (normalizedCategory) params.set("category", normalizedCategory);
    if (normalizedSearch) params.set("search", normalizedSearch);
    params.set("limit", String(API_PAGE_SIZE));
    params.set("offset", String(offset));
    return params;
}
