import { useEffect, useState } from "react";
import {
    FaBoxOpen,
    FaEdit,
    FaImages,
    FaPlus,
    FaSearch,
    FaTimes,
    FaTrash,
} from "react-icons/fa";
import { ORDER_STATUSES } from "./adminConfig";

const DANGER = "#b62324";

function ManagementPanel({ title, copy, action, onAction, children }) {
    return (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div>
                    <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
                        {title}
                    </h2>
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                        {copy}
                    </p>
                </div>
                {action && (
                    <button
                        type="button"
                        onClick={onAction}
                        className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-emerald-700"
                    >
                        <FaPlus />
                        {action}
                    </button>
                )}
            </div>
            {children}
        </section>
    );
}

function PanelHeading({ title, copy, actionLabel, onAction }) {
    return (
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
            <div>
                <h2 className="font-black text-slate-950">{title}</h2>
                <p className="mt-1 text-xs font-semibold text-slate-500">{copy}</p>
            </div>
            <button
                type="button"
                onClick={onAction}
                className="shrink-0 text-xs font-black text-emerald-700 hover:text-emerald-800"
            >
                {actionLabel}
            </button>
        </div>
    );
}

function SearchBox({ value, onChange, placeholder, flush = false }) {
    return (
        <div className={flush ? "" : "border-b border-slate-100 p-4 sm:p-5"}>
            <label className="relative block max-w-xl">
                <FaSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
                <input
                    type="search"
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={placeholder}
                    className="form-control admin-search-input"
                />
            </label>
        </div>
    );
}

function CollectionState({
    loading,
    error,
    onRetry,
    empty,
    emptyMessage,
    children,
}) {
    if (loading) {
        return (
            <div className="space-y-3 p-5">
                {[0, 1, 2, 3].map((item) => (
                    <div
                        key={item}
                        className="h-20 animate-pulse rounded-xl bg-slate-100"
                    />
                ))}
            </div>
        );
    }
    if (error) return <ErrorState message={error} onRetry={onRetry} compact />;
    if (empty) {
        return (
            <div className="px-5 py-16 text-center">
                <FaBoxOpen className="mx-auto text-3xl text-slate-300" />
                <p className="mt-3 text-sm font-bold text-slate-500">
                    {emptyMessage}
                </p>
            </div>
        );
    }
    return children;
}

function ErrorState({ message, onRetry, compact = false }) {
    return (
        <div
            className={`rounded-2xl border border-[#b62324]/20 bg-white text-center ${
                compact ? "m-5 p-8" : "p-12"
            }`}
        >
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#b62324]/10 text-xl text-[#b62324]">
                !
            </span>
            <h2 className="mt-4 text-lg font-black text-slate-950">
                Could not load this section
            </h2>
            <p className="mt-2 text-sm text-slate-600">{message}</p>
            <button
                type="button"
                onClick={onRetry}
                className="mt-5 h-10 rounded-lg bg-slate-950 px-5 text-sm font-black text-white hover:bg-emerald-700"
            >
                Try again
            </button>
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="animate-pulse space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[0, 1, 2, 3].map((item) => (
                    <div key={item} className="h-32 rounded-2xl bg-white" />
                ))}
            </div>
            <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
                <div className="h-96 rounded-2xl bg-white" />
                <div className="h-96 rounded-2xl bg-white" />
            </div>
        </div>
    );
}

