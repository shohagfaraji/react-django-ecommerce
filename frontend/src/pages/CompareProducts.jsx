import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";

function CompareProducts() {
    const [products, setProducts] = useState([]);
    const { addToCart } = useCart();

    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem("compareList")) || [];
        setProducts(stored);
    }, []);

    const handleAddToCart = (productId) => {
        if (!localStorage.getItem("access_token")) {
            window.location.href = "/login";
            return;
        }
        addToCart(productId);
    };

    if (products.length < 2) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>Please select 2 products to compare.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 pt-18 pb-10 px-4">
            <h1 className="text-3xl font-bold text-center mb-8">
                Compare Products
            </h1>

            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                {products.map((product) => (
                    <div
                        key={product.id}
                        className="bg-white shadow-lg rounded-2xl p-6 text-center"
                    >
                        <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-48 object-contain bg-gray-50 rounded-lg mb-4 p-2 mx-auto"
                        />

                        <h2 className="text-xl font-semibold mb-2">
                            {product.name}
                        </h2>

                        <p className="text-gray-600 mb-3">
                            {product.description}
                        </p>

                        <p className="text-lg font-bold text-green-600 mb-4">
                            ${product.price}
                        </p>

                        <button
                            onClick={() => handleAddToCart(product.id)}
                            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition"
                        >
                            Add to Cart 🛒
                        </button>
                    </div>
                ))}
            </div>

            <div className="text-center mt-8">
                <button
                    onClick={() => {
                        localStorage.removeItem("compareList");
                        window.location.href = "/";
                    }}
                    className="text-blue-600 hover:underline"
                >
                    ← Back to Home
                </button>
            </div>
        </div>
    );
}

export default CompareProducts;
