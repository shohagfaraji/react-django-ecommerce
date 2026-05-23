import { Link } from "react-router-dom";

function ProductCard({ product }) {
    const discount = product.active_discount || 0;
    const isOnSale = discount > 0 && product.discounted_price;

    return (
        <Link to={`/product/${product.id}`}>
            <div className="relative bg-white rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-transform p-4 cursor-pointer">
                {/* Discount badge */}
                {isOnSale && (
                    <span className="absolute top-2 left-2 z-10 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow">
                        -{discount}%
                    </span>
                )}

                <div className="w-full aspect-square bg-gray-50 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-contain"
                        loading="lazy"
                    />
                </div>

                <h2 className="text-lg font-semibold text-gray-800 truncate">
                    {product.name}
                </h2>

                {isOnSale ? (
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                        <span className="text-red-400 line-through text-sm">
                            ${product.price}
                        </span>
                        <span className="text-emerald-600 font-bold text-base">
                            ${product.discounted_price}
                        </span>
                    </div>
                ) : (
                    <p className="text-emerald-600 font-medium mt-1">
                        ${product.price}
                    </p>
                )}
            </div>
        </Link>
    );
}

export default ProductCard;
