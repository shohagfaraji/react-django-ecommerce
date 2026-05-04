import { useCart } from "../context/CartContext";
import { Link } from "react-router-dom";
import { useAlert } from "../context/AlertContext";

function CartPage() {
    const { showAlert } = useAlert();
    const { cartItems, total, removeFromCart, updateQuantity } = useCart();

    return (
        <div className="pt-28 md:pt-20 min-h-screen bg-gray-100 px-4 md:px-8 pb-10">
            <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center">
                🛒 Your Cart
            </h1>

            {cartItems.length === 0 ? (
                <p className="text-center text-gray-600">Your cart is empty.</p>
            ) : (
                <div className="max-w-4xl mx-auto bg-white p-4 md:p-6 rounded-lg shadow-md">
                    {cartItems.map((item) => (
                        <div
                            key={item.id}
                            className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5 pb-5 border-b last:border-b-0"
                        >
                            {/* Image */}
                            {item.product_image && (
                                <img
                                    src={item.product_image}
                                    alt={item.product_name}
                                    className="w-full sm:w-24 h-40 sm:h-20 object-cover rounded-lg flex-shrink-0"
                                />
                            )}

                            {/* Name + price */}
                            <div className="flex-1 min-w-0">
                                <h2 className="text-base font-semibold leading-tight truncate">
                                    {item.product_name}
                                </h2>
                                <p className="text-gray-500 text-sm mt-1">
                                    ${item.product_price}
                                </p>
                            </div>

                            {/* Quantity controls + remove */}
                            <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0">
                                <div className="flex items-center gap-2">
                                    <button
                                        className="bg-gray-200 hover:bg-gray-300 w-8 h-8 rounded-full font-bold text-lg leading-none"
                                        onClick={() =>
                                            updateQuantity(
                                                item.id,
                                                item.quantity - 1,
                                            )
                                        }
                                    >
                                        −
                                    </button>
                                    <span className="w-6 text-center font-medium">
                                        {item.quantity}
                                    </span>
                                    <button
                                        className="bg-gray-200 hover:bg-gray-300 w-8 h-8 rounded-full font-bold text-lg leading-none"
                                        onClick={() =>
                                            updateQuantity(
                                                item.id,
                                                item.quantity + 1,
                                            )
                                        }
                                    >
                                        +
                                    </button>
                                </div>
                                <button
                                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                                    onClick={() => {
                                        removeFromCart(item.id);
                                        showAlert("Removed from cart", "info");
                                    }}
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Total + checkout */}
                    <div className="border-t pt-4 mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <h2 className="text-xl font-bold">
                            Total:{" "}
                            <span className="text-emerald-600">
                                ${Number(total).toFixed(2)}
                            </span>
                        </h2>
                        <Link
                            to="/checkout"
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition text-center font-medium"
                        >
                            Proceed to Checkout →
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CartPage;
