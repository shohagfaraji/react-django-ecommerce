import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
    FaArrowRight,
    FaChevronLeft,
    FaChevronRight,
    FaFire,
    FaSearch,
    FaShoppingBag,
    FaStar,
    FaTags,
    FaTruck,
} from "react-icons/fa";
import ProductCard from "../components/ProductCard.jsx";
import {
    fetchCachedJson,
    getCachedJson,
    preloadProductImages,
    rememberProducts,
} from "../utils/apiCache";

const loadedHeroImages = new Set();

function ProductList() {
    const [searchParams] = useSearchParams();
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const isFiltered = !!(category || search);

    const [products, setProducts] = useState(
        () =>
            getCachedJson(
                buildProductsCacheKey(category, search, isFiltered),
            ) || [],
    );
    const [homeData, setHomeData] = useState(
        () => getCachedJson("homepage") || null,
    );
    const [loading, setLoading] = useState(
        () =>
            !getCachedJson(buildProductsCacheKey(category, search, isFiltered)),
    );
    const [homeLoading, setHomeLoading] = useState(
        () => !getCachedJson("homepage"),
    );
    const [error, setError] = useState(null);

    const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL;

    useEffect(() => {
        if (isFiltered) return undefined;
        const controller = new AbortController();
        const cachedHome = getCachedJson("homepage");

        if (cachedHome) {
            setHomeData(cachedHome);
            setHomeLoading(false);
            rememberHomeProducts(cachedHome);
        } else {
            setHomeLoading(true);
        }

        fetchCachedJson(`${BASEURL}/api/homepage/`, {
            cacheKey: "homepage",
            errorMessage: "Failed to fetch homepage",
            signal: controller.signal,
        })
            .then((data) => {
                setHomeData(data);
                rememberHomeProducts(data);
                setHomeLoading(false);
            })
            .catch((err) => {
                if (err.name !== "AbortError") {
                    setError(err.message);
                    setHomeLoading(false);
                }
            });

        return () => controller.abort();
    }, [BASEURL, isFiltered]);

    useEffect(() => {
        const controller = new AbortController();
        const params = new URLSearchParams({ limit: isFiltered ? "40" : "12" });

        if (category) params.set("category", category);
        if (search) params.set("search", search);

        const cacheKey = `products:${params.toString()}`;
        const cachedProducts = getCachedJson(cacheKey);

        if (cachedProducts) {
            setProducts(cachedProducts);
            rememberProducts(cachedProducts);
            preloadProductImages(cachedProducts);
            setLoading(false);
        } else {
            setLoading(true);
        }
        setError(null);

        fetchCachedJson(`${BASEURL}/api/products/?${params.toString()}`, {
            cacheKey,
            errorMessage: "Failed to fetch products",
            signal: controller.signal,
        })
            .then((data) => {
                rememberProducts(data);
                preloadProductImages(data);
                setProducts(data);
                setLoading(false);
            })
            .catch((err) => {
                if (err.name !== "AbortError") {
                    setError(err.message);
                    setLoading(false);
                }
            });

        return () => controller.abort();
    }, [BASEURL, category, search, isFiltered]);

    const title = useMemo(() => {
        if (search) return `Search results for "${search}"`;
        if (category) return category.replace(/-/g, " ");
        return "New arrivals";
    }, [category, search]);

    if (error) {
        return (
            <main className="min-h-screen bg-[#f6f7f9] px-4 pt-40 text-center text-rose-600">
                {error}
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#f6f7f9] pt-36 pb-12 md:pt-28">
            <div className="mx-auto max-w-[1440px] space-y-10 px-4 sm:px-6 lg:px-8">
                {isFiltered ? (
                    <>
                        <FilteredHeader
                            title={title}
                            resultCount={products.length}
                            isSearch={!!search}
                        />
                        <ProductSection
                            title={title}
                            eyebrow="Products"
                            icon={<FaSearch />}
                            products={products}
                            loading={loading}
                            emptyCopy="No products matched this category yet."
                        />
                    </>
                ) : (
                    <>
                        <HomeSlider
                            banners={homeData?.hero_banners || []}
                            fallbackProducts={products.slice(0, 4)}
                            loading={homeLoading}
                        />

                        <ProductSection
                            title="Deals"
                            eyebrow="Discounted products"
                            icon={<FaTags />}
                            products={homeData?.offer_products || []}
                            loading={homeLoading}
                            viewAllLink="/sale"
                            emptyCopy="No discounted products right now."
                        />

                        <ProductSection
                            title="Most Selling & Hot"
                            eyebrow="Customer demand"
                            icon={<FaFire />}
                            products={homeData?.hot_products || []}
                            loading={homeLoading}
                            viewAllLink="/weekly-top-selling"
                            emptyCopy="Top-selling products will appear here as your catalog grows."
                        />

                        {(homeData?.category_sections || [])
                            .filter(
                                (section) =>
                                    section.category?.section !==
                                        "electronics" &&
                                    section.category?.slug !== "electronics",
                            )
                            .filter((section) => section.products?.length > 0)
                            .map((section) => (
                                <ProductSection
                                    key={section.category.slug}
                                    title={section.category.name}
                                    eyebrow="Shop by category"
                                    icon={<FaShoppingBag />}
                                    products={section.products}
                                    loading={homeLoading}
                                    viewAllLink={`/products?category=${section.category.slug}`}
                                    emptyCopy=""
                                />
                            ))}

                        <ProductSection
                            title="New Arrivals"
                            eyebrow="Fresh in store"
                            icon={<FaStar />}
                            products={products}
                            loading={loading}
                            viewAllLink="/new-arrivals"
                            emptyCopy="No products have been added yet."
                        />
                    </>
                )}
            </div>
        </main>
    );
}

function buildProductsCacheKey(category, search, isFiltered) {
    const params = new URLSearchParams({ limit: isFiltered ? "40" : "12" });

    if (category) params.set("category", category);
    if (search) params.set("search", search);

    return `products:${params.toString()}`;
}

function rememberHomeProducts(homeData) {
    const sectionProducts =
        homeData?.category_sections?.flatMap(
            (section) => section.products || [],
        ) || [];
    const products = [
        ...(homeData?.offer_products || []),
        ...(homeData?.hot_products || []),
        ...sectionProducts,
    ];

    rememberProducts(products);
    preloadProductImages(products, 24);
}

function HomeSlider({ banners, fallbackProducts, loading }) {
    const [active, setActive] = useState(0);
    const hasBanners = banners.length > 0;
    const slides = hasBanners ? banners : buildFallbackSlides(fallbackProducts);

    useEffect(() => {
        if (slides.length < 2) return undefined;
        const timer = setInterval(() => {
            setActive((current) => (current + 1) % slides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [slides.length]);

    useEffect(() => {
        slides.slice(0, 3).forEach((slide) => {
            if (!slide.image_url || loadedHeroImages.has(slide.image_url))
                return;
            const preview = new Image();
            preview.onload = () => loadedHeroImages.add(slide.image_url);
            preview.src = slide.image_url;
        });
    }, [slides]);

    useEffect(() => {
        setActive(0);
    }, [hasBanners]);

    if (loading) return <HeroSkeleton />;

    const slide = slides[active] || buildFallbackSlides([])[0];

    return (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="grid min-h-[360px] lg:grid-cols-[1.1fr_0.9fr]">
                <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
                    <p className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-700">
                        <FaTruck />
                        All products marketplace
                    </p>
                    <h1 className="max-w-3xl text-4xl font-black leading-tight text-slate-950 sm:text-5xl">
                        {slide.title}
                    </h1>
                    <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
                        {slide.subtitle}
                    </p>
                    <div className="mt-7 flex flex-wrap gap-3">
                        <Link
                            to={slide.target_url || "/products"}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-slate-800"
                        >
                            {slide.button_text || "Shop now"}
                            <FaArrowRight />
                        </Link>
                        <Link
                            to="/sale"
                            className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 px-5 text-sm font-black text-slate-800 transition hover:bg-slate-50"
                        >
                            View offers
                        </Link>
                    </div>
                </div>

                <div className="relative min-h-[300px] bg-slate-100">
                    <SliderVisual image={slide.image_url} title={slide.title} />

                    {slides.length > 1 && (
                        <div className="absolute bottom-4 right-4 flex gap-2">
                            <button
                                type="button"
                                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow"
                                onClick={() =>
                                    setActive(
                                        (active - 1 + slides.length) %
                                            slides.length,
                                    )
                                }
                                aria-label="Previous banner"
                            >
                                <FaChevronLeft />
                            </button>
                            <button
                                type="button"
                                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow"
                                onClick={() =>
                                    setActive((active + 1) % slides.length)
                                }
                                aria-label="Next banner"
                            >
                                <FaChevronRight />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

function SliderVisual({ image, title }) {
    const [visibleImage, setVisibleImage] = useState(
        image && loadedHeroImages.has(image) ? image : null,
    );
    const [incomingImage, setIncomingImage] = useState(null);
    const [status, setStatus] = useState(image ? "loading" : "missing");

    useEffect(() => {
        if (!image) {
            setStatus("missing");
            setIncomingImage(null);
            return undefined;
        }

        if (image === visibleImage) {
            setStatus("loaded");
            return undefined;
        }

        let cancelled = false;
        let transitionTimer;

        const revealImage = () => {
            if (cancelled) return;
            setIncomingImage(image);
            setStatus("loaded");
            transitionTimer = setTimeout(() => {
                if (cancelled) return;
                setVisibleImage(image);
                setIncomingImage(null);
            }, 520);
        };

        if (loadedHeroImages.has(image)) {
            revealImage();
        } else {
            const preview = new Image();
            setStatus(visibleImage ? "loading-next" : "loading");

            preview.onload = () => {
                loadedHeroImages.add(image);
                revealImage();
            };
            preview.onerror = () => {
                if (!cancelled) setStatus(visibleImage ? "loaded" : "failed");
            };
            preview.src = image;
        }

        return () => {
            cancelled = true;
            clearTimeout(transitionTimer);
        };
    }, [image, visibleImage]);

    if (visibleImage || incomingImage) {
        return (
            <div className="absolute inset-0 min-h-[300px] overflow-hidden bg-slate-950">
                {visibleImage && (
                    <div
                        role="img"
                        aria-label={title}
                        className="absolute inset-0 bg-cover bg-center"
                        style={{
                            backgroundImage: `url("${visibleImage}")`,
                        }}
                    />
                )}
                {incomingImage && (
                    <div
                        role="img"
                        aria-label={title}
                        className="absolute inset-0 bg-cover bg-center opacity-0 animate-[heroFadeIn_520ms_ease-out_forwards]"
                        style={{
                            backgroundImage: `url("${incomingImage}")`,
                        }}
                    />
                )}
            </div>
        );
    }

    if (image && status === "loading") {
        return (
            <div className="relative h-full min-h-[300px] overflow-hidden">
                <HeroImagePlaceholder title={title} subdued />
                <div
                    className="absolute inset-0 animate-pulse bg-white/5"
                    aria-hidden="true"
                />
            </div>
        );
    }

    if (image && status === "loaded") {
        return (
            <div
                role="img"
                aria-label={title}
                className="absolute inset-0 min-h-[300px] bg-cover bg-center transition-opacity duration-500"
                style={{
                    backgroundImage: `url("${image}")`,
                }}
            />
        );
    }

    return <HeroImagePlaceholder title={title} />;
}

function HeroImagePlaceholder({ title, subdued = false }) {
    return (
        <div
            className={`flex h-full min-h-[300px] items-center justify-center bg-slate-950 p-8 text-white ${
                subdued ? "opacity-90" : ""
            }`}
        >
            <div className="max-w-sm text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-2xl">
                    <FaShoppingBag />
                </div>
                <p className="mt-5 text-xs font-black uppercase tracking-wide text-emerald-300">
                    Marketplace banner
                </p>
                <p className="mt-2 text-2xl font-black leading-tight">
                    {title || "Upload a hero image from admin"}
                </p>
            </div>
        </div>
    );
}

function buildFallbackSlides(products) {
    return [
        {
            title: "Shop every department from one organized marketplace.",
            subtitle:
                "Fashion, electronics, kids items, indoor plants, home essentials, beauty, sports, and daily needs are arranged for quick browsing.",
            button_text: "Explore departments",
            target_url: "/products",
        },
        ...products.slice(0, 2).map((product) => ({
            title: product.name,
            subtitle: product.description,
            button_text: "View product",
            target_url: `/product/${product.id}`,
            image_url: product.image_url,
        })),
    ];
}

function FilteredHeader({ title, resultCount, isSearch }) {
    return (
        <section className="rounded-xl border border-slate-200 bg-white px-5 py-6 shadow-sm sm:px-6">
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                {isSearch ? "Search" : "Department"}
            </p>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="capitalize text-3xl font-black text-slate-950">
                        {title}
                    </h1>
                    <p className="mt-2 text-sm text-slate-500">
                        {resultCount} product{resultCount === 1 ? "" : "s"}{" "}
                        found
                    </p>
                </div>
                <Link
                    to="/"
                    className="inline-flex h-10 w-fit items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
                >
                    Clear filters
                </Link>
            </div>
        </section>
    );
}

function ProductSection({
    title,
    eyebrow,
    icon,
    products,
    loading,
    viewAllLink,
    emptyCopy,
}) {
    if (!loading && !products.length && !emptyCopy) return null;

    return (
        <section>
            <div className="mb-5 flex items-end justify-between gap-4">
                <div className="min-w-0">
                    <div className="mb-2 flex items-center gap-2 text-emerald-700">
                        {icon}
                        <p className="text-xs font-black uppercase tracking-wide">
                            {eyebrow}
                        </p>
                    </div>
                    <h2 className="capitalize text-2xl font-black text-slate-950 sm:text-3xl">
                        {title}
                    </h2>
                </div>
                {viewAllLink && (
                    <Link
                        to={viewAllLink}
                        className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-bold text-slate-700 transition hover:bg-white sm:px-4"
                    >
                        <span className="hidden sm:inline">View all</span>
                        <FaArrowRight className="text-xs" />
                    </Link>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {loading
                    ? Array.from({ length: 5 }).map((_, index) => (
                          <SkeletonCard key={index} />
                      ))
                    : products.map((product) => (
                          <ProductCard key={product.id} product={product} />
                      ))}

                {!loading && products.length === 0 && (
                    <EmptyProducts copy={emptyCopy} />
                )}
            </div>
        </section>
    );
}

function HeroSkeleton() {
    return (
        <div className="grid min-h-[360px] animate-pulse overflow-hidden rounded-xl border border-slate-200 bg-white lg:grid-cols-2">
            <div className="space-y-5 p-8">
                <div className="h-5 w-40 rounded bg-slate-100" />
                <div className="h-12 w-3/4 rounded bg-slate-100" />
                <div className="h-4 w-full rounded bg-slate-100" />
                <div className="h-4 w-2/3 rounded bg-slate-100" />
                <div className="h-11 w-36 rounded bg-slate-100" />
            </div>
            <div className="bg-slate-100" />
        </div>
    );
}

function SkeletonCard() {
    return (
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <div className="aspect-square animate-pulse rounded-md bg-slate-100" />
            <div className="mt-4 space-y-3">
                <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
                <div className="h-10 w-full animate-pulse rounded bg-slate-100" />
            </div>
        </div>
    );
}

function EmptyProducts({ copy }) {
    return (
        <div className="col-span-full rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <p className="text-lg font-black text-slate-900">
                Nothing to show yet
            </p>
            <p className="mt-2 text-sm text-slate-500">{copy}</p>
        </div>
    );
}

export default ProductList;
