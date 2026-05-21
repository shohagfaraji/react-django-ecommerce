import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext.jsx";
import { FaSearch, FaShoppingCart, FaUser, FaBars } from "react-icons/fa";
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
            if (currentScrollY > lastScrollY && currentScrollY > 70) {
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
        const urlSearch = searchParams.get("search");
        setSearch(urlSearch || "");
    }, [searchParams]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (search.trim()) navigate(`/?search=${search}`);
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
            className={`bg-white shadow-md fixed w-full top-0 z-50 transition-transform duration-300 ${
                showNav ? "translate-y-0" : "-translate-y-full"
            }`}
        >
            {/* ── Row 1: logo | (desktop search) | cart + user ── */}
            <div className="flex items-center gap-3 px-4 py-3">
                {/* Hamburger — mobile only */}
                <button
                    className="md:hidden text-gray-700 flex-shrink-0"
                    onClick={onMenuToggle}
                    aria-label="Toggle menu"
                >
                    <FaBars size={20} />
                </button>

                {/* Logo */}
                <Link
                    to="/"
                    className="text-xl font-bold text-gray-800 whitespace-nowrap flex-shrink-0"
                >
                    🛍️VoltEdge
                </Link>

                {/* Search — desktop only (hidden on mobile, shown in row 2) */}
                <form
                    onSubmit={handleSearch}
                    className="hidden md:flex items-center flex-1 mx-4"
                >
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full border border-gray-300 px-4 h-10 rounded-l-full outline-none focus:ring-2 focus:ring-gray-300"
                    />
                    <button
                        type="submit"
                        className="bg-gray-800 text-white px-4 h-10 flex items-center justify-center rounded-r-full hover:bg-gray-700"
                    >
                        <FaSearch size={14} />
                    </button>
                </form>

                {/* Right icons — always visible */}
                <div className="ml-auto flex items-center gap-4 flex-shrink-0">
                    {/* Cart */}
                    <Link
                        to="/cart"
                        className="relative text-gray-800 hover:text-gray-600 cursor-pointer"
                    >
                        <FaShoppingCart size={22} />
                        {cartCount > 0 && (
                            <span className="absolute -top-2 -right-3 bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                                {cartCount}
                            </span>
                        )}
                    </Link>

                    {/* User */}
                    {!isLoggedIn ? (
                        <Link
                            to="/login"
                            className="text-gray-800 hover:text-gray-600 font-medium border px-3 py-1 rounded-md text-sm"
                        >
                            Login
                        </Link>
                    ) : (
                        <div className="flex items-center gap-2">
                            <FaUser
                                className="text-gray-700 hidden sm:block"
                                size={18}
                            />
                            <div className="flex flex-col leading-tight">
                                <span className="text-sm font-medium text-gray-800 max-w-[70px] truncate">
                                    {username?.charAt(0).toUpperCase() +
                                        username?.slice(1)}
                                </span>
                                <button
                                    onClick={handleLogout}
                                    className="text-xs text-gray-500 cursor-pointer hover:text-red-500 text-left"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Row 2: search — mobile only ── */}
            <div className="md:hidden px-4 pb-3">
                <form onSubmit={handleSearch} className="flex items-center">
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full border border-gray-300 px-4 h-10 rounded-l-full outline-none focus:ring-2 focus:ring-gray-300"
                    />
                    <button
                        type="submit"
                        className="bg-gray-800 text-white px-4 h-10 flex items-center justify-center cursor-pointer rounded-r-full hover:bg-gray-700"
                    >
                        <FaSearch size={14} />
                    </button>
                </form>
            </div>
        </nav>
    );
}

export default Navbar;
