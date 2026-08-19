import { useEffect, useRef, useState } from "react";
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
    FaImage,
    FaPen,
    FaTrash,
    FaTimes,
    FaExclamationTriangle,
} from "react-icons/fa";
import {
    authFetch,
    cacheOrderDetails,
    fetchOrderDetails,
    getCachedOrderDetails,
} from "../utils/auth";
import { clearProductData } from "../utils/apiCache";
import { formatDate } from "../utils/orders";
import StarRating from "../components/StarRating";

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
    const [orderState, setOrderState] = useState(() => ({
        orderId: id,
        data: getCachedOrderDetails(id) || null,
        error: "",
    }));
    const [reviewingItem, setReviewingItem] = useState(null);
    const [deletingReviewItem, setDeletingReviewItem] = useState(null);
    const cachedOrder = getCachedOrderDetails(id) || null;
    const currentOrderState =
        orderState.orderId === id
            ? orderState
            : { orderId: id, data: cachedOrder, error: "" };
    const order = currentOrderState.data;
    const error = currentOrderState.error;

    useEffect(() => {
        let active = true;
        const existingOrder = getCachedOrderDetails(id);
        const loadOrder = async () => {
            try {
                const data = await fetchOrderDetails(BASEURL, id, {
                    force: Boolean(existingOrder),
                });
                if (!active) return;
                setOrderState({ orderId: id, data, error: "" });
            } catch (loadError) {
                if (!active) return;
                setOrderState((current) => {
                    const fallback =
                        current.orderId === id
                            ? current.data
                            : existingOrder || null;
                    return {
                        orderId: id,
                        data: fallback,
                        error: fallback
                            ? ""
                            : loadError.message || "Could not load this order.",
                    };
                });
            }
        };
        void loadOrder();
        return () => {
            active = false;
        };
    }, [BASEURL, id]);

    const updateOrder = (update) => {
        setOrderState((current) => {
            if (current.orderId !== id || !current.data) return current;
            const nextOrder = update(current.data);
            cacheOrderDetails(nextOrder);
            return { ...current, data: nextOrder };
        });
    };

    if (error) {
        return (
            <main className="min-h-screen bg-[#f6f7f9] px-4 pt-36 pb-12 md:pt-28">
                <div className="mx-auto max-w-3xl rounded-xl border border-[#b62324]/25 bg-white p-8 text-center">
                    <h1 className="text-2xl font-black text-slate-950">
                        Order unavailable
                    </h1>
                    <p className="mt-2 text-sm font-semibold text-[#b62324]">
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
        <main className="min-h-screen bg-[#f6f7f9] px-4 pt-36 pb-14 sm:px-6 md:pt-28 xl:px-8">
            <div className="mx-auto max-w-[1440px]">
                <Link
                    to="/profile?section=orders"
                    className="mb-6 inline-flex items-center gap-2.5 text-base font-black text-slate-600 hover:text-emerald-700"
                >
                    <FaArrowLeft />
                    Back to my orders
                </Link>

                <header className="flex flex-wrap items-start justify-between gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9 lg:p-10">
                    <div>
                        <p className="text-sm font-black uppercase tracking-wide text-emerald-700">
                            Order details
                        </p>
                        <h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">
                            Order {order.customer_order_number}
                        </h1>
                        <p className="mt-2 text-base font-semibold text-slate-500">
                            Placed {formatDate(order.created_at)}
                        </p>
                    </div>
                    <div className="text-right">
                        <StatusBadge order={order} />
                        <p className="mt-3 text-3xl font-black text-slate-950">
                            ${Number(order.total_amount).toFixed(2)}
                        </p>
                    </div>
                </header>

                <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9 lg:p-10">
                    <h2 className="text-2xl font-black text-slate-950 sm:text-3xl">
                        Current order status
                    </h2>
                    {order.status === "cancelled" ? (
                        <p className="mt-4 rounded-lg bg-[#b62324]/10 p-4 text-sm font-bold text-[#b62324]">
                            This order has been cancelled.
                        </p>
                    ) : (
                        <OrderProgress status={order.status} />
                    )}
                    <p className="mt-6 text-sm font-semibold text-slate-500">
                        Last updated {formatDate(order.updated_at)}
                    </p>
                </section>

                <div className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1fr)_380px]">
                    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9 lg:p-10">
                        <div className="flex items-end justify-between gap-3">
                            <div>
                                <p className="text-sm font-black uppercase tracking-wide text-emerald-700">
                                    Your purchase
                                </p>
                                <h2 className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">
                                    Order items
                                </h2>
                            </div>
                            <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-600">
                                {order.item_count}{" "}
                                {order.item_count === 1 ? "item" : "items"}
                            </span>
                        </div>
                        <div className="mt-7 space-y-5">
                            {order.items.map((item, index) => (
                                <article
                                    key={item.id}
                                    className="overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-slate-300 hover:shadow-sm"
                                >
                                    <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-5 p-5 sm:grid-cols-[120px_minmax(0,1fr)_auto] sm:gap-6 sm:p-7">
                                        <Link
                                            to={`/product/${item.product}`}
                                            className="relative block h-24 w-24 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 sm:h-30 sm:w-30"
                                        >
                                            <img
                                                src={
                                                    item.product_image ||
                                                    "/favicon-96x96.png"
                                                }
                                                alt={item.product_name}
                                                className="h-full w-full object-contain p-1"
                                                loading={
                                                    index === 0
                                                        ? "eager"
                                                        : "lazy"
                                                }
                                                decoding="async"
                                                fetchPriority={
                                                    index === 0
                                                        ? "high"
                                                        : "auto"
                                                }
                                            />
                                            <span className="absolute right-1.5 bottom-1.5 rounded-full bg-slate-950 px-2 py-0.5 text-[10px] font-black text-white shadow">
                                                ×{item.quantity}
                                            </span>
                                        </Link>

                                        <div className="min-w-0 self-center">
                                            <Link
                                                to={`/product/${item.product}`}
                                                className="block break-words text-lg font-black leading-6 text-slate-950 transition hover:text-emerald-700 sm:text-2xl sm:leading-8"
                                            >
                                                {item.product_name}
                                            </Link>
                                            <p className="mt-2 text-sm font-bold uppercase tracking-wide text-slate-400">
                                                Purchased product
                                            </p>
                                            <Link
                                                to={`/product/${item.product}`}
                                                className="mt-4 inline-flex text-sm font-black text-emerald-700 hover:text-emerald-800"
                                            >
                                                View product →
                                            </Link>
                                        </div>

                                        <div className="col-span-2 grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 sm:col-span-1 sm:block sm:min-w-40 sm:self-center sm:bg-transparent sm:p-0 sm:text-right">
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                                                    Unit price
                                                </p>
                                                <p className="mt-1.5 text-base font-bold text-slate-600">
                                                    ${Number(item.price).toFixed(2)}
                                                </p>
                                            </div>
                                            <div className="border-l border-slate-200 pl-3 sm:mt-3 sm:border-l-0 sm:pl-0">
                                                <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                                                    Line total
                                                </p>
                                                <p className="mt-1.5 text-xl font-black text-slate-950 sm:text-2xl">
                                                    ${Number(item.line_total).toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex min-w-0 flex-wrap items-center justify-start gap-3 border-t border-slate-200 bg-slate-50/70 p-4 sm:px-7 sm:py-5">
                                        {item.can_review && (
                                            <div className="flex w-full flex-wrap items-center justify-between gap-3">
                                                <div>
                                                    <p className="text-base font-black text-slate-800">
                                                        How was this product?
                                                    </p>
                                                    <p className="mt-1 text-sm font-semibold text-slate-500">
                                                        Your feedback helps other shoppers.
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setReviewingItem(item)}
                                                    className="rounded-xl bg-emerald-700 px-6 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800"
                                                >
                                                    Write a review
                                                </button>
                                            </div>
                                        )}
                                        {item.review && (
                                            <ReviewSummary
                                                review={item.review}
                                                onEdit={() => setReviewingItem(item)}
                                                onDelete={() => setDeletingReviewItem(item)}
                                            />
                                        )}
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>

                    <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                        <h2 className="text-2xl font-black text-slate-950">
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
            {reviewingItem && (
                <ReviewModal
                    item={reviewingItem}
                    baseUrl={BASEURL}
                    onClose={() => setReviewingItem(null)}
                    onSaved={(review) => {
                        clearProductData(reviewingItem.product);
                        updateOrder((current) => ({
                            ...current,
                            items: current.items.map((item) =>
                                item.id === reviewingItem.id
                                    ? { ...item, review, can_review: false }
                                    : item,
                            ),
                        }));
                        setReviewingItem(null);
                    }}
                />
            )}
            {deletingReviewItem && (
                <DeleteReviewDialog
                    item={deletingReviewItem}
                    baseUrl={BASEURL}
                    onClose={() => setDeletingReviewItem(null)}
                    onDeleted={() => {
                        clearProductData(deletingReviewItem.product);
                        updateOrder((current) => ({
                            ...current,
                            items: current.items.map((item) =>
                                item.id === deletingReviewItem.id
                                    ? { ...item, review: null, can_review: true }
                                    : item,
                            ),
                        }));
                        setDeletingReviewItem(null);
                    }}
                />
            )}
        </main>
    );
}

function ReviewSummary({ review, onEdit, onDelete }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="w-full min-w-0 rounded-xl bg-slate-50 p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
                <StarRating value={review.rating} size="text-base" />
                <span className="text-sm font-bold text-slate-500">Your review</span>
            </div>
            {review.comment?.trim() && (
                <ReviewComment
                    comment={review.comment}
                    expanded={expanded}
                    onToggle={() => setExpanded((current) => !current)}
                />
            )}
            <div className="mt-4 flex flex-wrap gap-3">
                <button
                    type="button"
                    onClick={onEdit}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-black text-slate-700 hover:border-emerald-500 hover:text-emerald-700"
                >
                    <FaPen />
                    Edit
                </button>
                <button
                    type="button"
                    onClick={onDelete}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#b62324]/25 px-4 py-2.5 text-sm font-black text-[#b62324] hover:bg-[#b62324]/10"
                >
                    <FaTrash />
                    Delete
                </button>
            </div>
        </div>
    );
}

