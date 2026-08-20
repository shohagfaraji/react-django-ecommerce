import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import useCart from "../context/useCart";
import { useAlert } from "../context/AlertContext";
import {
    FaArrowLeft,
    FaBalanceScale,
    FaCheckCircle,
    FaShoppingCart,
    FaTruck,
} from "react-icons/fa";
import {
    fetchCachedJson,
    getCachedJson,
    getCachedProduct,
    preloadProductDetails,
    productReviewsCacheKey,
} from "../utils/apiCache";
import StarRating from "../components/StarRating";
import { formatDate } from "../utils/orders";
import { preloadRoute } from "../utils/routePreload";

const REVIEWS_STALE_MS = 2 * 60 * 1000;

function ProductDetails() {
    const { showAlert } = useAlert();
    const { id } = useParams();
    const navigate = useNavigate();
    const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL;

    const [productRequest, setProductRequest] = useState(() => ({
        id,
        product: getCachedProduct(id) || null,
        loading: !getCachedProduct(id),
        error: null,
    }));
    const [failedImageUrl, setFailedImageUrl] = useState("");
    const [reviewRequest, setReviewRequest] = useState(() => {
        const cachedReviews = getCachedJson(
            productReviewsCacheKey(id),
            REVIEWS_STALE_MS,
        );
        return {
            id,
            reviews: cachedReviews || [],
            loading: cachedReviews === undefined,
            error: null,
        };
    });

    const { addToCart } = useCart();
    const cachedProduct = getCachedProduct(id);
    const currentProductRequest =
        productRequest.id === id ? productRequest : null;
    const product = currentProductRequest?.product || cachedProduct;
    const loading = currentProductRequest
        ? currentProductRequest.loading && !product
        : !cachedProduct;
    const error = currentProductRequest?.error || null;
    const cachedReviews = getCachedJson(
        productReviewsCacheKey(id),
        REVIEWS_STALE_MS,
    );
    const currentReviewRequest =
        reviewRequest.id === id ? reviewRequest : null;
    const reviews = currentReviewRequest?.reviews || cachedReviews || [];
    const reviewsLoading = currentReviewRequest
        ? currentReviewRequest.loading && cachedReviews === undefined
        : cachedReviews === undefined;
    const reviewsError = currentReviewRequest?.error || null;

    useEffect(() => {
        let active = true;

        preloadProductDetails(BASEURL, id)
            .then((data) => {
                if (!active) return;
                setProductRequest({
                    id,
                    product: data,
                    loading: false,
                    error: null,
                });
            })
            .catch((err) => {
                if (!active) return;
                const fallback = getCachedProduct(id);
                setProductRequest({
                    id,
                    product: fallback || null,
                    loading: false,
                    error: fallback ? null : err.message,
                });
            });

        return () => {
            active = false;
        };
    }, [id, BASEURL]);

    useEffect(() => {
        const reviewCacheKey = productReviewsCacheKey(id);
        if (getCachedJson(reviewCacheKey, REVIEWS_STALE_MS) !== undefined) {
            return undefined;
        }

        let active = true;
        let idleId;
        const loadReviews = () => {
            fetchCachedJson(`${BASEURL}/api/products/${id}/reviews/`, {
                cacheKey: reviewCacheKey,
                errorMessage: "Could not load customer reviews",
                staleMs: REVIEWS_STALE_MS,
            })
                .then((data) => {
                    if (!active) return;
                    setReviewRequest({
                        id,
                        reviews: data,
                        loading: false,
                        error: null,
                    });
                })
                .catch((reviewError) => {
                    if (!active) return;
                    setReviewRequest({
                        id,
                        reviews: [],
                        loading: false,
                        error: reviewError.message,
                    });
                });
        };

        const timer = window.setTimeout(() => {
            if ("requestIdleCallback" in window) {
                idleId = window.requestIdleCallback(loadReviews, {
                    timeout: 600,
                });
            } else {
                loadReviews();
            }
        }, 150);

        return () => {
            active = false;
            window.clearTimeout(timer);
            if (idleId !== undefined && "cancelIdleCallback" in window) {
                window.cancelIdleCallback(idleId);
            }
        };
    }, [BASEURL, id]);

    if (loading) {
        return (
            <main className="min-h-screen bg-[#f6f7f9] px-4 pt-36 pb-12 md:pt-28">
                <div className="mx-auto grid max-w-6xl animate-pulse gap-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
                    <div className="aspect-square rounded-lg bg-slate-100" />
                    <div className="space-y-4">
                        <div className="h-5 w-32 rounded bg-slate-100" />
                        <div className="h-10 w-3/4 rounded bg-slate-100" />
                        <div className="h-4 w-full rounded bg-slate-100" />
                        <div className="h-4 w-2/3 rounded bg-slate-100" />
                        <div className="h-12 w-44 rounded bg-slate-100" />
                    </div>
                </div>
            </main>
        );
    }

    if (error || !product) {
        return (
            <main className="min-h-screen bg-[#f6f7f9] px-4 pt-36 text-center text-[#b62324] md:pt-28">
                {error || "No product found"}
            </main>
        );
    }

    const isOnSale = product.active_discount > 0 && product.discounted_price;

    const handleAddToCart = () => {
        if (!localStorage.getItem("access_token")) {
            navigate("/login");
            return;
        }
        addToCart(product.id);
        showAlert("Added to cart successfully");
    };

    const handleCompare = () => {
        let compareList = JSON.parse(localStorage.getItem("compareList")) || [];

        if (!compareList.find((p) => p.id === product.id)) {
            compareList.push(product);
        }

        if (compareList.length > 2) {
            compareList = compareList.slice(-2);
        }

        localStorage.setItem("compareList", JSON.stringify(compareList));
        preloadRoute(BASEURL, "/compare");

        if (compareList.length === 2) {
            navigate("/compare");
        } else {
            showAlert("First product added. Select another to compare", "info");
        }
    };

    return (
        <main className="min-h-screen bg-[#f6f7f9] px-4 pt-36 pb-12 md:pt-28">
            <div className="mx-auto max-w-6xl">
                <Link
                    to="/"
                    className="mb-5 inline-flex items-center gap-2 text-sm font-black text-slate-600 transition hover:text-emerald-700"
                >
                    <FaArrowLeft />
                    Back to marketplace
                </Link>

                <section className="grid overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:grid-cols-[0.9fr_1.1fr] md:gap-8 md:p-8">
                    <div className="bg-slate-50 md:rounded-lg">
                        <div className="flex aspect-square items-center justify-center">
                            {product.image_url &&
                            failedImageUrl !== product.image_url ? (
                                <img
                                    src={product.image_url}
                                    alt={product.name}
                                    className="h-full w-full object-contain"
                                    decoding="async"
                                    fetchPriority="high"
                                    onError={() =>
                                        setFailedImageUrl(product.image_url)
                                    }
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center rounded-lg border border-dashed border-slate-300 text-slate-400">
                                    No image
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col justify-center p-5 md:p-0">
                        <p className="mb-3 text-xs font-black uppercase tracking-wide text-emerald-700">
                            {product.category?.name || "Product"}
                        </p>
                        <h1 className="text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
                            {product.name}
                        </h1>
                        <div className="mt-3">
                            <StarRating
                                value={product.average_rating}
                                count={product.review_count}
                                size="text-base"
                            />
                        </div>
                        <p className="mt-4 text-base leading-7 text-slate-600">
                            {product.description || "No description provided."}
                        </p>

                        {isOnSale ? (
                            <div className="mt-6 flex flex-wrap items-center gap-3">
                                <span className="rounded-md bg-rose-600 px-3 py-1 text-sm font-black text-white">
                                    -{product.active_discount}%
                                </span>
                                <span className="text-xl font-bold text-slate-400 line-through">
                                    ${product.price}
                                </span>
                                <span className="text-3xl font-black text-emerald-700">
                                    ${product.discounted_price}
                                </span>
                            </div>
                        ) : (
                            <p className="mt-6 text-3xl font-black text-emerald-700">
                                ${product.price}
                            </p>
                        )}

                        <div className="mt-7 grid gap-3 sm:grid-cols-2">
                            <button
                                onClick={handleAddToCart}
                                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-slate-950 px-6 text-sm font-black text-white transition hover:bg-emerald-700"
                                type="button"
                            >
                                <FaShoppingCart />
                                Add to cart
                            </button>

                            <button
                                onClick={handleCompare}
                                onMouseEnter={() =>
                                    preloadRoute(BASEURL, "/compare")
                                }
                                onFocus={() =>
                                    preloadRoute(BASEURL, "/compare")
                                }
                                onTouchStart={() =>
                                    preloadRoute(BASEURL, "/compare")
                                }
                                className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-slate-300 px-6 text-sm font-black text-slate-800 transition hover:bg-slate-50"
                                type="button"
                            >
                                <FaBalanceScale />
                                Compare
                            </button>
                        </div>

                        <div className="mt-7 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-600 sm:grid-cols-2">
                            <span className="flex items-center gap-2">
                                <FaTruck className="text-emerald-700" />
                                Fast delivery updates
                            </span>
                            <span className="flex items-center gap-2">
                                <FaCheckCircle className="text-emerald-700" />
                                Quality checked products
                            </span>
                        </div>
                    </div>
                </section>
                <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-2xl font-black text-slate-950">
                        Customer reviews
                    </h2>
                    {reviewsLoading ? (
                        <ReviewsLoading />
                    ) : reviewsError ? (
                        <p className="mt-4 text-sm font-semibold text-[#b62324]">
                            {reviewsError}
                        </p>
                    ) : reviews.length === 0 ? (
                        <p className="mt-4 text-sm font-semibold text-slate-500">
                            No reviews yet.
                        </p>
                    ) : (
                        <div className="mt-5 divide-y divide-slate-100">
                            {reviews.map((review) => (
                                <article
                                    key={review.id}
                                    className="py-5 first:pt-0"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div>
                                            <p className="font-black text-slate-900">
                                                {review.username}
                                            </p>
                                            <StarRating value={review.rating} />
                                        </div>
                                        <time className="text-xs font-bold text-slate-500">
                                            {formatDate(review.created_at)}
                                        </time>
                                    </div>
                                    {review.comment && (
                                        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                                            {review.comment}
                                        </p>
                                    )}
                                    {review.images.length > 0 && (
                                        <div className="mt-4 flex flex-wrap gap-3">
                                            {review.images.map((image) => (
                                                <a
                                                    key={image.id}
                                                    href={image.image_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    <img
                                                        src={image.image_url}
                                                        alt="Customer review attachment"
                                                        className="h-24 w-24 rounded-lg border border-slate-200 object-cover"
                                                        loading="lazy"
                                                        decoding="async"
                                                    />
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}

function ReviewsLoading() {
    return (
        <div className="mt-5 animate-pulse space-y-5">
            {[1, 2].map((item) => (
                <div key={item} className="border-b border-slate-100 pb-5">
                    <div className="h-5 w-32 rounded bg-slate-200" />
                    <div className="mt-2 h-4 w-24 rounded bg-slate-100" />
                    <div className="mt-4 h-4 w-full rounded bg-slate-100" />
                </div>
            ))}
        </div>
    );
}

export default ProductDetails;
