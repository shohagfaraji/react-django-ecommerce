import { Link } from "react-router-dom";
import useCart from "../context/useCart";
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
    const {
        cartItems,
        cartLoading,
        total,
        removeFromCart,
        updateQuantity,
    } = useCart();
    const itemCount = cartItems.reduce(
        (count, item) => count + item.quantity,
        0,
    );
    const hasUnavailableItems = cartItems.some(
        (item) =>
            item.product_track_inventory &&
            item.quantity > item.product_stock_quantity,
    );

    return (
        <main className="min-h-screen bg-[#f6f7f9] px-4 pt-36 pb-12 max-[360px]:px-2 md:pt-28">
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

                {cartLoading && cartItems.length === 0 ? (
                    <CartLoading />
                ) : cartItems.length === 0 ? (
                    <EmptyCart />
                ) : (
                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm max-[360px]:p-3 sm:p-5">
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
                            itemCount={itemCount}
                            hasUnavailableItems={hasUnavailableItems}
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
    const productId = item.product || item.product_id;
    const productUrl = `/product/${productId}`;
    const handleRemove = () => {
        removeFromCart(item.id);
        showAlert("Removed from cart", "info");
    };

    return (
        <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-x-3 gap-y-3 border-b border-slate-200 py-5 first:pt-0 last:border-b-0 last:pb-0 max-[360px]:grid-cols-[80px_minmax(0,1fr)] max-[360px]:gap-x-2 lg:grid-cols-[104px_minmax(0,1fr)_auto] lg:items-center lg:gap-4">
            <Link
                to={productUrl}
                className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg bg-slate-50 max-[360px]:h-20 max-[360px]:w-20"
                aria-label={`View details for ${item.product_name}`}
            >
                {item.product_image ? (
                    <img
                        src={item.product_image}
                        alt={item.product_name}
                        className="h-full w-full object-contain"
                        decoding="async"
                    />
                ) : (
                    <FaShoppingCart className="text-2xl text-slate-300" />
                )}
            </Link>

            <div className="min-w-0 self-start lg:self-center">
                <Link to={productUrl} className="block min-w-0">
                    <h2 className="text-base font-black leading-snug text-slate-950 transition hover:text-emerald-700">
                        {item.product_name}
                    </h2>
                </Link>

                <div className="mt-2">
                    {item.product_active_discount > 0 &&
                    item.product_discounted_price ? (
                        <div className="flex flex-wrap items-center gap-2">
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
                        <p className="text-sm font-black text-emerald-700">
                            ${item.product_price}
                        </p>
                    )}

                    <p className="mt-2 text-sm font-bold text-slate-500">
                        Line total: ${lineTotal.toFixed(2)}
                    </p>
                    {item.product_track_inventory &&
                        item.product_stock_quantity <= item.quantity && (
                            <p
                                className={`mt-2 text-xs font-black ${
                                    item.product_stock_quantity < item.quantity
                                        ? "text-[#b62324]"
                                        : "text-amber-700"
                                }`}
                            >
                                {item.product_stock_quantity === 0
                                    ? "Currently out of stock"
                                    : item.product_stock_quantity < item.quantity
                                      ? `Only ${item.product_stock_quantity} available—reduce the quantity`
                                      : `Maximum available quantity: ${item.product_stock_quantity}`}
                            </p>
                        )}
                </div>
            </div>

            <div className="col-span-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 max-[360px]:gap-2 lg:hidden">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wide text-slate-400">
                        Qty
                    </span>
                    <QuantityControl
                        item={item}
                        updateQuantity={updateQuantity}
                    />
                </div>

                <button
                    className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-[#b62324]/25 px-3 text-sm font-black text-[#b62324] transition hover:bg-[#b62324]/10 max-[360px]:w-full"
                    onClick={handleRemove}
                    type="button"
                >
                    <FaTrashAlt />
                    Remove
                </button>
            </div>

            <div className="hidden items-end gap-4 lg:flex lg:flex-col">
                <QuantityControl item={item} updateQuantity={updateQuantity} />

                <button
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#b62324]/25 px-3 text-sm font-black text-[#b62324] transition hover:bg-[#b62324]/10"
                    onClick={handleRemove}
                    type="button"
                >
                    <FaTrashAlt />
                    Remove
                </button>
            </div>
        </div>
    );
}

function QuantityControl({ item, updateQuantity }) {
    const reachedStockLimit =
        item.product_track_inventory &&
        item.quantity >= item.product_stock_quantity;
    return (
        <div className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 p-1">
            <button
                className="flex h-8 w-8 items-center justify-center rounded text-slate-600 transition hover:bg-white"
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                type="button"
                aria-label="Decrease quantity"
            >
                <FaMinus className="text-xs" />
            </button>
            <span className="w-9 text-center text-sm font-black text-slate-900">
                {item.quantity}
            </span>
            <button
                className="flex h-8 w-8 items-center justify-center rounded text-slate-600 transition hover:bg-white disabled:cursor-not-allowed disabled:text-slate-300"
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                disabled={reachedStockLimit}
                type="button"
                aria-label="Increase quantity"
            >
                <FaPlus className="text-xs" />
            </button>
        </div>
    );
}

function OrderSummary({ total, itemCount, hasUnavailableItems }) {
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

            {hasUnavailableItems ? (
                <div className="mt-6">
                    <span className="inline-flex h-12 w-full cursor-not-allowed items-center justify-center rounded-md bg-slate-300 text-sm font-black text-white">
                        Update cart to continue
                    </span>
                    <p className="mt-2 text-center text-xs font-bold text-[#b62324]">
                        One or more quantities exceed available stock.
                    </p>
                </div>
            ) : (
                <Link
                    to="/checkout"
                    className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-md bg-slate-950 text-sm font-black text-white transition hover:bg-emerald-700"
                >
                    Proceed to checkout
                </Link>
            )}

            <div className="mt-5 grid gap-3 rounded-lg bg-slate-50 p-4 text-sm font-bold text-slate-600">
                <span className="flex items-center gap-2">
                    <FaShieldAlt className="text-emerald-700" />
                    Secure checkout
                </span>
                <span className="flex items-center gap-2">
                    <FaTruck className="text-emerald-700" />
                    Delivery updates after ordering
                </span>
            </div>
        </aside>
    );
}

function CartLoading() {
    return (
        <div className="grid animate-pulse gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                {[1, 2].map((item) => (
                    <div
                        key={item}
                        className="grid grid-cols-[96px_1fr] gap-4 border-b border-slate-100 pb-5 last:border-0"
                    >
                        <div className="h-24 rounded-lg bg-slate-100" />
                        <div className="space-y-3 py-2">
                            <div className="h-5 w-2/3 rounded bg-slate-200" />
                            <div className="h-4 w-24 rounded bg-slate-100" />
                            <div className="h-4 w-32 rounded bg-slate-100" />
                        </div>
                    </div>
                ))}
            </section>
            <aside className="h-72 rounded-xl border border-slate-200 bg-white shadow-sm" />
        </div>
    );
}

export default CartPage;
