import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { useAlert } from "../context/AlertContext";

function ProductDetails() {
    const { showAlert } = useAlert();
    const { id } = useParams();
    const navigate = useNavigate();
    const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL;

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { addToCart } = useCart();

    useEffect(() => {
        fetch(`${BASEURL}/api/product/${id}/`)
            .then((res) => {
                if (!res.ok) throw new Error("Failed to fetch");
                return res.json();
            })
            .then((data) => {
                setProduct(data);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, [id, BASEURL]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!product) return <div>No product found</div>;

    const handleAddToCart = () => {
        if (!localStorage.getItem("access_token")) {
            window.location.href = "/login";
            return;
        }
        addToCart(product.id);
        showAlert("Added to cart successfully");
    };

    const handleCompare = () => {
        let compareList = JSON.parse(localStorage.getItem("compareList")) || [];

        // prevent duplicates
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
        <div className="min-h-screen bg-gray-100 flex justify-center items-center py-10">
            <div className="bg-white shadow-lg rounded-2xl p-8 max-w-3xl w-full">
                <div className="flex flex-col md:flex-row gap-8">
                    <img
                        src={product.image}
                        alt={product.name}
                        className="w-full md:w-1/2 rounded-lg"
                    />

                    <div className="flex-1">
                        <h1 className="text-3xl font-bold mb-2">
                            {product.name}
                        </h1>

                        <p className="text-gray-600 mb-4">
                            {product.description}
                        </p>

                        <p className="text-2xl text-green-600 mb-6">
                            ${product.price}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={handleAddToCart}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                            >
                                Add to Cart 🛒
                            </button>

                            <button
                                onClick={handleCompare}
                                className="border border-blue-600 text-blue-600 px-6 py-2 rounded-lg hover:bg-blue-50"
                            >
                                Compare
                            </button>
                        </div>

                        <div className="mt-4">
                            <a
                                href="/"
                                className="text-blue-600 hover:underline"
                            >
                                ← Back to Home
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProductDetails;
