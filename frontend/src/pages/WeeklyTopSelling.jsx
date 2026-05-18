import { useEffect, useState } from "react";
import ProductCard from "../components/ProductCard.jsx";
import { FaStar } from "react-icons/fa";

function WeeklyTopSelling() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL;

    useEffect(() => {
        const controller = new AbortController();

        fetch(`${BASEURL}/api/products/weekly-top-selling/`, {
            signal: controller.signal,
        })
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
    }, []);

    if (error)
        return <div className="pt-24 text-center text-red-500">{error}</div>;

    return (
        <div className="bg-gray-100 min-h-screen pt-28 md:pt-20 pb-10">
            <div className="px-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <FaStar className="text-yellow-500 text-2xl" />
                    <h1 className="text-3xl font-bold text-gray-800">
                        Weekly Top Selling
                    </h1>
                </div>

                {/* Product grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {loading
                        ? Array.from({ length: 10 }).map((_, i) => (
                              <SkeletonCard key={i} />
                          ))
                        : products.length > 0
                        ? products.map((product) => (
                              <ProductCard key={product.id} product={product} />
                          ))
                        : (
                            <p className="col-span-full text-center text-gray-500 py-20">
                                No weekly top selling products set yet. Ask the admin to mark some products.
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

export default WeeklyTopSelling;