function ReviewComment({ comment, expanded, onToggle }) {
    const textRef = useRef(null);
    const [canExpand, setCanExpand] = useState(false);

    useEffect(() => {
        if (expanded || !textRef.current) return undefined;
        const element = textRef.current;
        const observer = new ResizeObserver(() => {
            setCanExpand(element.scrollWidth > element.clientWidth);
        });
        observer.observe(element);
        return () => observer.disconnect();
    }, [comment, expanded]);

    return (
        <div className="mt-2 flex min-w-0 items-start gap-2">
            <p
                ref={textRef}
                className={`min-w-0 flex-1 text-base leading-7 text-slate-700 ${
                    expanded ? "whitespace-pre-wrap" : "truncate"
                }`}
            >
                {comment}
            </p>
            {canExpand && (
                <button
                    type="button"
                    onClick={onToggle}
                    className="shrink-0 text-sm font-black text-emerald-700 hover:text-emerald-800"
                >
                    {expanded ? "See less" : "See more"}
                </button>
            )}
        </div>
    );
}

function ReviewModal({ item, baseUrl, onClose, onSaved }) {
    const isEditing = Boolean(item.review);
    const [rating, setRating] = useState(item.review?.rating || 0);
    const [comment, setComment] = useState(item.review?.comment || "");
    const [images, setImages] = useState([]);
    const imagePreviewsRef = useRef([]);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const existingImages = item.review?.images || [];
    const availableImageSlots = Math.max(0, 5 - existingImages.length);

    useEffect(
        () => () => {
            imagePreviewsRef.current.forEach((url) => URL.revokeObjectURL(url));
        },
        [],
    );

    const selectImages = (event) => {
        const selectedFiles = Array.from(event.target.files || []);
        setImages((current) => {
            const remaining = Math.max(0, availableImageSlots - current.length);
            const additions = selectedFiles.slice(0, remaining).map((file) => {
                const preview = URL.createObjectURL(file);
                imagePreviewsRef.current.push(preview);
                return { file, preview };
            });
            return [...current, ...additions];
        });
        event.target.value = "";
    };

    const removeSelectedImage = (preview) => {
        URL.revokeObjectURL(preview);
        imagePreviewsRef.current = imagePreviewsRef.current.filter(
            (url) => url !== preview,
        );
        setImages((current) =>
            current.filter((image) => image.preview !== preview),
        );
    };

    const submit = async (event) => {
        event.preventDefault();
        if (!rating) {
            setError("Choose a rating from 1 to 5 stars.");
            return;
        }
        const form = new FormData();
        form.append("order_item", item.id);
        form.append("rating", rating);
        form.append("comment", comment);
        images.forEach((image) => form.append("images", image.file));
        setSubmitting(true);
        setError("");
        try {
            const response = await authFetch(
                isEditing
                    ? `${baseUrl}/api/reviews/${item.review.id}/`
                    : `${baseUrl}/api/reviews/`,
                {
                method: isEditing ? "PATCH" : "POST",
                body: form,
                },
            );
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || data.rating?.[0] || data.images?.[0] || "Could not submit review.");
            }
            onSaved(data);
        } catch (submitError) {
            setError(submitError.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/65 p-4 backdrop-blur-sm">
            <form onSubmit={submit} className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
                <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5 sm:px-8">
                    <div>
                        <p className="text-base font-black uppercase tracking-wide text-emerald-700">
                            Verified purchase
                        </p>
                        <h2 className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">
                            {isEditing ? "Edit your review" : "Share your review"}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-950"
                        aria-label="Close review dialog"
                    >
                        <FaTimes />
                    </button>
                </header>

                <div className="max-h-[75vh] overflow-y-auto px-6 py-6 sm:px-8">
                    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <img
                            src={item.product_image || "/favicon-96x96.png"}
                            alt={item.product_name}
                            className="h-16 w-16 rounded-lg border border-slate-200 bg-white object-contain"
                        />
                        <div className="min-w-0">
                            <p className="text-sm font-black uppercase tracking-wide text-slate-400">
                                Reviewing
                            </p>
                            <p className="mt-1 break-words text-lg font-black text-slate-950">
                                {item.product_name}
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50/60 p-5 text-center">
                        <p className="text-base font-black text-slate-800">
                            How would you rate this product?
                        </p>
                        <div className="mt-4 flex justify-center">
                            <StarRating
                                value={rating}
                                interactive
                                onChange={setRating}
                                size="text-4xl sm:text-6xl"
                            />
                        </div>
                        <p className="mt-2 text-base font-bold text-amber-700">
                            {rating ? `${rating} out of 5 stars` : "Select a star rating"}
                        </p>
                    </div>

                    <div className="mt-6 flex items-end justify-between gap-4">
                        <label className="text-base font-black text-slate-700" htmlFor="review-comment">
                            Your experience
                        </label>
                        <span className="text-sm font-bold text-slate-400">
                            {comment.length}/2000
                        </span>
                    </div>
                    <textarea
                        id="review-comment"
                        value={comment}
                        onChange={(event) => setComment(event.target.value)}
                        maxLength={2000}
                        rows={5}
                        className="mt-2 w-full resize-y rounded-xl border border-slate-300 p-4 text-base leading-7 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                        placeholder="What did you like or dislike? How was the quality?"
                    />

                    <div className="mt-6">
                        <div className="flex items-end justify-between gap-3">
                            <p className="text-lg font-black text-slate-700">
                                Review photos
                            </p>
                            <p className="text-sm font-bold text-slate-500">
                                {existingImages.length + images.length}/5 used
                            </p>
                        </div>
                        <div className="mt-3 grid grid-cols-5 gap-2 sm:gap-3">
                            {existingImages.map((image) => (
                                <div key={image.id} className="relative aspect-square">
                                    <img
                                        src={image.image_url}
                                        alt="Existing review attachment"
                                        className="h-full w-full rounded-xl border border-slate-200 object-cover"
                                    />
                                    <span className="absolute right-1 bottom-1 rounded bg-slate-950/75 px-1.5 py-0.5 text-[10px] font-black text-white">
                                        Saved
                                    </span>
                                </div>
                            ))}
                            {images.map((image) => (
                                <div key={image.preview} className="group relative aspect-square">
                                    <img
                                        src={image.preview}
                                        alt={image.file.name}
                                        className="h-full w-full rounded-xl border-2 border-emerald-300 object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeSelectedImage(image.preview)}
                                        className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#b62324] text-xs text-white shadow-md transition hover:bg-[#991f20]"
                                        aria-label={`Remove ${image.file.name}`}
                                    >
                                        <FaTimes />
                                    </button>
                                </div>
                            ))}
                            {Array.from({
                                length: 5 - existingImages.length - images.length,
                            }).map((_, index) => (
                                <div
                                    key={`empty-slot-${index}`}
                                    className="flex aspect-square items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-300"
                                >
                                    <FaImage />
                                </div>
                            ))}
                        </div>
                        <p className="mt-3 min-h-5 text-sm font-semibold text-slate-500">
                            {images.length > 0
                                ? "Use the red × button to remove a photo before saving."
                                : "Selected photos will appear in these five spaces."}
                        </p>
                    </div>

                    {existingImages.length + images.length < 5 && (
                        <label className="mt-6 flex cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-5 text-lg font-black text-slate-700 transition hover:border-emerald-500 hover:bg-emerald-50">
                            <FaImage className="text-2xl text-emerald-700" />
                            {images.length ? "Choose more photos" : "Choose product photos"}
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="sr-only"
                                onChange={selectImages}
                            />
                        </label>
                    )}
                    <p className="mt-3 text-center text-sm font-semibold text-slate-500">
                        Up to 5 images, maximum 5 MB each
                    </p>
                    {images.length > 0 && (
                        <p className="mt-2 text-center text-base font-bold text-emerald-700">
                            {images.length} new image(s) ready to upload
                        </p>
                    )}
                    {error && (
                        <p className="mt-5 rounded-lg bg-[#b62324]/10 p-3 text-sm font-bold text-[#b62324]">
                            {error}
                        </p>
                    )}
                </div>

                <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-12 rounded-xl border border-slate-300 px-6 text-base font-black text-slate-700 hover:bg-white"
                    >
                        Cancel
                    </button>
                    <button
                        disabled={submitting}
                        className="h-12 rounded-xl bg-emerald-700 px-7 text-base font-black text-white shadow-sm hover:bg-emerald-800 disabled:opacity-60"
                    >
                        {submitting
                            ? "Saving..."
                            : isEditing
                              ? "Save changes"
                              : "Post review"}
                    </button>
                </footer>
            </form>
        </div>
    );
}

