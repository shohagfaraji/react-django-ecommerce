import { FaRegStar, FaStar, FaStarHalfAlt } from "react-icons/fa";

function StarRating({ value = 0, count, size = "text-sm", interactive = false, onChange }) {
    const rounded = Math.round(Number(value) * 2) / 2;

    return (
        <div
            className={`inline-flex max-w-full items-center gap-1 whitespace-nowrap ${size}`}
            aria-label={`${value} out of 5 stars`}
        >
            <span className="inline-flex shrink-0 gap-0.5 text-amber-400">
                {[1, 2, 3, 4, 5].map((star) => {
                    const Icon =
                        rounded >= star
                            ? FaStar
                            : rounded >= star - 0.5
                              ? FaStarHalfAlt
                              : FaRegStar;
                    return interactive ? (
                        <button
                            key={star}
                            type="button"
                            onClick={() => onChange(star)}
                            className="p-0.5 transition hover:scale-110"
                            aria-label={`Rate ${star} stars`}
                        >
                            <Icon />
                        </button>
                    ) : (
                        <Icon key={star} />
                    );
                })}
            </span>
            {!interactive && (
                <span className="shrink-0 font-bold text-slate-500">
                    {Number(value) > 0 ? Number(value).toFixed(1) : "No ratings"}
                    {count !== undefined && Number(count) > 0 ? ` (${count})` : ""}
                </span>
            )}
        </div>
    );
}

export default StarRating;
