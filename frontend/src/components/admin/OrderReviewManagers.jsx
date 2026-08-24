import { useMemo, useState } from "react";
import { FaTrash } from "react-icons/fa";
import { useAlert } from "../../context/AlertContext";
import { adminRequest } from "../../utils/admin";
import useAdminCollection from "./useAdminCollection";
import { formatDate, money, ORDER_STATUSES } from "./adminConfig";
import { invalidateStoreProductCaches } from "../../utils/apiCache";
import {
    CollectionState,
    ConfirmDialog,
    ManagementPanel,
    SearchBox,
    Stars,
    StatusSelect,
    Td,
    Th,
} from "./AdminUi";

function OrdersManager({ active, onChanged }) {
    const baseUrl = import.meta.env.VITE_DJANGO_BASE_URL;
    const orders = useAdminCollection("orders/?limit=200", active);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [savingId, setSavingId] = useState(null);
    const { showAlert } = useAlert();

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        return orders.data.filter((order) => {
            const matchesStatus = !statusFilter || order.status === statusFilter;
            const matchesSearch =
                !term ||
                String(order.id).includes(term) ||
                order.recipient_name.toLowerCase().includes(term) ||
                order.username.toLowerCase().includes(term) ||
                order.phone.toLowerCase().includes(term);
            return matchesStatus && matchesSearch;
        });
    }, [orders.data, search, statusFilter]);

    const changeStatus = async (order, nextStatus) => {
        if (nextStatus === order.status) return;
        setSavingId(order.id);
        try {
            const update = await adminRequest(
                baseUrl,
                `orders/${order.id}/status/`,
                {
                    method: "PATCH",
                    body: JSON.stringify({ status: nextStatus }),
                },
            );
            orders.setData((current) =>
                current.map((item) =>
                    item.id === order.id ? { ...item, ...update } : item,
                ),
            );
            if (nextStatus === "cancelled") {
                invalidateStoreProductCaches();
            }
            showAlert(`Order #${order.id} status updated`);
            onChanged();
        } catch (error) {
            showAlert(error.message, "error");
        } finally {
            setSavingId(null);
        }
    };

    return (
        <ManagementPanel
            title="Orders"
            copy="Review order details and keep delivery statuses accurate."
        >
            <div className="grid gap-3 p-4 sm:grid-cols-[1fr_220px] sm:p-5">
                <SearchBox
                    value={search}
                    onChange={setSearch}
                    placeholder="Search order, customer or phone"
                    flush
                />
                <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="form-control"
                    aria-label="Filter by order status"
                >
                    <option value="">All statuses</option>
                    {ORDER_STATUSES.map(([value, label]) => (
                        <option key={value} value={value}>
                            {label}
                        </option>
                    ))}
                </select>
            </div>
            <CollectionState
                loading={orders.loading}
                error={orders.error}
                onRetry={orders.load}
                empty={!filtered.length}
                emptyMessage="No orders match these filters."
            >
                <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[940px] text-left">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                                <Th>Order</Th>
                                <Th>Customer</Th>
                                <Th>Delivery</Th>
                                <Th>Items</Th>
                                <Th>Total</Th>
                                <Th>Status</Th>
                                <Th>Date</Th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.map((order) => (
                                <tr key={order.id}>
                                    <Td>
                                        <span className="font-black text-slate-950">
                                            #{order.id}
                                        </span>
                                    </Td>
                                    <Td>
                                        <p className="font-black text-slate-900">
                                            {order.recipient_name || order.username}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            @{order.username} · {order.phone || "No phone"}
                                        </p>
                                    </Td>
                                    <Td>
                                        <p className="max-w-[220px] line-clamp-2 text-sm text-slate-600">
                                            {order.delivery_address || "Not provided"}
                                        </p>
                                        <p className="mt-1 text-xs font-bold uppercase text-slate-400">
                                            {order.payment_method}
                                        </p>
                                    </Td>
                                    <Td>{order.item_count}</Td>
                                    <Td>
                                        <span className="font-black text-slate-950">
                                            {money(order.total_amount)}
                                        </span>
                                    </Td>
                                    <Td>
                                        <StatusSelect
                                            order={order}
                                            saving={savingId === order.id}
                                            onChange={(value) =>
                                                changeStatus(order, value)
                                            }
                                        />
                                    </Td>
                                    <Td>{formatDate(order.created_at)}</Td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="grid gap-4 p-4 md:hidden">
                    {filtered.map((order) => (
                        <article
                            key={order.id}
                            className="rounded-xl border border-slate-200 p-4"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="font-black text-slate-950">
                                        Order #{order.id}
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-slate-500">
                                        {order.recipient_name || order.username}
                                    </p>
                                </div>
                                <p className="text-lg font-black text-emerald-700">
                                    {money(order.total_amount)}
                                </p>
                            </div>
                            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <dt className="font-bold text-slate-400">Items</dt>
                                    <dd className="mt-1 font-black text-slate-800">
                                        {order.item_count}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="font-bold text-slate-400">Placed</dt>
                                    <dd className="mt-1 font-black text-slate-800">
                                        {formatDate(order.created_at, false)}
                                    </dd>
                                </div>
                            </dl>
                            <div className="mt-4">
                                <StatusSelect
                                    order={order}
                                    saving={savingId === order.id}
                                    onChange={(value) => changeStatus(order, value)}
                                    full
                                />
                            </div>
                        </article>
                    ))}
                </div>
            </CollectionState>
        </ManagementPanel>
    );
}

function ReviewsManager({ active, onChanged }) {
    const baseUrl = import.meta.env.VITE_DJANGO_BASE_URL;
    const reviews = useAdminCollection("reviews/?limit=200", active);
    const [search, setSearch] = useState("");
    const [deleting, setDeleting] = useState(null);
    const { showAlert } = useAlert();

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return reviews.data;
        return reviews.data.filter(
            (review) =>
                review.product_name.toLowerCase().includes(term) ||
                review.username.toLowerCase().includes(term) ||
                review.comment.toLowerCase().includes(term),
        );
    }, [reviews.data, search]);

    const deleteReview = async () => {
        try {
            await adminRequest(baseUrl, `reviews/${deleting.id}/`, {
                method: "DELETE",
            });
            reviews.setData((current) =>
                current.filter((item) => item.id !== deleting.id),
            );
            setDeleting(null);
            showAlert("Review removed");
            onChanged();
        } catch (error) {
            showAlert(error.message, "error");
            setDeleting(null);
        }
    };

    return (
        <ManagementPanel
            title="Reviews"
            copy="Read customer feedback and remove content that should not remain public."
        >
            <SearchBox
                value={search}
                onChange={setSearch}
                placeholder="Search product, customer or comment"
            />
            <CollectionState
                loading={reviews.loading}
                error={reviews.error}
                onRetry={reviews.load}
                empty={!filtered.length}
                emptyMessage="No reviews match your search."
            >
                <div className="grid gap-4 p-4 lg:grid-cols-2 lg:p-5">
                    {filtered.map((review) => (
                        <article
                            key={review.id}
                            className="flex flex-col rounded-xl border border-slate-200 bg-white p-5"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <p className="truncate font-black text-slate-950">
                                        {review.product_name}
                                    </p>
                                    <p className="mt-1 text-xs font-semibold text-slate-500">
                                        @{review.username} · {formatDate(review.created_at)}
                                    </p>
                                </div>
                                <Stars rating={review.rating} />
                            </div>
                            <p className="mt-4 flex-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                                {review.comment || "No written comment"}
                            </p>
                            {review.images.length > 0 && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {review.images.map((image) => (
                                        <a
                                            key={image.id}
                                            href={image.image_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="overflow-hidden rounded-lg border border-slate-200"
                                        >
                                            <img
                                                src={image.thumbnail_url || image.image_url}
                                                alt="Customer review attachment"
                                                className="h-16 w-16 object-cover"
                                                loading="lazy"
                                                decoding="async"
                                            />
                                        </a>
                                    ))}
                                </div>
                            )}
                            <div className="mt-5 flex justify-end border-t border-slate-100 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setDeleting(review)}
                                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#b62324]/25 px-4 text-sm font-black text-[#b62324] transition hover:bg-[#b62324] hover:text-white"
                                >
                                    <FaTrash />
                                    Remove review
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            </CollectionState>
            {deleting && (
                <ConfirmDialog
                    title="Remove this review?"
                    message={`The ${deleting.rating}-star review from @${deleting.username} and its images will be permanently removed.`}
                    confirmLabel="Remove review"
                    onCancel={() => setDeleting(null)}
                    onConfirm={deleteReview}
                />
            )}
        </ManagementPanel>
    );
}


export { OrdersManager, ReviewsManager };
