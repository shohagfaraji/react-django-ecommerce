import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAlert } from "../context/AlertContext";
import { FaBalanceScale, FaShoppingCart, FaTimes } from "react-icons/fa";

function CompareProducts() {
    const { showAlert } = useAlert();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addToCart } = useCart();
    const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL;

    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem("compareList")) || [];
        if (stored.length === 0) {
            setLoading(false);
            return;
        }

        Promise.all(
            stored.map((p) =>
                fetch(`${BASEURL}/api/product/${p.id}/`).then((r) => r.json()),
            ),
        )
            .then((fresh) => {
                setProducts(fresh);
                setLoading(false);
            })
            .catch(() => {
                setProducts(stored);
                setLoading(false);
            });
    }, [BASEURL]);

    const handleAddToCart = (productId) => {
        if (!localStorage.getItem("access_token")) {
            window.location.href = "/login";
            return;
        }
        addToCart(productId);
        showAlert("Added to cart successfully");
    };

    const clearCompare = () => {
        localStorage.removeItem("compareList");
        setProducts([]);
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-[#f6f7f9] px-4 pt-36 md:pt-28">
                <div className="mx-auto max-w-5xl rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                    <p className="font-bold text-slate-500">
                        Loading comparison...
                    </p>
                </div>
            </main>
        );
    }

    if (products.length < 2) {
        return (
            <main className="min-h-screen bg-[#f6f7f9] px-4 pt-36 md:pt-28">
                <div className="mx-auto max-w-xl rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                        <FaBalanceScale className="text-2xl" />
                    </div>
                    <h1 className="mt-4 text-2xl font-black text-slate-950">
                        Compare two products
                    </h1>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                        Select one more product from the catalog to compare
                        price, category, offer status, and details side by side.
                    </p>
                    <Link
                        to="/"
                        className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-emerald-700"
                    >
                        Browse products
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#f6f7f9] px-4 pt-36 pb-12 md:pt-28">
            <div className="mx-auto max-w-6xl">
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                            Product tools
                        </p>
                        <h1 className="mt-2 text-3xl font-black text-slate-950">
                            Compare Products
                        </h1>
                    </div>
                    <button
                        onClick={clearCompare}
                        className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-md border border-slate-300 px-4 text-sm font-black text-slate-700 transition hover:bg-white"
                        type="button"
                    >
                        <FaTimes />
                        Clear comparison
                    </button>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                    {products.map((product) => (
                        <CompareCard
                            key={product.id}
                            product={product}
                            onAddToCart={handleAddToCart}
                        />
                    ))}
                </div>
            </div>
        </main>
    );
}

function CompareCard({ product, onAddToCart }) {
    const isOnSale = product.active_discount > 0 && product.discounted_price;

    return (
        <section className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="rounded-lg bg-slate-50 p-4">
                <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-56 w-full object-contain"
                />
            </div>

            <div className="mt-5 flex-1">
                <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                    {product.category?.name || "Product"}
                </p>
                <h2 className="mt-2 text-xl font-black leading-snug text-slate-950">
                    {product.name}
                </h2>
                <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-500">
                    {product.description || "No description added yet."}
                </p>
            </div>

            <div className="mt-5 rounded-lg border border-slate-200">
                <CompareRow label="Category" value={product.category?.name} />
                <CompareRow
                    label="Offer"
                    value={
                        isOnSale
                            ? `${product.active_discount}% off`
                            : "No active offer"
                    }
                />
                <CompareRow
                    label="Price"
                    value={
                        isOnSale
                            ? `$${product.discounted_price} now`
                            : `$${product.price}`
                    }
                />
            </div>

            <button
                onClick={() => onAddToCart(product.id)}
                className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-emerald-700"
                type="button"
            >
                <FaShoppingCart />
                Add to cart
            </button>
        </section>
    );
}

function CompareRow({ label, value }) {
    return (
        <div className="grid grid-cols-[120px_1fr] border-b border-slate-200 last:border-b-0">
            <span className="bg-slate-50 px-4 py-3 text-sm font-black text-slate-500">
                {label}
            </span>
            <span className="px-4 py-3 text-sm font-bold text-slate-800">
                {value || "Not specified"}
            </span>
        </div>
    );
}

export default CompareProducts;
