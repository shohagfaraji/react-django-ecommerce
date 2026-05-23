import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { useAlert } from "../context/AlertContext";
import { FaShoppingCart } from "react-icons/fa";

function CompareProducts() {
    const { showAlert } = useAlert();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addToCart } = useCart();
    const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL;

    useEffect(() => {
        // Re-fetch fresh data from API using IDs stored in localStorage
        // so active_discount / discounted_price are always current
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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500 font-medium">Loading...</p>
            </div>
        );
    }

    if (products.length < 2) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500 font-medium">
                    Please select 2 products to compare.
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 pt-30 md:pt-20 pb-10 px-4">
            <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
                Compare Products
            </h1>

            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                {products.map((product) => (
                    <div
                        key={product.id}
                        className="bg-white shadow-lg rounded-2xl p-6 flex flex-col justify-between"
                    >
                        <div>
                            <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-full h-48 object-contain bg-gray-50 rounded-lg mb-4 p-2 mx-auto"
                            />

                            <h2 className="text-xl font-semibold mb-2 text-gray-800">
                                {product.name}
                            </h2>

                            <p className="text-gray-600 mb-4 text-sm line-clamp-3">
                                {product.description}
                            </p>
                        </div>

                        <div>
                            {product.active_discount > 0 &&
                            product.discounted_price ? (
                                <div className="flex items-center justify-center gap-2 mb-5 flex-wrap">
                                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md">
                                        -{product.active_discount}%
                                    </span>
                                    <span className="text-red-400 line-through text-base">
                                        ${product.price}
                                    </span>
                                    <span className="text-xl font-bold text-emerald-600">
                                        ${product.discounted_price}
                                    </span>
                                </div>
                            ) : (
                                <p className="text-xl font-bold text-green-600 mb-5 text-center">
                                    ${product.price}
                                </p>
                            )}

                            <button
                                onClick={() => handleAddToCart(product.id)}
                                className="w-full bg-blue-600 text-white font-medium px-6 py-2.5 rounded-lg hover:bg-blue-700 active:scale-95 cursor-pointer flex items-center justify-center gap-2 transition duration-200 shadow-sm hover:shadow-md"
                            >
                                <FaShoppingCart className="text-sm" />
                                <span>Add to Cart</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="text-center mt-8">
                <button
                    onClick={() => {
                        localStorage.removeItem("compareList");
                        window.location.href = "/";
                    }}
                    className="text-blue-600 cursor-pointer font-medium hover:underline flex items-center justify-center gap-1 mx-auto"
                >
                    ← Back to Home
                </button>
            </div>
        </div>
    );
}

export default CompareProducts;
