import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authFetch } from "../utils/auth";
import { useAlert } from "../context/AlertContext";
import { useCart } from "../context/CartContext";
import {
    FaArrowLeft,
    FaCreditCard,
    FaMapMarkerAlt,
    FaPhone,
    FaUser,
} from "react-icons/fa";

function CheckoutPage() {
    const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL;
    const navigate = useNavigate();
    const { showAlert } = useAlert();
    const { clearCart, total, cartItems } = useCart();

    const [form, setForm] = useState({
        name: "",
        address: "",
        phone: "",
        payment_method: "COD",
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");
        try {
            const res = await authFetch(`${BASEURL}/api/orders/create/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(form),
            });
            const data = await res.json();

            if (res.ok) {
                showAlert("Order placed successfully");
                clearCart();
                setTimeout(() => {
                    navigate("/");
                }, 1200);
            } else {
                setMessage(
                    data.error || "Failed to place order. Please try again.",
                );
            }
        } catch (error) {
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
                    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                        <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                            Secure checkout
                        </p>
                        <h1 className="mt-2 text-3xl font-black text-slate-950">
                            Delivery details
                        </h1>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            Complete the order information and submit it to the
                            Django backend.
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
                                <p className="rounded-md bg-rose-50 px-3 py-2 text-sm font-bold text-rose-600">
                                    {message}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="h-12 w-full rounded-md bg-slate-950 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {loading
                                    ? "Processing order..."
                                    : "Place order"}
                            </button>
                        </form>
                    </section>

                    <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h2 className="text-xl font-black text-slate-950">
                            Order summary
                        </h2>
                        <div className="mt-5 space-y-3 text-sm font-bold text-slate-600">
                            <div className="flex justify-between">
                                <span>Items</span>
                                <span>{cartItems.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Payment</span>
                                <span>{form.payment_method}</span>
                            </div>
                            <div className="border-t border-slate-200 pt-4">
                                <div className="flex items-center justify-between text-lg font-black text-slate-950">
                                    <span>Total</span>
                                    <span className="text-emerald-700">
                                        ${Number(total).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <p className="mt-5 rounded-lg bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-500">
                            This portfolio checkout stores the order through the
                            authenticated Django API and clears the cart after a
                            successful response.
                        </p>
                    </aside>
                </div>
            </div>
        </main>
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
