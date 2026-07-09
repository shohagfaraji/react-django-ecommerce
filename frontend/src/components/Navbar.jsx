import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext.jsx";
import {
    FaBars,
    FaChevronDown,
    FaSearch,
    FaShoppingCart,
    FaStore,
    FaUser,
} from "react-icons/fa";
import { clearTokens, getAccessToken } from "../utils/auth.js";

function Navbar({ onMenuToggle }) {
    const [showNav, setShowNav] = useState(true);
    const [search, setSearch] = useState("");
    const [searchParams] = useSearchParams();
    const { cartItems } = useCart();
    const navigate = useNavigate();

    useEffect(() => {
        let lastScrollY = window.scrollY;
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY && currentScrollY > 80) {
                setShowNav(false);
                document.body.classList.add("nav-hidden");
            } else {
                setShowNav(true);
                document.body.classList.remove("nav-hidden");
            }
            lastScrollY = currentScrollY;
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        setSearch(searchParams.get("search") || "");
    }, [searchParams]);

    const handleSearch = (e) => {
        e.preventDefault();
        const term = search.trim();
        if (term) navigate(`/?search=${encodeURIComponent(term)}`);
    };

    const cartCount = cartItems.reduce(
        (total, item) => total + item.quantity,
        0,
    );
    const isLoggedIn = !!getAccessToken();
    const username = localStorage.getItem("username");

    const handleLogout = () => {
        clearTokens();
        localStorage.removeItem("username");
        localStorage.removeItem("email");
        navigate("/login");
    };

    return (
        <nav
            className={`fixed top-0 z-50 w-full border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur transition-transform duration-300 ${
                showNav ? "translate-y-0" : "-translate-y-full"
            }`}
        >
            <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
                <button
                    className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-700 transition hover:bg-slate-50 md:hidden"
                    onClick={onMenuToggle}
                    aria-label="Toggle menu"
                    type="button"
                >
                    <FaBars />
                </button>

                <Link
                    to="/"
                    className="flex shrink-0 items-center gap-2 text-xl font-black tracking-tight text-slate-950"
                >
                    <span className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-950 text-white">
                        <FaStore />
                    </span>
                    <span>VoltEdge</span>
                </Link>

                <Link
                    to="/products"
                    className="hidden h-10 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 lg:inline-flex"
                >
                    Departments
                    <FaChevronDown className="text-xs text-slate-400" />
                </Link>

                <form
                    onSubmit={handleSearch}
                    className="hidden flex-1 items-center md:flex"
                >
                    <div className="flex h-11 w-full overflow-hidden rounded-md border border-slate-300 bg-white focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
                        <input
                            type="text"
                            placeholder="Search fashion, electronics, toys, plants..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-full min-w-0 flex-1 px-4 text-sm outline-none"
                        />
                        <button
                            type="submit"
                            className="flex h-full w-12 items-center justify-center bg-slate-950 text-white transition hover:bg-emerald-700"
                            aria-label="Search"
                        >
                            <FaSearch size={14} />
                        </button>
                    </div>
                </form>

                <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
                    <Link
                        to="/cart"
                        className="relative flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-800 transition hover:bg-slate-50"
                        aria-label="Cart"
                    >
                        <FaShoppingCart />
                        {cartCount > 0 && (
                            <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-black text-white">
                                {cartCount}
                            </span>
                        )}
                    </Link>

                    {!isLoggedIn ? (
                        <Link
                            to="/login"
                            className="inline-flex h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-emerald-700"
                        >
                            Login
                        </Link>
                    ) : (
                        <div className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2">
                            <FaUser className="hidden text-slate-500 sm:block" />
                            <div className="leading-tight">
                                <p className="max-w-[92px] truncate text-sm font-black text-slate-900">
                                    {username
                                        ? username.charAt(0).toUpperCase() +
                                          username.slice(1)
                                        : "Account"}
                                </p>
                                <button
                                    onClick={handleLogout}
                                    className="text-xs font-bold text-slate-500 transition hover:text-rose-600"
                                    type="button"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="px-4 pb-3 md:hidden">
                <form onSubmit={handleSearch} className="flex h-10">
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="min-w-0 flex-1 rounded-l-md border border-r-0 border-slate-300 px-4 text-sm outline-none focus:border-emerald-500"
                    />
                    <button
                        type="submit"
                        className="flex w-12 items-center justify-center rounded-r-md bg-slate-950 text-white"
                        aria-label="Search"
                    >
                        <FaSearch size={14} />
                    </button>
                </form>
            </div>
        </nav>
    );
}

export default Navbar;
