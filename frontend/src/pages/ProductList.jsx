import { useEffect, useState } from "react";
import ProductCard from "../components/ProductCard.jsx";
import { useSearchParams, Link } from "react-router-dom";
import { FaFire, FaStar, FaBolt } from "react-icons/fa";

function ProductList() {
    /* ================= URL PARAM ================= */
    const [searchParams] = useSearchParams();
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    /* ================= STATE ================= */
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL;

    /* ================= OFFER BANNER STATE ================= */
    const [offerBanner, setOfferBanner] = useState(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [countdownLabel, setCountdownLabel] = useState("");

    /* ================= FETCH PRODUCTS ================= */
    useEffect(() => {
        const controller = new AbortController();

        let url = `${BASEURL}/api/products/?limit=20`;

        if (category) url += `&category=${category}`;
        if (search) url += `&search=${search}`;

        fetch(url, { signal: controller.signal })
            .then((res) => {
                if (!res.ok) throw new Error("Failed to fetch products");
                return res.json();
            })
            .then((data) => {
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
    }, [category, search]);

    /* ================= FETCH OFFER BANNER ================= */
    useEffect(() => {
        fetch(`${BASEURL}/api/offer-banner/`)
            .then((res) => res.json())
            .then((data) => {
                if (!data) return;
                setOfferBanner(data);
                const now = new Date();
                const start = new Date(data.event_start);
                const end = new Date(data.event_end);
                if (now < start) {
                    setTimeLeft(Math.floor((start - now) / 1000));
                    setCountdownLabel("Offer starts in");
                } else {
                    setTimeLeft(Math.floor((end - now) / 1000));
                    setCountdownLabel("Offer ends in");
                }
            })
            .catch(() => {});
    }, []);

    /* ================= COUNTDOWN TICK ================= */
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    /* ================= FORMAT TIME ================= */
    const formatTime = (seconds) => {
        const days = Math.floor(seconds / (3600 * 24));
        const hrs = Math.floor((seconds % (3600 * 24)) / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return { days, hrs, mins, secs };
    };

    const { days, hrs, mins, secs } = formatTime(timeLeft);

    /* ================= DATA DERIVATION ================= */
    const isFiltered = !!(category || search);
    const newArrivals = products.slice(0, 10);
    const topSelling = isFiltered
        ? products.slice(0, 10)
        : products.slice(10, 20);

    /* ================= LOADING & ERROR ================= */
    if (error)
        return <div className="pt-24 text-center text-red-500">{error}</div>;

    /* ================= UI ================= */
    return (
        <div className="bg-gray-100 min-h-screen pt-28 md:pt-20 pb-10 space-y-10">
            {/* ================= HERO SECTION ================= */}
            {!category && !search && offerBanner && (
                <OfferHero
                    banner={offerBanner}
                    days={days}
                    hrs={hrs}
                    mins={mins}
                    secs={secs}
                    countdownLabel={countdownLabel}
                />
            )}

            {/* ================= TOP SELLING ================= */}
            {!isFiltered && (
                <Section
                    title="Top Selling"
                    icon={<FaStar />}
                    products={topSelling}
                    loading={loading}
                    viewAllLink="/weekly-top-selling"
                />
            )}

            {/* ================= NEW ARRIVALS / RESULTS ================= */}
            <Section
                title={
                    isFiltered
                        ? category
                            ? `${category.replace(/-/g, " ")}`
                            : "Search Results"
                        : "New Arrivals"
                }
                icon={<FaFire />}
                products={newArrivals}
                loading={loading}
                viewAllLink={!isFiltered ? "/new-arrivals" : undefined}
            />
        </div>
    );
}

/* ================= OFFER HERO ================= */
function OfferHero({ banner, days, hrs, mins, secs, countdownLabel }) {
    return (
        <section
            className={`relative overflow-hidden text-white p-10 md:p-14 mx-4 rounded-2xl shadow-xl ${getThemeClasses(banner.theme)}`}
        >
            <ThemeBackground theme={banner.theme} />

            <div className="relative z-10 text-center">
                <span className="inline-block bg-white/20 backdrop-blur-sm text-xs uppercase tracking-widest px-4 py-1 rounded-full mb-4 font-semibold">
                    Up to {banner.max_discount}% Off
                </span>

                <div className="flex justify-center items-center gap-3 mb-3">
                    <FaFire className="text-yellow-300 text-2xl" />
                    <h1 className="text-4xl md:text-5xl font-bold drop-shadow-md">
                        {banner.title}
                    </h1>
                </div>

                {banner.tagline && (
                    <p className="text-lg opacity-90 mb-6">{banner.tagline}</p>
                )}

                <p className="text-sm uppercase tracking-widest opacity-70 mb-3">
                    {countdownLabel}
                </p>

                <div className="flex justify-center gap-4 flex-wrap">
                    <TimeBox label="Days" value={days} />
                    <TimeBox label="Hours" value={hrs} />
                    <TimeBox label="Minutes" value={mins} />
                    <TimeBox label="Seconds" value={secs} />
                </div>

                <button className="mt-10 bg-white text-teal-700 px-8 py-3 rounded-xl font-semibold hover:bg-gray-100 flex items-center gap-2 mx-auto">
                    <FaBolt />
                    Shop Deals
                </button>
            </div>
        </section>
    );
}

/* ================= THEME HELPERS ================= */
function getThemeClasses(theme) {
    const map = {
        eid_ul_fitr:
            "bg-gradient-to-br from-indigo-950 via-blue-900 to-slate-900",
        eid_ul_adha:
            "bg-gradient-to-br from-green-900 via-emerald-800 to-teal-900",
        winter: "bg-gradient-to-br from-slate-700 via-sky-800 to-blue-900",
        summer: "bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-400",
        monsoon: "bg-gradient-to-br from-gray-700 via-slate-600 to-zinc-800",
        puja: "bg-gradient-to-br from-orange-700 via-red-700 to-rose-800",
        default: "bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700",
    };
    return map[theme] || map.default;
}

function ThemeBackground({ theme }) {
    if (theme === "eid_ul_fitr") return <EidFitrBg />;
    if (theme === "eid_ul_adha") return <EidAdhaBg />;
    if (theme === "winter") return <WinterBg />;
    if (theme === "summer") return <SummerBg />;
    if (theme === "monsoon") return <MonsoonBg />;
    if (theme === "puja") return <PujaBg />;
    return <DefaultBg />;
}

/* ================= THEME BACKGROUNDS ================= */
function EidFitrBg() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle,_white_1px,_transparent_1px)] bg-[length:22px_22px]" />
            <svg
                className="absolute top-4 right-8 opacity-80 w-20 h-20"
                viewBox="0 0 80 80"
            >
                <path
                    d="M55 10 A30 30 0 1 0 55 70 A20 20 0 1 1 55 10Z"
                    fill="#fef08a"
                    opacity="0.9"
                />
            </svg>
            {[10, 25, 40, 55, 70, 85].map((x, i) => (
                <div
                    key={i}
                    className="absolute top-0"
                    style={{ left: `${x}%` }}
                >
                    <div
                        className="w-px bg-white/30 mx-auto"
                        style={{ height: `${30 + i * 5}px` }}
                    />
                    <div
                        className="w-3 h-3 rounded-full mx-auto"
                        style={{
                            background: [
                                "#f59e0b",
                                "#ef4444",
                                "#10b981",
                                "#3b82f6",
                                "#a855f7",
                                "#ec4899",
                            ][i],
                        }}
                    />
                </div>
            ))}
        </div>
    );
}

