import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaLock, FaShoppingBag, FaUser } from "react-icons/fa";
import { saveTokens } from "../utils/auth";
import { useCart } from "../context/CartContext";
import { useAlert } from "../context/AlertContext";

function Login() {
    const BASE = import.meta.env.VITE_DJANGO_BASE_URL;
    const [form, setForm] = useState({ username: "", password: "" });
    const [msg, setMsg] = useState("");
    const [loading, setLoading] = useState(false);
    const nav = useNavigate();
    const { fetchCart } = useCart();
    const { showAlert } = useAlert();

    const handleChange = (e) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMsg("");
        setLoading(true);
        try {
            const res = await fetch(`${BASE}/api/token/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            const data = await res.json();

            if (res.ok && data.success !== false) {
                saveTokens(data);
                localStorage.setItem("username", form.username);
                void fetchCart();
                showAlert("Login successful");
                nav("/");
            } else {
                setMsg(data.detail || "Invalid username or password");
            }
        } catch (err) {
            console.error(err);
            setMsg("Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell
            title="Welcome back"
            copy="Access your account and pick up right where you left off."
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <Field
                    icon={<FaUser />}
                    name="username"
                    value={form.username}
                    placeholder="Username"
                    onChange={handleChange}
                />
                <Field
                    icon={<FaLock />}
                    name="password"
                    type="password"
                    value={form.password}
                    placeholder="Password"
                    onChange={handleChange}
                />

                {msg && (
                    <p className="rounded-md bg-rose-50 px-3 py-2 text-sm font-bold text-rose-600">
                        {msg}
                    </p>
                )}

                <button
                    className="h-12 w-full rounded-md bg-slate-950 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={loading}
                    type="submit"
                >
                    {loading ? "Signing in..." : "Login"}
                </button>
            </form>

            <p className="mt-5 text-center text-sm font-semibold text-slate-500">
                Don't have an account?{" "}
                <Link
                    to="/signup"
                    className="font-black text-emerald-700 hover:text-emerald-800"
                >
                    Create one
                </Link>
            </p>
        </AuthShell>
    );
}

function AuthShell({ title, copy, children }) {
    return (
        <main className="min-h-screen bg-[#f6f7f9] px-4 pt-36 pb-12 md:pt-28">
            <div className="mx-auto grid max-w-5xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[0.9fr_1.1fr]">
                <section className="hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
                    <div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-emerald-600 text-xl">
                            <FaShoppingBag />
                        </div>
                        <h1 className="mt-8 text-4xl font-black leading-tight">
                            VoltEdge account access
                        </h1>
                        <p className="mt-4 text-sm leading-6 text-slate-300">
                            Sign in to continue shopping, manage your cart, and
                            check out faster.
                        </p>
                    </div>
                    <p className="text-xs font-black uppercase tracking-wide text-emerald-300">
                        Full-stack marketplace
                    </p>
                </section>

                <section className="p-6 sm:p-8 lg:p-10">
                    <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                        Account
                    </p>
                    <h2 className="mt-2 text-3xl font-black text-slate-950">
                        {title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                        {copy}
                    </p>
                    <div className="mt-7">{children}</div>
                </section>
            </div>
        </main>
    );
}

function Field({ icon, name, value, onChange, placeholder, type = "text" }) {
    return (
        <label className="block">
            <span className="mb-2 block text-sm font-black text-slate-700">
                {placeholder}
            </span>
            <div className="flex h-12 items-center rounded-md border border-slate-300 bg-white px-3 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
                <span className="text-slate-400">{icon}</span>
                <input
                    name={name}
                    type={type}
                    onChange={onChange}
                    value={value}
                    placeholder={placeholder}
                    required
                    className="h-full min-w-0 flex-1 px-3 text-sm outline-none"
                />
            </div>
        </label>
    );
}

export default Login;
