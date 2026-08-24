import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    authFetch,
    fetchProfile,
    getCachedProfile,
    markOrderPlaced,
} from "../utils/auth";
import { useAlert } from "../context/AlertContext";
import useCart from "../context/useCart";
import { invalidateStoreProductCaches } from "../utils/apiCache";
import {
    FaArrowLeft,
    FaCheckCircle,
    FaCreditCard,
    FaHome,
    FaMapMarkerAlt,
    FaPhone,
    FaUser,
} from "react-icons/fa";

function initialCheckoutForm() {
    const profile = getCachedProfile();
    return {
        name: profile?.name || "",
        address: profile?.address || "",
        phone: profile?.phone || "",
        payment_method: "COD",
    };
}

function CheckoutPage() {
    const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL;
    const navigate = useNavigate();
    const { showAlert } = useAlert();
    const {
        clearCart,
        flushCartUpdates,
        total,
        cartItems,
        cartLoading,
        fetchCart,
    } = useCart();

    const [form, setForm] = useState(initialCheckoutForm);

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [confirmedOrder, setConfirmedOrder] = useState(null);
    const [orderSummary, setOrderSummary] = useState(null);
    const hasUnavailableItems = cartItems.some(
        (item) =>
            item.product_track_inventory &&
            item.quantity > item.product_stock_quantity,
    );

    useEffect(() => {
        const loadSavedDetails = async () => {
            try {
                const profile = await fetchProfile(BASEURL);
                setForm((current) => ({
                    ...current,
                    name: current.name || profile.name || "",
                    address: current.address || profile.address || "",
                    phone: current.phone || profile.phone || "",
                }));
            } catch {
                return;
            }
        };

        void loadSavedDetails();
    }, [BASEURL]);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading || cartLoading || !cartItems.length) return;
        setLoading(true);
        setMessage("");
        try {
            await flushCartUpdates();
            const res = await authFetch(`${BASEURL}/api/orders/create/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(form),
            });
            const data = await res.json();

            if (res.ok) {
                setOrderSummary({
                    itemCount:
                        data.item_count ??
                        cartItems.reduce(
                            (count, item) => count + item.quantity,
                            0,
                        ),
                    total: data.total_amount ?? total,
                    paymentMethod: form.payment_method,
                });
                showAlert("Order placed successfully");
                markOrderPlaced();
                invalidateStoreProductCaches();
                clearCart();
                setConfirmedOrder({
                    id: data.order_id,
                    name: form.name,
                    address: form.address,
                });
            } else {
                setMessage(
                    data.error || "Failed to place order. Please try again.",
                );
                await fetchCart();
            }
        } catch {
            setMessage("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#f6f7f9] px-4 pt-36 pb-12 md:pt-28">
            <div className="mx-auto max-w-6xl">
                <Link
                    to="/cart"
                    className="mb-5 inline-flex items-center gap-2 text-sm font-black text-slate-600 transition hover:text-emerald-700"
                >
                    <FaArrowLeft />
                    Back to cart
                </Link>

                <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                    {confirmedOrder ? (
                        <OrderDeliveryAnimation
                            order={confirmedOrder}
                            onContinue={() => navigate("/")}
                        />
                    ) : (
                        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                                Secure checkout
                            </p>
                            <h1 className="mt-2 text-3xl font-black text-slate-950">
                                Delivery details
                            </h1>
                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                Enter your delivery information so we can send
                                your order to the right place.
                            </p>

                            <form
                                onSubmit={handleSubmit}
                                className="mt-7 space-y-4"
                            >
                                <Field
                                    icon={<FaUser />}
                                    type="text"
                                    name="name"
                                    placeholder="Full name"
                                    value={form.name}
                                    onChange={handleChange}
                                />
                                <label className="block">
                                    <span className="mb-2 block text-sm font-black text-slate-700">
                                        Full address
                                    </span>
                                    <div className="flex rounded-md border border-slate-300 bg-white px-3 py-3 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
                                        <FaMapMarkerAlt className="mt-1 text-slate-400" />
                                        <textarea
                                            name="address"
                                            placeholder="House, road, area, city"
                                            value={form.address}
                                            onChange={handleChange}
                                            required
                                            rows={4}
                                            className="min-w-0 flex-1 resize-none px-3 text-sm outline-none"
                                        />
                                    </div>
                                </label>
                                <Field
                                    icon={<FaPhone />}
                                    type="tel"
                                    name="phone"
                                    placeholder="Phone number"
                                    value={form.phone}
                                    onChange={handleChange}
                                />
                                <label className="block">
                                    <span className="mb-2 block text-sm font-black text-slate-700">
                                        Payment method
                                    </span>
                                    <div className="flex h-12 items-center rounded-md border border-slate-300 bg-white px-3 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
                                        <FaCreditCard className="text-slate-400" />
                                        <select
                                            name="payment_method"
                                            value={form.payment_method}
                                            onChange={handleChange}
                                            className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm font-bold text-slate-700 outline-none"
                                        >
                                            <option value="COD">
                                                Cash on Delivery
                                            </option>
                                            <option value="CreditCard">
                                                Online Payment
                                            </option>
                                        </select>
                                    </div>
                                </label>

                                {message && (
                                    <p className="rounded-md bg-[#b62324]/10 px-3 py-2 text-sm font-bold text-[#b62324]">
                                        {message}
                                    </p>
                                )}

                                {hasUnavailableItems && !message && (
                                    <p className="rounded-md bg-[#b62324]/10 px-3 py-2 text-sm font-bold text-[#b62324]">
                                        Update the unavailable quantities in
                                        your cart before placing this order.
                                    </p>
                                )}

                                <button
                                    type="submit"
                                    disabled={
                                        loading ||
                                        cartLoading ||
                                        !cartItems.length ||
                                        hasUnavailableItems
                                    }
                                    className="h-12 w-full rounded-md bg-slate-950 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    {cartLoading
                                        ? "Loading cart..."
                                        : loading
                                        ? "Processing order..."
                                        : "Place order"}
                                </button>
                            </form>
                        </section>
                    )}

                    <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h2 className="text-xl font-black text-slate-950">
                            Order summary
                        </h2>
                        <div className="mt-5 space-y-3 text-sm font-bold text-slate-600">
                            <div className="flex justify-between">
                                <span>Items</span>
                                <span>
                                    {orderSummary?.itemCount ??
                                        cartItems.length}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Payment</span>
                                <span>
                                    {orderSummary?.paymentMethod ??
                                        form.payment_method}
                                </span>
                            </div>
                            <div className="border-t border-slate-200 pt-4">
                                <div className="flex items-center justify-between text-lg font-black text-slate-950">
                                    <span>Total</span>
                                    <span className="text-emerald-700">
                                        $
                                        {Number(
                                            orderSummary?.total ?? total,
                                        ).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <p className="mt-5 rounded-lg bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-500">
                            Review your items, payment method, and total before
                            placing your order.
                        </p>
                    </aside>
                </div>
            </div>
        </main>
    );
}

function OrderDeliveryAnimation({ order, onContinue }) {
    return (
        <section className="overflow-hidden rounded-xl border border-emerald-200 bg-white shadow-sm">
            <div className="border-b border-emerald-100 bg-emerald-50 px-6 py-5 sm:px-8">
                <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-emerald-700">
                    <FaCheckCircle />
                    Order confirmed
                </p>
                <h1 className="mt-2 text-3xl font-black text-slate-950">
                    Your order has been placed
                </h1>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                    Thanks, {order.name}. We have received your order and are
                    preparing it for delivery.
                </p>
            </div>

            <div className="px-5 py-8 sm:px-8">
                <div className="delivery-scene" aria-hidden="true">
                    <DeliveryMapScene />
                </div>

                <div className="mt-7 grid grid-cols-4 gap-2 sm:gap-3">
                    <DeliveryStep label="Cart" status="Completed" complete />
                    <DeliveryStep
                        label="Delivery details"
                        status="Completed"
                        complete
                    />
                    <DeliveryStep
                        label="Review order"
                        status="Completed"
                        complete
                    />
                    <DeliveryStep
                        label="Order confirmed"
                        status="Confirmed"
                        current
                    />
                </div>

                <div className="mt-7 flex gap-3 rounded-lg bg-slate-50 p-4">
                    <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        <FaMapMarkerAlt />
                    </span>
                    <div className="min-w-0">
                        <p className="text-sm font-black text-slate-900">
                            Delivery to {order.name}
                        </p>
                        <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">
                            {order.address}
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onContinue}
                    className="mt-6 h-12 w-full rounded-md bg-slate-950 text-sm font-black text-white transition hover:bg-emerald-700"
                >
                    Continue shopping
                </button>
            </div>
        </section>
    );
}

function DeliveryMapScene() {
    return (
        <div className="delivery-map-frame">
            <svg
                className="delivery-route-map"
                viewBox="0 0 620 260"
                aria-hidden="true"
            >
                <path
                    d="M92 76C24 128 52 208 158 198C243 190 246 128 332 155C420 183 445 218 536 142"
                    className="delivery-route-line"
                />
            </svg>

            <div className="delivery-pin delivery-pin-start">
                <FaMapMarkerAlt />
            </div>
            <div className="delivery-pin delivery-pin-end">
                <FaHome />
            </div>

            <div className="delivery-box-stack">
                <DeliveryBox className="delivery-box-large" />
                <DeliveryBag className="delivery-bag-medium" />
                <DeliveryBag className="delivery-bag-small" />
            </div>
        </div>
    );
}

function DeliveryBox({ className }) {
    return (
        <div className={`delivery-box ${className}`}>
            <span className="delivery-box-tape" />
            <img src="/winkelo.png" alt="" />
        </div>
    );
}

function DeliveryBag({ className }) {
    return (
        <div className={`delivery-bag ${className}`}>
            <span className="delivery-bag-handle" />
            <img src="/winkelo.png" alt="" />
        </div>
    );
}

function DeliveryStep({ label, status, complete, current }) {
    return (
        <div
            className={`rounded-lg border p-2.5 sm:p-4 ${
                current
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-slate-200 bg-white"
            }`}
        >
            <span
                className={`mb-2 flex h-7 w-7 items-center justify-center rounded-full text-xs sm:mb-3 sm:h-8 sm:w-8 sm:text-sm ${
                    complete || current
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-400"
                }`}
            >
                <FaCheckCircle />
            </span>
            <p className="text-[11px] font-black leading-tight text-slate-950 sm:text-sm">
                {label}
            </p>
            <p className="mt-1 text-[10px] font-bold leading-tight text-slate-500 sm:text-xs">
                {status}
            </p>
        </div>
    );
}

function Field({ icon, type, name, placeholder, value, onChange }) {
    return (
        <label className="block">
            <span className="mb-2 block text-sm font-black text-slate-700">
                {placeholder}
            </span>
            <div className="flex h-12 items-center rounded-md border border-slate-300 bg-white px-3 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
                <span className="text-slate-400">{icon}</span>
                <input
                    type={type}
                    name={name}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    required
                    className="h-full min-w-0 flex-1 px-3 text-sm outline-none"
                />
            </div>
        </label>
    );
}

export default CheckoutPage;