function DeleteReviewDialog({ item, baseUrl, onClose, onDeleted }) {
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState("");

    const deleteReview = async () => {
        setDeleting(true);
        setError("");
        try {
            const response = await authFetch(
                `${baseUrl}/api/reviews/${item.review.id}/`,
                { method: "DELETE" },
            );
            if (!response.ok) throw new Error("Could not delete this review.");
            onDeleted();
        } catch (deleteError) {
            setError(deleteError.message);
            setDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm">
            <div role="alertdialog" aria-modal="true" className="w-full max-w-lg rounded-2xl bg-white p-7 shadow-2xl sm:p-9">
                <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#b62324]/15 text-2xl text-[#b62324]">
                        <FaExclamationTriangle />
                    </div>
                    <h2 className="text-2xl font-black text-slate-950 sm:text-3xl">
                        Delete your review?
                    </h2>
                </div>
                <p className="mt-3 text-base leading-7 text-slate-600">
                    Your rating, comment, and attached images for{" "}
                    <strong className="text-slate-900">{item.product_name}</strong>{" "}
                    will be permanently removed.
                </p>
                <p className="mt-3 rounded-xl border border-[#b62324]/25 bg-[#b62324]/10 p-4 text-sm font-bold text-[#b62324]">
                    This action cannot be undone. You can write a new review later because this item was delivered.
                </p>
                {error && <p className="mt-4 text-sm font-bold text-[#b62324]">{error}</p>}
                <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={deleting}
                        className="h-12 rounded-xl border border-slate-300 px-6 text-base font-black text-slate-700 hover:bg-slate-50"
                    >
                        Keep review
                    </button>
                    <button
                        type="button"
                        onClick={deleteReview}
                        disabled={deleting}
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#b62324] px-6 text-base font-black text-white hover:bg-[#991f20] disabled:opacity-60"
                    >
                        <FaTrash />
                        {deleting ? "Deleting..." : "Yes, delete review"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function OrderProgress({ status }) {
    const currentIndex = Math.max(
        0,
        STATUS_STEPS.findIndex((step) => step.key === status),
    );

    return (
        <ol className="mt-7 grid grid-cols-3 gap-3 lg:grid-cols-6 lg:gap-4">
            {STATUS_STEPS.map((step, index) => {
                const complete = index <= currentIndex;
                const current = index === currentIndex;
                const Icon = step.icon;
                return (
                    <li
                        key={step.key}
                        className={`relative flex min-w-0 flex-col items-center rounded-xl border p-3.5 text-center sm:p-5 ${
                            current
                                ? "border-emerald-500 bg-emerald-50"
                                : complete
                                  ? "border-emerald-200 bg-white"
                                  : "border-slate-200 bg-slate-50"
                        }`}
                    >
                        <span
                            className={`flex h-10 w-10 items-center justify-center rounded-full text-base sm:h-12 sm:w-12 sm:text-lg ${
                                complete
                                    ? "bg-emerald-600 text-white"
                                    : "bg-slate-200 text-slate-500"
                            }`}
                        >
                            <Icon />
                        </span>
                        <p
                            className={`mt-3 break-words text-xs font-black leading-5 sm:text-sm ${
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
        <div className="mt-6 flex gap-4 border-t border-slate-100 pt-5 first:border-0">
            <span className="mt-0.5 text-xl text-emerald-700">{icon}</span>
            <div className="min-w-0">
                <p className="text-sm font-black uppercase tracking-wide text-slate-400">
                    {label}
                </p>
                <p className="mt-2 break-words text-base font-bold leading-7 text-slate-700">
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
              ? "bg-[#b62324]/15 text-[#b62324]"
              : "bg-blue-100 text-blue-800";
    return (
        <span
            className={`inline-flex rounded-full px-4 py-2 text-sm font-black ${tone}`}
        >
            {order.status_display}
        </span>
    );
}

export default OrderDetailPage;
