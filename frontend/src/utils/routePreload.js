import { preloadCatalogDestination } from "./catalog";

const routeLoaders = {
    "/compare": () => import("../pages/CompareProducts"),
    "/new-arrivals": () => import("../pages/NewArrivals"),
    "/sale": () => import("../pages/SaleProducts"),
    "/weekly-top-selling": () => import("../pages/WeeklyTopSelling"),
};

export function preloadRoute(baseUrl, target) {
    const destination = new URL(target, window.location.origin);
    const loadRoute = routeLoaders[destination.pathname];
    if (loadRoute) void loadRoute();
    void preloadCatalogDestination(baseUrl, target).catch(() => undefined);
}
