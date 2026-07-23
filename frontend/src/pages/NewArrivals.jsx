import { useEffect, useState } from "react";
import ProductCard from "../components/ProductCard.jsx";
import { FaFire } from "react-icons/fa";
import {
    fetchCachedJson,
    getCachedJson,
    preloadProductImages,
    rememberProducts,
} from "../utils/apiCache";

const CACHE_KEY = "products:new-arrivals";

function NewArrivals() {
    const [products, setProducts] = useState(
        () => getCachedJson(CACHE_KEY) || [],
    );
    const [loading, setLoading] = useState(() => !getCachedJson(CACHE_KEY));
    const [error, setError] = useState(null);

    const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL;

    useEffect(() => {
        const controller = new AbortController();
        const cachedProducts = getCachedJson(CACHE_KEY);

        if (cachedProducts) {
            setProducts(cachedProducts);
            rememberProducts(cachedProducts);
            preloadProductImages(cachedProducts);
            setLoading(false);
        }

        fetchCachedJson(`${BASEURL}/api/products/new-arrivals/`, {
            cacheKey: CACHE_KEY,
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
    }, [BASEURL]);

    if (error)
        return <div className="pt-24 text-center text-red-500">{error}</div>;

    return (
        <div className="bg-gray-100 min-h-screen pt-30 md:pt-20 pb-10">
            <div className="px-2 sm:px-6">
                <div className="flex items-center gap-3 mb-3">
                    <FaFire className="text-orange-500 text-2xl" />
                    <h1 className="text-3xl font-bold text-gray-800">
                        New Arrivals
                    </h1>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
                    {loading ? (
                        Array.from({ length: 10 }).map((_, i) => (
                            <SkeletonCard key={i} />
                        ))
                    ) : products.length > 0 ? (
                        products.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))
                    ) : (
                        <p className="col-span-full text-center text-gray-500 py-20">
                            No products found.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

function SkeletonCard() {
    return (
        <div className="bg-white rounded-xl overflow-hidden shadow-sm animate-pulse">
            <div className="bg-gray-200 w-full aspect-square" />
            <div className="p-3 space-y-2">
                <div className="bg-gray-200 h-4 rounded w-3/4" />
                <div className="bg-gray-200 h-4 rounded w-1/2" />
            </div>
        </div>
    );
}

export default NewArrivals;
