import { useCallback, useEffect, useState } from "react";
import {
    FaBoxOpen,
    FaClipboardList,
    FaDollarSign,
    FaUsers,
} from "react-icons/fa";
import { adminRequest } from "../../utils/admin";
import { formatDate, money } from "./adminConfig";
import {
    DashboardSkeleton,
    EmptyRow,
    ErrorState,
    PanelHeading,
    Stars,
    StatusBadge,
    Td,
    Th,
} from "./AdminUi";

function Overview({ active, refreshVersion, onNavigate }) {
    const baseUrl = import.meta.env.VITE_DJANGO_BASE_URL;
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            setData(await adminRequest(baseUrl, "dashboard/"));
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setLoading(false);
        }
    }, [baseUrl]);

    useEffect(() => {
        if (active) void load();
    }, [active, load, refreshVersion]);

    if (loading && !data) return <DashboardSkeleton />;
    if (error && !data) return <ErrorState message={error} onRetry={load} />;
    if (!data) return null;

    const metrics = data.metrics;
    const cards = [
        {
            label: "Delivered revenue",
            value: money(metrics.delivered_revenue),
            note: "From delivered orders",
            icon: FaDollarSign,
            tone: "bg-emerald-50 text-emerald-700",
        },
        {
            label: "Total orders",
            value: metrics.orders,
            note: `${metrics.pending_orders} currently active`,
            icon: FaClipboardList,
            tone: "bg-blue-50 text-blue-700",
        },
        {
            label: "Products",
            value: metrics.products,
            note: `${metrics.categories} categories`,
            icon: FaBoxOpen,
            tone: "bg-violet-50 text-violet-700",
        },
        {
            label: "Customers",
            value: metrics.customers,
            note: `${metrics.new_customers_30_days} joined in 30 days`,
            icon: FaUsers,
            tone: "bg-amber-50 text-amber-700",
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                    <p className="text-sm font-semibold text-slate-500">
                        Current store performance and recent customer activity.
                    </p>
                </div>
                {loading && (
                    <span className="text-xs font-bold text-slate-400">
                        Refreshing…
                    </span>
                )}
            </div>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {cards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <article
                            key={card.label}
                            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-sm font-bold text-slate-500">
                                        {card.label}
                                    </p>
                                    <p className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                                        {card.value}
                                    </p>
                                    <p className="mt-2 text-xs font-semibold text-slate-500">
                                        {card.note}
                                    </p>
                                </div>
                                <span
                                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl ${card.tone}`}
                                >
                                    <Icon />
                                </span>
                            </div>
                        </article>
                    );
                })}
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <PanelHeading
                        title="Recent orders"
                        copy="Latest orders across the store"
                        actionLabel="Manage orders"
                        onAction={() => onNavigate("orders")}
                    />
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[650px] text-left">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                <tr>
                                    <Th>Order</Th>
                                    <Th>Customer</Th>
                                    <Th>Total</Th>
                                    <Th>Status</Th>
                                    <Th>Date</Th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.recent_orders.map((order) => (
                                    <tr key={order.id}>
                                        <Td>#{order.id}</Td>
                                        <Td>{order.recipient_name || order.username}</Td>
                                        <Td>{money(order.total_amount)}</Td>
                                        <Td>
                                            <StatusBadge
                                                status={order.status}
                                                label={order.status_display}
                                            />
                                        </Td>
                                        <Td>{formatDate(order.created_at, false)}</Td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {!data.recent_orders.length && (
                            <EmptyRow message="No orders have been placed yet." />
                        )}
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <PanelHeading
                        title="Customer reviews"
                        copy={`${metrics.reviews} reviews · ${Number(
                            metrics.average_rating,
                        ).toFixed(1)} average`}
                        actionLabel="Moderate"
                        onAction={() => onNavigate("reviews")}
                    />
                    <div className="divide-y divide-slate-100 px-5">
                        {data.recent_reviews.map((review) => (
                            <article key={review.id} className="py-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-black text-slate-900">
                                            {review.product_name}
                                        </p>
                                        <p className="text-xs font-semibold text-slate-500">
                                            by {review.username}
                                        </p>
                                    </div>
                                    <Stars rating={review.rating} compact />
                                </div>
                                <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-600">
                                    {review.comment || "No written comment"}
                                </p>
                            </article>
                        ))}
                        {!data.recent_reviews.length && (
                            <p className="py-8 text-center text-sm font-semibold text-slate-500">
                                No customer reviews yet.
                            </p>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}


export default Overview;