function Modal({ title, copy, onClose, children, wide = false }) {
    useEffect(() => {
        const handleKey = (event) => {
            if (event.key === "Escape") onClose();
        };
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", handleKey);
        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", handleKey);
        };
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-5"
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="admin-modal-title"
                className={`max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl ${
                    wide ? "max-w-3xl" : "max-w-lg"
                }`}
            >
                <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-5 sm:px-6">
                    <div>
                        <h2
                            id="admin-modal-title"
                            className="text-xl font-black text-slate-950 sm:text-2xl"
                        >
                            {title}
                        </h2>
                        {copy && (
                            <p className="mt-1 text-sm leading-5 text-slate-500">
                                {copy}
                            </p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                        aria-label="Close dialog"
                    >
                        <FaTimes />
                    </button>
                </header>
                <div className="p-5 sm:p-6">{children}</div>
            </section>
        </div>
    );
}

function ConfirmDialog({ title, message, confirmLabel, onCancel, onConfirm }) {
    const [working, setWorking] = useState(false);
    const handleConfirm = async () => {
        setWorking(true);
        await onConfirm();
    };

    return (
        <Modal title={title} onClose={onCancel}>
            <div className="text-center">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#b62324]/10 text-2xl text-[#b62324]">
                    <FaTrash />
                </span>
                <p className="mx-auto mt-5 max-w-sm text-sm leading-6 text-slate-600">
                    {message}
                </p>
                <div className="mt-7 grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={working}
                        className="h-11 rounded-xl border border-slate-300 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={working}
                        style={{ backgroundColor: DANGER }}
                        className="h-11 rounded-xl text-sm font-black text-white transition hover:opacity-90 disabled:opacity-60"
                    >
                        {working ? "Deleting…" : confirmLabel}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

function Field({ label, required = false, children }) {
    return (
        <label className="block">
            <span className="mb-2 block text-sm font-black text-slate-700">
                {label}
                {required && <span className="ml-1 text-[#b62324]">*</span>}
            </span>
            {children}
        </label>
    );
}

function CheckField({ name, checked, onChange, label }) {
    return (
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:bg-slate-50">
            <input
                type="checkbox"
                name={name}
                checked={checked}
                onChange={onChange}
                className="h-5 w-5 accent-emerald-600"
            />
            <span className="text-sm font-black text-slate-700">{label}</span>
        </label>
    );
}

function ImagePicker({ preview, onChange, label, banner = false, required = false }) {
    return (
        <Field label={label} required={required}>
            <div
                className={`flex gap-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 ${
                    banner ? "flex-col" : "items-center"
                }`}
            >
                {preview ? (
                    <img
                        src={preview}
                        alt="Selected upload preview"
                        className={
                            banner
                                ? "aspect-[2.4/1] w-full rounded-lg object-cover"
                                : "h-24 w-24 shrink-0 rounded-lg object-cover"
                        }
                    />
                ) : (
                    <span
                        className={`flex shrink-0 items-center justify-center rounded-lg bg-white text-2xl text-slate-300 ${
                            banner ? "aspect-[2.4/1] w-full" : "h-24 w-24"
                        }`}
                    >
                        <FaImages />
                    </span>
                )}
                <div>
                    <label className="inline-flex h-10 cursor-pointer items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700">
                        {preview ? "Replace image" : "Choose image"}
                        <input
                            type="file"
                            accept="image/*"
                            required={required && !preview}
                            className="sr-only"
                            onChange={(event) => onChange(event.target.files?.[0])}
                        />
                    </label>
                    <p className="mt-2 text-xs font-semibold text-slate-500">
                        JPG, PNG, GIF or WebP · maximum 5 MB
                    </p>
                </div>
            </div>
        </Field>
    );
}

function FormActions({ saving, error, submitLabel, onCancel }) {
    return (
        <div className="border-t border-slate-200 pt-5">
            {error && (
                <p className="mb-4 rounded-lg bg-[#b62324]/10 px-4 py-3 text-sm font-bold text-[#b62324]">
                    {error}
                </p>
            )}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={saving}
                    className="h-11 rounded-xl border border-slate-300 px-5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={saving}
                    className="h-11 rounded-xl bg-slate-950 px-6 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-60"
                >
                    {saving ? "Saving…" : submitLabel}
                </button>
            </div>
        </div>
    );
}

function ProductImage({ product, large = false }) {
    const size = large ? "h-20 w-20" : "h-12 w-12";
    return product.image_url ? (
        <img
            src={product.image_url}
            alt=""
            className={`${size} shrink-0 rounded-lg bg-slate-100 object-cover`}
            loading="lazy"
            decoding="async"
        />
    ) : (
        <span
            className={`flex ${size} shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400`}
        >
            <FaBoxOpen />
        </span>
    );
}

function FeatureTags({ product }) {
    const tags = [
        product.is_featured && "Featured",
        product.is_hot && "Hot",
        product.is_weekly_top && "Weekly top",
    ].filter(Boolean);
    if (!tags.length) return <span className="text-xs text-slate-400">Standard</span>;
    return (
        <div className="flex max-w-[180px] flex-wrap gap-1">
            {tags.map((tag) => (
                <SmallTag key={tag} active label={tag} />
            ))}
        </div>
    );
}

function SmallTag({ active, label, solid = false }) {
    return (
        <span
            className={`inline-flex rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wide ${
                active
                    ? solid
                        ? "bg-emerald-600 text-white"
                        : "bg-emerald-50 text-emerald-700"
                    : solid
                      ? "bg-slate-700 text-white"
                      : "bg-slate-100 text-slate-500"
            }`}
        >
            {label}
        </span>
    );
}

function RowActions({ onEdit, onDelete, label }) {
    return (
        <div className="flex justify-end gap-1">
            <button
                type="button"
                onClick={onEdit}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-700"
                aria-label={`Edit ${label}`}
                title="Edit"
            >
                <FaEdit />
            </button>
            <button
                type="button"
                onClick={onDelete}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-[#b62324]/10 hover:text-[#b62324]"
                aria-label={`Delete ${label}`}
                title="Delete"
            >
                <FaTrash />
            </button>
        </div>
    );
}

function StatusSelect({ order, saving, onChange, full = false }) {
    return (
        <div className={`relative ${full ? "w-full" : "w-[175px]"}`}>
            <select
                value={order.status}
                onChange={(event) => onChange(event.target.value)}
                disabled={saving || order.status === "cancelled"}
                className="h-10 w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 pr-8 text-xs font-black text-slate-700 outline-none focus:border-emerald-500 disabled:opacity-60"
                aria-label={`Status for order ${order.id}`}
            >
                {ORDER_STATUSES.map(([value, label]) => (
                    <option key={value} value={value}>
                        {label}
                    </option>
                ))}
            </select>
            {saving && (
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-700">
                    …
                </span>
            )}
        </div>
    );
}

function StatusBadge({ status, label }) {
    const colors = {
        delivered: "bg-emerald-50 text-emerald-700",
        cancelled: "bg-[#b62324]/10 text-[#b62324]",
        shipped: "bg-blue-50 text-blue-700",
        out_for_delivery: "bg-violet-50 text-violet-700",
        processing: "bg-amber-50 text-amber-700",
        confirmed: "bg-cyan-50 text-cyan-700",
        placed: "bg-slate-100 text-slate-600",
    };
    return (
        <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${colors[status]}`}
        >
            {label}
        </span>
    );
}

function Stars({ rating, compact = false }) {
    const rounded = Math.round(Number(rating || 0));
    return (
        <span
            className={`inline-flex shrink-0 items-center gap-1 font-black text-amber-500 ${
                compact ? "text-xs" : "text-sm"
            }`}
            aria-label={`${rating} out of 5 stars`}
        >
            <span aria-hidden="true">{"★".repeat(rounded)}</span>
            <span className="text-slate-600">{Number(rating).toFixed(1)}</span>
        </span>
    );
}

function Th({ children, align = "left" }) {
    return (
        <th
            className={`px-5 py-3 font-black ${
                align === "right" ? "text-right" : "text-left"
            }`}
        >
            {children}
        </th>
    );
}

function Td({ children, align = "left" }) {
    return (
        <td
            className={`px-5 py-4 text-sm text-slate-600 ${
                align === "right" ? "text-right" : "text-left"
            }`}
        >
            {children}
        </td>
    );
}

function EmptyRow({ message }) {
    return (
        <p className="px-5 py-12 text-center text-sm font-semibold text-slate-500">
            {message}
        </p>
    );
}


export {
    CheckField,
    CollectionState,
    ConfirmDialog,
    DashboardSkeleton,
    EmptyRow,
    ErrorState,
    FeatureTags,
    Field,
    FormActions,
    ImagePicker,
    ManagementPanel,
    Modal,
    PanelHeading,
    ProductImage,
    RowActions,
    SearchBox,
    SmallTag,
    Stars,
    StatusBadge,
    StatusSelect,
    Td,
    Th,
};
