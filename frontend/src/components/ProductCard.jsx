import { useState } from "react";
import { Link } from "react-router-dom";
import { FaShoppingCart, FaStar } from "react-icons/fa";
import StarRating from "./StarRating";

function ProductCard({ product }) {
    const [imageFailed, setImageFailed] = useState(false);
    const discount = product.active_discount || 0;
    const isOnSale = discount > 0 && product.discounted_price;

    return (
        <Link
            to={`/product/${product.id}`}
            className="group block overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
            <div className="relative overflow-hidden rounded-md bg-slate-50">
                {isOnSale && (
                    <span className="absolute left-3 top-3 z-10 rounded-md bg-rose-600 px-2 py-1 text-xs font-black text-white shadow">
                        -{discount}%
                    </span>
                )}

                {(product.is_hot || product.is_weekly_top) && (
                    <span className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-1 text-xs font-black text-amber-700">
                        <FaStar />
                        Hot
                    </span>
                )}

                <div className="flex aspect-square items-center justify-center">
                    {product.image_url && !imageFailed ? (
                        <img
                            src={product.image_url}
                            alt={product.name}
                            className="h-full w-full object-contain transition duration-300 group-hover:scale-105"
                            loading="lazy"
                            onError={() => setImageFailed(true)}
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-md border border-dashed border-slate-300 text-slate-400">
                            <FaShoppingCart className="text-3xl" />
                        </div>
                    )}
                </div>
            </div>

            <div className="p-3 pt-4">
                <p className="mb-1 text-xs font-black uppercase tracking-wide text-slate-400">
                    {product.category?.name || "Product"}
                </p>
                <h2 className="line-clamp-2 text-base font-black leading-snug text-slate-900">
                    {product.name}
                </h2>
                <div className="mt-1.5">
                    <StarRating
                        value={product.average_rating}
                        count={product.review_count}
                    />
                </div>

                {isOnSale ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-slate-400 line-through">
                            ${product.price}
                        </span>
                        <span className="text-lg font-black text-emerald-700">
                            ${product.discounted_price}
                        </span>
                    </div>
                ) : (
                    <p className="mt-2 text-lg font-black text-emerald-700">
                        ${product.price}
                    </p>
                )}

                <span className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-md bg-slate-950 text-sm font-black text-white transition group-hover:bg-emerald-700">
                    View product
                </span>
            </div>
        </Link>
    );
}

export default ProductCard;
