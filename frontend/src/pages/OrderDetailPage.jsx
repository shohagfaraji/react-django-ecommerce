import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
    FaArrowLeft,
    FaBox,
    FaCheck,
    FaClock,
    FaCreditCard,
    FaMapMarkerAlt,
    FaPhone,
    FaTruck,
    FaUser,
} from "react-icons/fa";
import { authFetch } from "../utils/auth";
import { formatDate } from "../utils/orders";

const STATUS_STEPS = [
    { key: "placed", label: "Order placed", icon: FaClock },
    { key: "confirmed", label: "Confirmed", icon: FaCheck },
    { key: "processing", label: "Processing", icon: FaBox },
    { key: "shipped", label: "Shipped", icon: FaTruck },
    { key: "out_for_delivery", label: "Out for delivery", icon: FaTruck },
    { key: "delivered", label: "Delivered", icon: FaCheck },
];

function OrderDetailPage() {
    const { id } = useParams();
    const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL;
    const [order, setOrder] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadOrder = async () => {
            try {
                const res = await authFetch(`${BASEURL}/api/orders/${id}/`);
                const data = await res.json();
                if (!res.ok) throw new Error(data.detail || "Order not found.");
                setOrder(data);
            } catch (loadError) {
                setError(loadError.message || "Could not load this order.");
            }
        };
        void loadOrder();
    }, [BASEURL, id]);

    if (error) {
        return (
            <main className="min-h-screen bg-[#f6f7f9] px-4 pt-36 pb-12 md:pt-28">
                <div className="mx-auto max-w-3xl rounded-xl border border-rose-200 bg-white p-8 text-center">
                    <h1 className="text-2xl font-black text-slate-950">
                        Order unavailable
                    </h1>
                    <p className="mt-2 text-sm font-semibold text-rose-600">
                        {error}
                    </p>
                    <Link
                        to="/profile"
                        className="mt-5 inline-flex font-black text-emerald-700"
                    >
                        Back to account
                    </Link>
                </div>
            </main>
        );
    }

    if (!order) {
        return (
            <main className="min-h-screen bg-[#f6f7f9] px-4 pt-36 md:pt-28">
                <div className="mx-auto h-96 max-w-5xl animate-pulse rounded-xl bg-white" />
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#f6f7f9] px-4 pt-36 pb-12 md:pt-28">
            <div className="mx-auto max-w-5xl">
                <Link
                    to="/profile?section=orders"
                    className="mb-5 inline-flex items-center gap-2 text-sm font-black text-slate-600 hover:text-emerald-700"
                >
                    <FaArrowLeft />
                    Back to my orders
                </Link>

                <header className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div>
                        <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                            Order details
                        </p>
                        <h1 className="mt-2 text-3xl font-black text-slate-950">
                            Order #{order.id}
                        </h1>
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                            Placed {formatDate(order.created_at)}
                        </p>
                    </div>
                    <div className="text-right">
                        <StatusBadge order={order} />
                        <p className="mt-2 text-2xl font-black text-slate-950">
                            ${Number(order.total_amount).toFixed(2)}
                        </p>
                    </div>
                </header>

                <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                    <h2 className="text-xl font-black text-slate-950">
                        Current order status
                    </h2>
                    {order.status === "cancelled" ? (
                        <p className="mt-4 rounded-lg bg-rose-50 p-4 text-sm font-bold text-rose-700">
                            This order has been cancelled.
                        </p>
                    ) : (
                        <OrderProgress status={order.status} />
                    )}
                    <p className="mt-5 text-xs font-semibold text-slate-500">
                        Last updated {formatDate(order.updated_at)}
                    </p>
                </section>

                <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
                    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                        <h2 className="text-xl font-black text-slate-950">
                            Items ({order.item_count})
                        </h2>
                        <div className="mt-5 divide-y divide-slate-100">
                            {order.items.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex gap-4 py-4 first:pt-0 last:pb-0"
                                >
                                    <img
                                        src={
                                            item.product_image ||
                                            "/favicon-96x96.png"
                                        }
                                        alt=""
                                        className="h-20 w-20 rounded-lg border border-slate-200 object-cover"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <Link
                                            to={`/product/${item.product}`}
                                            className="font-black text-slate-950 hover:text-emerald-700"
                                        >
                                            {item.product_name}
                                        </Link>
                                        <p className="mt-1 text-sm font-semibold text-slate-500">
                                            ${Number(item.price).toFixed(2)} ×{" "}
                                            {item.quantity}
                                        </p>
                                    </div>
                                    <p className="font-black text-slate-950">
                                        ${Number(item.line_total).toFixed(2)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h2 className="text-xl font-black text-slate-950">
                            Delivery details
                        </h2>
                        <Detail icon={<FaUser />} label="Recipient">
                            {order.recipient_name}
                        </Detail>
                        <Detail icon={<FaPhone />} label="Phone">
                            {order.phone}
                        </Detail>
                        <Detail icon={<FaMapMarkerAlt />} label="Address">
                            {order.delivery_address}
                        </Detail>
                        <Detail icon={<FaCreditCard />} label="Payment">
                            {order.payment_method === "COD"
                                ? "Cash on delivery"
                                : "Online payment"}
                        </Detail>
                    </aside>
                </div>
            </div>
        </main>
    );
}

function OrderProgress({ status }) {
    const currentIndex = Math.max(
        0,
        STATUS_STEPS.findIndex((step) => step.key === status),
    );

    return (
        <ol className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {STATUS_STEPS.map((step, index) => {
                const complete = index <= currentIndex;
                const current = index === currentIndex;
                const Icon = step.icon;
                return (
                    <li
                        key={step.key}
                        className={`relative rounded-lg border p-3 ${
                            current
                                ? "border-emerald-500 bg-emerald-50"
                                : complete
                                  ? "border-emerald-200 bg-white"
                                  : "border-slate-200 bg-slate-50"
                        }`}
                    >
                        <span
                            className={`flex h-8 w-8 items-center justify-center rounded-full ${
                                complete
                                    ? "bg-emerald-600 text-white"
                                    : "bg-slate-200 text-slate-500"
                            }`}
                        >
                            <Icon size={13} />
                        </span>
                        <p
                            className={`mt-2 text-xs font-black ${
                                complete
                                    ? "text-slate-950"
                                    : "text-slate-500"
                            }`}
                        >
                            {step.label}
                        </p>
                    </li>
                );
            })}
        </ol>
    );
}

function Detail({ icon, label, children }) {
    return (
        <div className="mt-5 flex gap-3 border-t border-slate-100 pt-4 first:border-0">
            <span className="mt-0.5 text-emerald-700">{icon}</span>
            <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                    {label}
                </p>
                <p className="mt-1 break-words text-sm font-bold leading-6 text-slate-700">
                    {children || "Not provided"}
                </p>
            </div>
        </div>
    );
}

function StatusBadge({ order }) {
    const tone =
        order.status === "delivered"
            ? "bg-emerald-100 text-emerald-800"
            : order.status === "cancelled"
              ? "bg-rose-100 text-rose-700"
              : "bg-blue-100 text-blue-800";
    return (
        <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${tone}`}
        >
            {order.status_display}
        </span>
    );
}

export default OrderDetailPage;