function EidAdhaBg() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle,_white_1px,_transparent_1px)] bg-[length:28px_28px]" />
            <div
                className="absolute bottom-0 left-0 right-0 h-12 opacity-30"
                style={{
                    background: "linear-gradient(to top, #166534, transparent)",
                }}
            />
            <svg
                className="absolute top-6 right-12 opacity-60 w-14 h-14"
                viewBox="0 0 60 60"
            >
                <circle cx="30" cy="30" r="28" fill="#fef9c3" />
                <circle cx="40" cy="22" r="22" fill="#166534" />
            </svg>
            {[
                [15, 12],
                [30, 6],
                [60, 16],
                [75, 8],
                [88, 20],
            ].map(([x, y], i) => (
                <div
                    key={i}
                    className="absolute w-1 h-1 bg-yellow-200 rounded-full opacity-70"
                    style={{ left: `${x}%`, top: `${y}%` }}
                />
            ))}
        </div>
    );
}

function WinterBg() {
    const flakes = Array.from({ length: 18 }, (_, i) => i);
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <style>{`
                @keyframes snowfall {
                    0%   { transform: translateY(-20px) rotate(0deg);   opacity: 0.8; }
                    100% { transform: translateY(110%)  rotate(360deg); opacity: 0;   }
                }
            `}</style>
            {flakes.map((i) => (
                <div
                    key={i}
                    className="absolute top-0 text-white select-none"
                    style={{
                        left: `${(i * 5.5 + 3) % 100}%`,
                        fontSize: `${10 + (i % 7) * 2}px`,
                        animation: `snowfall ${3 + i * 0.4}s linear ${i * 0.3}s infinite`,
                        opacity: 0.7,
                    }}
                >
                    ❄
                </div>
            ))}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse,_white,_transparent)]" />
        </div>
    );
}

