import { useEffect, useState } from "react";
import ProductCard from "../components/ProductCard.jsx";
import { useSearchParams } from "react-router-dom";
import { FaFire, FaStar, FaBolt } from "react-icons/fa";

function ProductList() {
    /* ================= URL PARAM ================= */
    const [searchParams] = useSearchParams();
    const category = searchParams.get("category");

    /* ================= STATE ================= */
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL;

    /* ================= COUNTDOWN ================= */
    const [timeLeft, setTimeLeft] = useState(5 * 24 * 60 * 60);

    /* ================= FETCH PRODUCTS ================= */
    useEffect(() => {
        const controller = new AbortController();

        const url = category
            ? `${BASEURL}/api/products/?category=${category}`
            : `${BASEURL}/api/products/`;

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
    }, [category]);

    /* ================= COUNTDOWN TIMER ================= */
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    /* ================= FORMAT TIME ================= */
    const formatTime = () => {
        const days = Math.floor(timeLeft / (3600 * 24));
        const hrs = Math.floor((timeLeft % (3600 * 24)) / 3600);
        const mins = Math.floor((timeLeft % 3600) / 60);
        const secs = timeLeft % 60;

        return { days, hrs, mins, secs };
    };

    const { days, hrs, mins, secs } = formatTime();

    /* ================= DATA DERIVATION ================= */

    // Placeholder logic — should be replaced with backend-driven ranking
    const topSelling = products.slice(0, 8);

    // New arrivals sorted by created_at if available
    const newArrivals = [...products]
        .sort((a, b) => {
            if (!a.created_at || !b.created_at) return 0;
            return new Date(b.created_at) - new Date(a.created_at);
        })
        .slice(0, 8);

    /* ================= LOADING & ERROR ================= */
    if (loading) return <div className="pt-24 text-center">Loading...</div>;

    if (error)
        return <div className="pt-24 text-center text-red-500">{error}</div>;

    /* ================= UI ================= */
    return (
        <div className="bg-gray-100 min-h-screen pt-20 pb-10 space-y-10">
            {/* ================= HERO SECTION ================= */}
            {!category && (
                <section className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white p-12 mx-4 rounded-2xl shadow-lg">
                    {/* background pattern */}
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle,_white_1px,_transparent_1px)] bg-[length:18px_18px]" />

                    <div className="relative z-10 text-center">
                        <div className="flex justify-center items-center gap-3 mb-3">
                            <FaFire className="text-yellow-300" />
                            <h1 className="text-4xl md:text-5xl font-bold">
                                Eid Special Mega Offer
                            </h1>
                        </div>

                        <p className="text-lg opacity-90 mb-8">
                            Limited time discounts across categories
                        </p>

                        {/* countdown */}
                        <div className="flex justify-center gap-4 flex-wrap">
                            <TimeBox label="Days" value={days} />
                            <TimeBox label="Hours" value={hrs} />
                            <TimeBox label="Minutes" value={mins} />
                            <TimeBox label="Seconds" value={secs} />
                        </div>

                        {/* CTA */}
                        <button className="mt-10 bg-white text-teal-700 px-8 py-3 rounded-xl font-semibold hover:bg-gray-100 flex items-center gap-2 mx-auto">
                            <FaBolt />
                            Shop Deals
                        </button>
                    </div>
                </section>
            )}

            {/* ================= TOP SELLING ================= */}
            <Section
                title="Weekly Top Selling"
                icon={<FaStar />}
                products={topSelling}
            />

            {/* ================= NEW ARRIVALS ================= */}
            <Section
                title="New Arrivals"
                icon={<FaFire />}
                products={newArrivals}
            />
        </div>
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

/* ================= REUSABLE SECTION ================= */
function Section({ title, icon, products }) {
    return (
        <section className="px-6">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    {icon}
                    <h2 className="text-2xl font-bold">{title}</h2>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </section>
    );
}

export default ProductList;
