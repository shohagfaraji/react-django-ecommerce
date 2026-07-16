import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { useAlert } from "../context/AlertContext";
import {
    FaArrowLeft,
    FaBalanceScale,
    FaCheckCircle,
    FaShoppingCart,
    FaTruck,
} from "react-icons/fa";

function ProductDetails() {
    const { showAlert } = useAlert();
    const { id } = useParams();
    const navigate = useNavigate();
    const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL;

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [imageFailed, setImageFailed] = useState(false);

    const { addToCart } = useCart();

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);

        fetch(`${BASEURL}/api/product/${id}/`, { signal: controller.signal })
            .then((res) => {
                if (!res.ok) throw new Error("Failed to fetch product");
                return res.json();
            })
            .then((data) => {
                setProduct(data);
                setLoading(false);
            })
            .catch((err) => {
                if (err.name !== "AbortError") {
                    setError(err.message);
                    setLoading(false);
                }
            });

        return () => controller.abort();
    }, [id, BASEURL]);

    if (loading) {
        return (
            <main className="min-h-screen bg-[#f6f7f9] px-4 pt-36 pb-12 md:pt-28">
                <div className="mx-auto grid max-w-6xl animate-pulse gap-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
                    <div className="aspect-square rounded-lg bg-slate-100" />
                    <div className="space-y-4">
                        <div className="h-5 w-32 rounded bg-slate-100" />
                        <div className="h-10 w-3/4 rounded bg-slate-100" />
                        <div className="h-4 w-full rounded bg-slate-100" />
                        <div className="h-4 w-2/3 rounded bg-slate-100" />
                        <div className="h-12 w-44 rounded bg-slate-100" />
                    </div>
                </div>
            </main>
        );
    }

    if (error || !product) {
        return (
            <main className="min-h-screen bg-[#f6f7f9] px-4 pt-36 text-center text-rose-600 md:pt-28">
                {error || "No product found"}
            </main>
        );
    }

    const isOnSale = product.active_discount > 0 && product.discounted_price;

    const handleAddToCart = () => {
        if (!localStorage.getItem("access_token")) {
            navigate("/login");
            return;
        }
        addToCart(product.id);
        showAlert("Added to cart successfully");
    };

    const handleCompare = () => {
        let compareList = JSON.parse(localStorage.getItem("compareList")) || [];

        if (!compareList.find((p) => p.id === product.id)) {
            compareList.push(product);
        }

        if (compareList.length > 2) {
            compareList = compareList.slice(-2);
        }

        localStorage.setItem("compareList", JSON.stringify(compareList));

        if (compareList.length === 2) {
            navigate("/compare");
        } else {
            showAlert("First product added. Select another to compare", "info");
        }
    };

    return (
        <main className="min-h-screen bg-[#f6f7f9] px-4 pt-36 pb-12 md:pt-28">
            <div className="mx-auto max-w-6xl">
                <Link
                    to="/"
                    className="mb-5 inline-flex items-center gap-2 text-sm font-black text-slate-600 transition hover:text-emerald-700"
                >
                    <FaArrowLeft />
                    Back to marketplace
                </Link>

                <section className="grid overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:grid-cols-[0.9fr_1.1fr] md:gap-8 md:p-8">
                    <div className="bg-slate-50 md:rounded-lg">
                        <div className="flex aspect-square items-center justify-center">
                            {product.image_url && !imageFailed ? (
                                <img
                                    src={product.image_url}
                                    alt={product.name}
                                    className="h-full w-full object-contain"
                                    onError={() => setImageFailed(true)}
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center rounded-lg border border-dashed border-slate-300 text-slate-400">
                                    No image
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col justify-center p-5 md:p-0">
                        <p className="mb-3 text-xs font-black uppercase tracking-wide text-emerald-700">
                            {product.category?.name || "Product"}
                        </p>
                        <h1 className="text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
                            {product.name}
                        </h1>
                        <p className="mt-4 text-base leading-7 text-slate-600">
                            {product.description ||
                                "More product details will be available soon."}
                        </p>

                        {isOnSale ? (
                            <div className="mt-6 flex flex-wrap items-center gap-3">
                                <span className="rounded-md bg-rose-600 px-3 py-1 text-sm font-black text-white">
                                    -{product.active_discount}%
                                </span>
                                <span className="text-xl font-bold text-slate-400 line-through">
                                    ${product.price}
                                </span>
                                <span className="text-3xl font-black text-emerald-700">
                                    ${product.discounted_price}
                                </span>
                            </div>
                        ) : (
                            <p className="mt-6 text-3xl font-black text-emerald-700">
                                ${product.price}
                            </p>
                        )}

                        <div className="mt-7 grid gap-3 sm:grid-cols-2">
                            <button
                                onClick={handleAddToCart}
                                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-slate-950 px-6 text-sm font-black text-white transition hover:bg-emerald-700"
                                type="button"
                            >
                                <FaShoppingCart />
                                Add to cart
                            </button>

                            <button
                                onClick={handleCompare}
                                className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-slate-300 px-6 text-sm font-black text-slate-800 transition hover:bg-slate-50"
                                type="button"
                            >
                                <FaBalanceScale />
                                Compare
                            </button>
                        </div>

                        <div className="mt-7 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-600 sm:grid-cols-2">
                            <span className="flex items-center gap-2">
                                <FaTruck className="text-emerald-700" />
                                Fast delivery updates
                            </span>
                            <span className="flex items-center gap-2">
                                <FaCheckCircle className="text-emerald-700" />
                                Quality checked products
                            </span>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}

export default ProductDetails;
