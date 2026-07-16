import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAlert } from "../context/AlertContext";
import {
    FaMinus,
    FaPlus,
    FaShieldAlt,
    FaShoppingCart,
    FaTrashAlt,
    FaTruck,
} from "react-icons/fa";

function CartPage() {
    const { showAlert } = useAlert();
    const { cartItems, total, removeFromCart, updateQuantity } = useCart();

    return (
        <main className="min-h-screen bg-[#f6f7f9] px-4 pt-36 pb-12 md:pt-28">
            <div className="mx-auto max-w-6xl">
                <div className="mb-6">
                    <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                        Checkout
                    </p>
                    <h1 className="mt-2 flex items-center gap-3 text-3xl font-black text-slate-950">
                        <FaShoppingCart className="text-emerald-700" />
                        Your Cart
                    </h1>
                </div>

                {cartItems.length === 0 ? (
                    <EmptyCart />
                ) : (
                    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                            {cartItems.map((item) => (
                                <CartItemRow
                                    key={item.id}
                                    item={item}
                                    updateQuantity={updateQuantity}
                                    removeFromCart={removeFromCart}
                                    showAlert={showAlert}
                                />
                            ))}
                        </section>

                        <OrderSummary
                            total={total}
                            itemCount={cartItems.length}
                        />
                    </div>
                )}
            </div>
        </main>
    );
}

function EmptyCart() {
    return (
        <section className="mx-auto max-w-xl rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                <FaShoppingCart className="text-3xl" />
            </div>
            <h2 className="mt-5 text-2xl font-black text-slate-950">
                Your cart is empty
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
                Add products from any department and come back here to review
                your order before checkout.
            </p>
            <Link
                to="/"
                className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-emerald-700"
            >
                Continue shopping
            </Link>
        </section>
    );
}

function CartItemRow({ item, updateQuantity, removeFromCart, showAlert }) {
    const unitPrice = item.product_discounted_price || item.product_price;
    const lineTotal = Number(unitPrice || 0) * item.quantity;

    return (
        <div className="grid gap-4 border-b border-slate-200 py-5 first:pt-0 last:border-b-0 last:pb-0 sm:grid-cols-[96px_1fr_auto] sm:items-center">
            <img
                src={item.product_image}
                alt={item.product_name}
                className="h-24 w-24 object-contain"
            />

            <div className="min-w-0">
                <h2 className="text-base font-black leading-snug text-slate-950">
                    {item.product_name}
                </h2>

                {item.product_active_discount > 0 &&
                item.product_discounted_price ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="rounded bg-rose-600 px-2 py-1 text-[10px] font-black text-white">
                            -{item.product_active_discount}%
                        </span>
                        <span className="text-sm font-bold text-slate-400 line-through">
                            ${item.product_price}
                        </span>
                        <span className="text-sm font-black text-emerald-700">
                            ${item.product_discounted_price}
                        </span>
                    </div>
                ) : (
                    <p className="mt-2 text-sm font-black text-emerald-700">
                        ${item.product_price}
                    </p>
                )}

                <p className="mt-2 text-sm font-bold text-slate-500">
                    Line total: ${lineTotal.toFixed(2)}
                </p>
            </div>

            <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                <div className="flex items-center rounded-md border border-slate-200 bg-slate-50 p-1">
                    <button
                        className="flex h-8 w-8 items-center justify-center rounded text-slate-600 transition hover:bg-white"
                        onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                        }
                        type="button"
                        aria-label="Decrease quantity"
                    >
                        <FaMinus className="text-xs" />
                    </button>
                    <span className="w-9 text-center text-sm font-black text-slate-900">
                        {item.quantity}
                    </span>
                    <button
                        className="flex h-8 w-8 items-center justify-center rounded text-slate-600 transition hover:bg-white"
                        onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                        }
                        type="button"
                        aria-label="Increase quantity"
                    >
                        <FaPlus className="text-xs" />
                    </button>
                </div>

                <button
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-rose-200 px-3 text-sm font-black text-rose-600 transition hover:bg-rose-50"
                    onClick={() => {
                        removeFromCart(item.id);
                        showAlert("Removed from cart", "info");
                    }}
                    type="button"
                >
                    <FaTrashAlt />
                    Remove
                </button>
            </div>
        </div>
    );
}

function OrderSummary({ total, itemCount }) {
    return (
        <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">Order summary</h2>
            <div className="mt-5 space-y-3 text-sm font-bold text-slate-600">
                <div className="flex justify-between">
                    <span>Items</span>
                    <span>{itemCount}</span>
                </div>
                <div className="flex justify-between">
                    <span>Delivery</span>
                    <span>Calculated at checkout</span>
                </div>
                <div className="border-t border-slate-200 pt-4">
                    <div className="flex items-center justify-between text-lg font-black text-slate-950">
                        <span>Total</span>
                        <span className="text-emerald-700">
                            ${Number(total).toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>

            <Link
                to="/checkout"
                className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-md bg-slate-950 text-sm font-black text-white transition hover:bg-emerald-700"
            >
                Proceed to checkout
            </Link>

            <div className="mt-5 grid gap-3 rounded-lg bg-slate-50 p-4 text-sm font-bold text-slate-600">
                <span className="flex items-center gap-2">
                    <FaShieldAlt className="text-emerald-700" />
                    Secure authenticated checkout
                </span>
                <span className="flex items-center gap-2">
                    <FaTruck className="text-emerald-700" />
                    Order saved in backend
                </span>
            </div>
        </aside>
    );
}

export default CartPage;
