import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock, FaShoppingBag, FaUser } from "react-icons/fa";

function Signup() {
    const BASE = import.meta.env.VITE_DJANGO_BASE_URL;
    const [form, setForm] = useState({
        username: "",
        email: "",
        password: "",
        password2: "",
    });
    const [msg, setMsg] = useState("");
    const [loading, setLoading] = useState(false);
    const nav = useNavigate();

    const handleChange = (e) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMsg("");
        setLoading(true);
        try {
            const res = await fetch(`${BASE}/api/register/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (res.ok) {
                setMsg("Account created. Redirecting to login...");
                setTimeout(() => nav("/login"), 900);
            } else {
                setMsg(
                    data.username ||
                        data.password ||
                        data.password2 ||
                        JSON.stringify(data),
                );
            }
        } catch (err) {
            console.error(err);
            setMsg("Signup failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#f6f7f9] px-4 pt-36 pb-12 md:pt-28">
            <div className="mx-auto grid max-w-5xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[0.9fr_1.1fr]">
                <section className="hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
                    <div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-emerald-600 text-xl">
                            <FaShoppingBag />
                        </div>
                        <h1 className="mt-8 text-4xl font-black leading-tight">
                            Create your VoltEdge account
                        </h1>
                        <p className="mt-4 text-sm leading-6 text-slate-300">
                            Register once, then use the authenticated cart and
                            checkout flow across the marketplace.
                        </p>
                    </div>
                    <p className="text-xs font-black uppercase tracking-wide text-emerald-300">
                        Portfolio ecommerce auth
                    </p>
                </section>

                <section className="p-6 sm:p-8 lg:p-10">
                    <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                        Account
                    </p>
                    <h2 className="mt-2 text-3xl font-black text-slate-950">
                        Sign up
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                        Create an account to test cart, checkout, and protected
                        order workflows.
                    </p>

                    <form onSubmit={handleSubmit} className="mt-7 space-y-4">
                        <Field
                            icon={<FaUser />}
                            name="username"
                            value={form.username}
                            placeholder="Username"
                            onChange={handleChange}
                        />
                        <Field
                            icon={<FaEnvelope />}
                            name="email"
                            type="email"
                            value={form.email}
                            placeholder="Email"
                            onChange={handleChange}
                            required={false}
                        />
                        <Field
                            icon={<FaLock />}
                            name="password"
                            type="password"
                            value={form.password}
                            placeholder="Password"
                            onChange={handleChange}
                        />
                        <Field
                            icon={<FaLock />}
                            name="password2"
                            type="password"
                            value={form.password2}
                            placeholder="Confirm password"
                            onChange={handleChange}
                        />

                        {msg && (
                            <p
                                className={`rounded-md px-3 py-2 text-sm font-bold ${
                                    msg.startsWith("Account created")
                                        ? "bg-emerald-50 text-emerald-700"
                                        : "bg-rose-50 text-rose-600"
                                }`}
                            >
                                {msg}
                            </p>
                        )}

                        <button
                            className="h-12 w-full rounded-md bg-slate-950 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                            disabled={loading}
                            type="submit"
                        >
                            {loading ? "Creating account..." : "Create account"}
                        </button>
                    </form>

                    <p className="mt-5 text-center text-sm font-semibold text-slate-500">
                        Already have an account?{" "}
                        <Link
                            to="/login"
                            className="font-black text-emerald-700 hover:text-emerald-800"
                        >
                            Login
                        </Link>
                    </p>
                </section>
            </div>
        </main>
    );
}

function Field({
    icon,
    name,
    value,
    onChange,
    placeholder,
    type = "text",
    required = true,
}) {
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
                    required={required}
                    className="h-full min-w-0 flex-1 px-3 text-sm outline-none"
                />
            </div>
        </label>
    );
}

export default Signup;
