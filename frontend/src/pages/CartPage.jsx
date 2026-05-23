import { useCart } from "../context/CartContext";
import { Link } from "react-router-dom";
import { useAlert } from "../context/AlertContext";
import { FaShoppingCart, FaTrashAlt, FaMinus, FaPlus } from "react-icons/fa";

function CartPage() {
    const { showAlert } = useAlert();
    const { cartItems, total, removeFromCart, updateQuantity } = useCart();

    return (
        <div className="pt-28 md:pt-20 min-h-screen bg-gray-100 px-4 md:px-8 pb-10">
            <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center text-gray-800 flex items-center justify-center gap-2">
                <FaShoppingCart className="text-blue-600" /> Your Cart
            </h1>

            {cartItems.length === 0 ? (
                <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-md text-center mt-10">
                    <FaShoppingCart className="text-gray-300 text-5xl mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">
                        Your cart is empty.
                    </p>
                    <Link
                        to="/"
                        className="mt-4 inline-block text-sm bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                        Continue Shopping
                    </Link>
                </div>
            ) : (
                <div className="max-w-4xl mx-auto bg-white p-4 md:p-6 rounded-xl shadow-md">
                    {cartItems.map((item) => (
                        <div
                            key={item.id}
                            className="flex flex-col sm:flex-row sm:items-center gap-4 mb-5 pb-5 border-b border-gray-100 last:border-b-0 last:mb-0 last:pb-0"
                        >
                            {/* Image */}
                            {item.product_image && (
                                <img
                                    src={item.product_image}
                                    alt={item.product_name}
                                    className="w-full sm:w-20 h-40 sm:h-20 object-contain bg-gray-50 p-1 rounded-lg flex-shrink-0"
                                />
                            )}

                            {/* Name + price */}
                            <div className="flex-1 min-w-0">
                                <h2 className="text-base font-semibold text-gray-800 leading-tight truncate">
                                    {item.product_name}
                                </h2>
                                {item.product_active_discount > 0 &&
                                item.product_discounted_price ? (
                                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                            -{item.product_active_discount}%
                                        </span>
                                        <span className="text-gray-400 line-through text-xs">
                                            ${item.product_price}
                                        </span>
                                        <span className="text-emerald-600 text-sm font-bold">
                                            ${item.product_discounted_price}
                                        </span>
                                    </div>
                                ) : (
                                    <p className="text-emerald-600 font-semibold text-sm mt-1.5">
                                        ${item.product_price}
                                    </p>
                                )}
                            </div>

                            {/* Quantity controls + remove icon */}
                            <div className="flex items-center justify-between sm:justify-end gap-4 flex-shrink-0">
                                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg p-0.5 shadow-sm">
                                    <button
                                        className="hover:bg-gray-200 text-gray-600 w-7 h-7 rounded-md cursor-pointer flex items-center justify-center transition active:scale-90"
                                        onClick={() =>
                                            updateQuantity(
                                                item.id,
                                                item.quantity - 1,
                                            )
                                        }
                                    >
                                        <FaMinus className="text-[10px]" />
                                    </button>
                                    <span className="w-8 text-center font-semibold text-sm text-gray-800">
                                        {item.quantity}
                                    </span>
                                    <button
                                        className="hover:bg-gray-200 text-gray-600 w-7 h-7 rounded-md cursor-pointer flex items-center justify-center transition active:scale-90"
                                        onClick={() =>
                                            updateQuantity(
                                                item.id,
                                                item.quantity + 1,
                                            )
                                        }
                                    >
                                        <FaPlus className="text-[10px]" />
                                    </button>
                                </div>

                                <button
                                    className="text-gray-400 hover:text-red-600 hover:bg-red-50 w-9 h-9 rounded-full cursor-pointer transition flex items-center justify-center active:scale-90"
                                    onClick={() => {
                                        removeFromCart(item.id);
                                        showAlert("Removed from cart", "info");
                                    }}
                                    title="Remove item"
                                >
                                    <FaTrashAlt className="text-sm" />
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Total + checkout */}
                    <div className="border-t border-gray-200 pt-5 mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <h2 className="text-xl font-bold text-gray-800">
                            Total:{" "}
                            <span className="text-emerald-600 ml-1">
                                ${Number(total).toFixed(2)}
                            </span>
                        </h2>
                        <Link
                            to="/checkout"
                            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 active:scale-[0.98] transition text-center font-semibold shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                        >
                            Proceed to Checkout
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CartPage;