function SummerBg() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div
                className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-30"
                style={{
                    background:
                        "radial-gradient(circle, #fbbf24, transparent 70%)",
                }}
            />
            <svg
                className="absolute bottom-0 left-0 w-full opacity-20"
                viewBox="0 0 1200 60"
                preserveAspectRatio="none"
            >
                <path
                    d="M0,30 C200,60 400,0 600,30 C800,60 1000,0 1200,30 L1200,60 L0,60Z"
                    fill="#0ea5e9"
                />
            </svg>
            <svg
                className="absolute bottom-0 right-0 h-48 opacity-25"
                viewBox="0 0 100 200"
            >
                <rect
                    x="48"
                    y="80"
                    width="6"
                    height="120"
                    fill="#92400e"
                    rx="3"
                />
                <ellipse
                    cx="52"
                    cy="80"
                    rx="30"
                    ry="12"
                    fill="#16a34a"
                    transform="rotate(-20 52 80)"
                />
                <ellipse
                    cx="52"
                    cy="75"
                    rx="28"
                    ry="11"
                    fill="#16a34a"
                    transform="rotate(15 52 75)"
                />
                <ellipse
                    cx="52"
                    cy="70"
                    rx="25"
                    ry="10"
                    fill="#16a34a"
                    transform="rotate(-5 52 70)"
                />
            </svg>
        </div>
    );
}

function MonsoonBg() {
    const drops = Array.from({ length: 25 }, (_, i) => i);
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <style>{`
                @keyframes rainfall {
                    0%   { transform: translateY(-10px); opacity: 0.6; }
                    100% { transform: translateY(110%);  opacity: 0;   }
                }
            `}</style>
            <div
                className="absolute top-0 left-0 right-0 h-24 opacity-20"
                style={{
                    background:
                        "radial-gradient(ellipse at 30% 0%, #94a3b8, transparent 60%), radial-gradient(ellipse at 70% 0%, #64748b, transparent 60%)",
                }}
            />
            {drops.map((i) => (
                <div
                    key={i}
                    className="absolute top-0 w-px bg-blue-300 rounded-full"
                    style={{
                        left: `${(i * 4 + 1) % 100}%`,
                        height: `${10 + (i % 8)}px`,
                        animation: `rainfall ${0.6 + i * 0.05}s linear ${i * 0.12}s infinite`,
                        opacity: 0.5,
                    }}
                />
            ))}
        </div>
    );
}

function PujaBg() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div
                className="absolute -top-10 left-1/4 w-64 h-64 rounded-full opacity-20"
                style={{
                    background:
                        "radial-gradient(circle, #f97316, transparent 70%)",
                }}
            />
            <div
                className="absolute bottom-0 right-1/4 w-48 h-48 rounded-full opacity-20"
                style={{
                    background:
                        "radial-gradient(circle, #eab308, transparent 70%)",
                }}
            />
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle,_#fbbf24_1px,_transparent_1px)] bg-[length:20px_20px]" />
            {[15, 35, 55, 75, 90].map((x, i) => (
                <svg
                    key={i}
                    className="absolute bottom-2 opacity-40 w-6 h-6"
                    style={{ left: `${x}%` }}
                    viewBox="0 0 24 24"
                >
                    <ellipse cx="12" cy="18" rx="8" ry="4" fill="#f59e0b" />
                    <path d="M12 18 Q14 10 12 6 Q10 10 12 18Z" fill="#fbbf24" />
                    <ellipse
                        cx="12"
                        cy="6"
                        rx="1.5"
                        ry="3"
                        fill="#fde68a"
                        opacity="0.9"
                    />
                </svg>
            ))}
        </div>
    );
}

function DefaultBg() {
    return (
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle,_white_1px,_transparent_1px)] bg-[length:18px_18px] pointer-events-none" />
    );
}

/* ================= COUNTDOWN BOX ================= */
function TimeBox({ label, value }) {
    return (
        <div className="bg-black/30 backdrop-blur-md px-6 py-4 rounded-xl min-w-[90px]">
            <div className="text-3xl md:text-4xl font-bold">
                {String(value).padStart(2, "0")}
            </div>
            <div className="text-xs uppercase tracking-widest opacity-80 mt-1">
                {label}
            </div>
        </div>
    );
}

/* ================= SKELETON ================= */
function SkeletonCard() {
    return (
        <div className="bg-white rounded-xl overflow-hidden shadow-sm animate-pulse">
            <div className="bg-gray-200 w-full aspect-square" />
            <div className="p-3 space-y-2">
                <div className="bg-gray-200 h-4 rounded w-3/4" />
                <div className="bg-gray-200 h-4 rounded w-1/2" />
                <div className="bg-gray-200 h-8 rounded w-full mt-2" />
            </div>
        </div>
    );
}

/* ================= SECTION ================= */
function Section({ title, icon, products, loading, viewAllLink }) {
    return (
        <section className="px-2 sm:px-6">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    {icon}
                    <h2 className="text-2xl font-bold">{title}</h2>
                </div>
                {viewAllLink && (
                    <Link
                        to={viewAllLink}
                        className="text-sm font-semibold text-teal-600 border border-teal-600 px-4 py-1.5 rounded-lg hover:bg-teal-600 hover:text-white transition-colors"
                    >
                        View All
                    </Link>
                )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
                {loading
                    ? Array.from({ length: 5 }).map((_, i) => (
                          <SkeletonCard key={i} />
                      ))
                    : products.map((product) => (
                          <ProductCard key={product.id} product={product} />
                      ))}
            </div>
        </section>
    );
}

export default ProductList;
