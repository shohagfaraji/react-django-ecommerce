import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext.jsx";
import { FaSearch, FaShoppingCart, FaUser } from "react-icons/fa";
import { clearTokens, getAccessToken } from "../utils/auth.js";

function Navbar() {
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
        if (search.trim()) {
            navigate(`/?search=${search}`);
        }
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
            className={`bg-white shadow-md px-6 py-4 flex justify-between items-center fixed w-full top-0 z-50 transition-transform duration-300 ${
                showNav ? "translate-y-0" : "-translate-y-full"
            }`}
        >
            <div className="flex items-center w-full gap-6 justify-between">
                <Link
                    to="/"
                    className="text-2xl font-bold text-gray-800 whitespace-nowrap"
                >
                    🛍️VoltEdge
                </Link>

                <form
                    onSubmit={handleSearch}
                    className="flex items-center flex-1"
                >
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        transition-all
                        duration-200
                        focus:ring-2
                        focus:ring-emerald-400
                        className="w-full border border-gray-300 px-4 h-10 rounded-l-full outline-none focus:ring-2 focus:ring-gray-300"
                    />

                    <button
                        type="submit"
                        className="bg-gray-800 text-white px-4 h-10 flex items-center justify-center rounded-r-full hover:bg-gray-700"
                    >
                        <FaSearch size={14} />
                    </button>
                </form>

                <div className="flex items-center gap-6">
                    {/* CART */}
                    <Link
                        to="/cart"
                        className="relative text-gray-800 hover:text-gray-600"
                    >
                        <FaShoppingCart size={22} />

                        {cartCount > 0 && (
                            <span className="absolute -top-2 -right-3 bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                                {cartCount}
                            </span>
                        )}
                    </Link>

                    {/* USER */}
                    {!isLoggedIn ? (
                        <Link
                            to="/login"
                            className="text-gray-800 hover:text-gray-600 font-medium border px-4 py-1 rounded-md"
                        >
                            Login
                        </Link>
                    ) : (
                        <div className="flex items-center gap-2">
                            <FaUser className="text-gray-700" size={20} />

                            <div className="flex flex-col leading-tight">
                                <span className="text-sm font-medium text-gray-800">
                                    {username?.charAt(0).toUpperCase() +
                                        username?.slice(1)}
                                </span>

                                <button
                                    onClick={handleLogout}
                                    className="text-xs text-gray-500 hover:text-red-500 text-left"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
