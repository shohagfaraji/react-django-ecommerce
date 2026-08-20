import { useEffect, useState } from "react";
import ProductCard from "./ProductCard.jsx";
import {
    CATALOG_PAGE_SIZE,
    fetchCatalogPage,
    getCachedCatalogPage,
    getCatalogSeed,
} from "../utils/catalog";

function visibleProducts(products) {
    return products.slice(0, CATALOG_PAGE_SIZE);
}

function mergeProducts(current, additions) {
    const productsById = new Map(
        current.map((product) => [product.id, product]),
    );
    additions.forEach((product) => productsById.set(product.id, product));
    return Array.from(productsById.values());
}

function CatalogProductsPage({
    catalog,
    title,
    icon,
    iconClassName,
    emptyCopy,
    countLabel,
}) {
    const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL;
    const cachedPage = getCachedCatalogPage(catalog);
    const initialProducts = cachedPage
        ? visibleProducts(cachedPage)
        : getCatalogSeed(catalog);
    const [request, setRequest] = useState(() => ({
        products: initialProducts,
        loading: initialProducts.length === 0,
        loadingMore: false,
        error: "",
        nextOffset: CATALOG_PAGE_SIZE,
        hasMore: cachedPage ? cachedPage.length > CATALOG_PAGE_SIZE : true,
        pageReady: Boolean(cachedPage),
    }));

    useEffect(() => {
        let active = true;

        fetchCatalogPage(BASEURL, catalog)
            .then((products) => {
                if (!active) return;
                setRequest({
                    products: visibleProducts(products),
                    loading: false,
                    loadingMore: false,
                    error: "",
                    nextOffset: CATALOG_PAGE_SIZE,
                    hasMore: products.length > CATALOG_PAGE_SIZE,
                    pageReady: true,
                });
            })
            .catch((error) => {
                if (!active) return;
                setRequest((current) => ({
                    ...current,
                    loading: false,
                    error: error.message,
                    hasMore: false,
                }));
            });

        return () => {
            active = false;
        };
    }, [BASEURL, catalog]);

    const loadMore = async () => {
        const offset = request.nextOffset;
        setRequest((current) => ({ ...current, loadingMore: true }));
        try {
            const products = await fetchCatalogPage(BASEURL, catalog, offset);
            setRequest((current) => ({
                ...current,
                products: mergeProducts(
                    current.products,
                    visibleProducts(products),
                ),
                loadingMore: false,
                error: "",
                nextOffset: offset + CATALOG_PAGE_SIZE,
                hasMore: products.length > CATALOG_PAGE_SIZE,
            }));
        } catch (error) {
            setRequest((current) => ({
                ...current,
                loadingMore: false,
                error: error.message,
            }));
        }
    };

    if (request.error && request.products.length === 0) {
        return (
            <main className="min-h-screen bg-gray-100 px-4 pt-36 text-center font-bold text-[#b62324] md:pt-28">
                {request.error}
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-100 px-2 pt-36 pb-12 sm:px-6 md:pt-28 lg:px-8">
            <div className="mx-auto max-w-[1440px]">
                <header className="mb-6 flex flex-wrap items-center gap-3">
                    <span className={`text-2xl ${iconClassName}`}>{icon}</span>
                    <h1 className="text-3xl font-black text-slate-900">
                        {title}
                    </h1>
                    {!request.loading && request.products.length > 0 && countLabel && (
                        <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-black text-white">
                            {request.products.length}
                            {request.hasMore ? "+" : ""} {countLabel}
                        </span>
                    )}
                </header>

                <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
                    {request.loading
                        ? Array.from({ length: 10 }).map((_, index) => (
                              <SkeletonCard key={index} />
                          ))
                        : request.products.map((product, index) => (
                              <ProductCard
                                  key={product.id}
                                  product={product}
                                  prioritizeImage={index < 2}
                              />
                          ))}

                    {!request.loading && request.products.length === 0 && (
                        <p className="col-span-full py-20 text-center text-slate-500">
                            {emptyCopy}
                        </p>
                    )}
                </div>

                {request.hasMore && !request.loading && request.pageReady && (
                    <div className="mt-8 text-center">
                        <button
                            type="button"
                            onClick={loadMore}
                            disabled={request.loadingMore}
                            className="h-12 rounded-xl bg-slate-950 px-8 text-base font-black text-white transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60"
                        >
                            {request.loadingMore
                                ? "Loading products..."
                                : "Load more products"}
                        </button>
                    </div>
                )}

                {request.error && request.products.length > 0 && (
                    <p className="mt-5 text-center text-sm font-bold text-[#b62324]">
                        {request.error}
                    </p>
                )}
            </div>
        </main>
    );
}

function SkeletonCard() {
    return (
        <div className="animate-pulse overflow-hidden rounded-xl bg-white shadow-sm">
            <div className="aspect-square w-full bg-slate-200" />
            <div className="space-y-2 p-3">
                <div className="h-4 w-3/4 rounded bg-slate-200" />
                <div className="h-4 w-1/2 rounded bg-slate-200" />
            </div>
        </div>
    );
}

export default CatalogProductsPage;
