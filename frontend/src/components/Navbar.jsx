import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import useCart from "../context/useCart";
import {
    FaBars,
    FaSearch,
    FaShoppingCart,
    FaSignOutAlt,
} from "react-icons/fa";
import {
    clearTokens,
    fetchProfile,
    getAccessToken,
    getCachedProfile,
} from "../utils/auth.js";

const DEFAULT_AVATAR = "/default-avatar.svg";

function Navbar({ onMenuToggle }) {
    const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL;
    const cachedProfile = getCachedProfile();
    const [showNav, setShowNav] = useState(true);
    const [searchParams] = useSearchParams();
    const querySearch = searchParams.get("search") || "";
    const [searchDraft, setSearchDraft] = useState(() => ({
        query: querySearch,
        value: querySearch,
    }));
    const search =
        searchDraft.query === querySearch ? searchDraft.value : querySearch;
    const [username, setUsername] = useState(
        () => cachedProfile?.username || localStorage.getItem("username") || "",
    );
    const [profilePicture, setProfilePicture] = useState(
        () =>
            cachedProfile?.profile_picture_avatar_url ||
            cachedProfile?.profile_picture_url ||
            DEFAULT_AVATAR,
    );
    const { cartItems, clearCart } = useCart();
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
        let active = true;

        const syncProfile = async () => {
            setUsername(localStorage.getItem("username") || "");

            if (!getAccessToken()) {
                setProfilePicture(DEFAULT_AVATAR);
                return;
            }

            try {
                const profile = await fetchProfile(BASEURL);
                if (!active) return;

                setUsername(profile.username || "");
                setProfilePicture(
                    profile.profile_picture_avatar_url ||
                        profile.profile_picture_url ||
                        DEFAULT_AVATAR,
                );
                localStorage.setItem("username", profile.username || "");
            } catch {
                if (active) setProfilePicture(DEFAULT_AVATAR);
            }
        };

        const handleProfileChanged = () => void syncProfile();

        void syncProfile();
        window.addEventListener(
            "winkelo:profile-updated",
            handleProfileChanged,
        );
        window.addEventListener("winkelo:auth-changed", handleProfileChanged);
        window.addEventListener("storage", handleProfileChanged);
        return () => {
            active = false;
            window.removeEventListener(
                "winkelo:profile-updated",
                handleProfileChanged,
            );
            window.removeEventListener(
                "winkelo:auth-changed",
                handleProfileChanged,
            );
            window.removeEventListener("storage", handleProfileChanged);
        };
    }, [BASEURL]);

    const handleSearch = (e) => {
        e.preventDefault();
        const term = search.trim();
        if (term) {
            setSearchDraft({ query: term, value: term });
            navigate(`/?search=${encodeURIComponent(term)}`);
        }
    };

    const handleSearchChange = (event) => {
        setSearchDraft({ query: querySearch, value: event.target.value });
    };

    const cartCount = cartItems.reduce(
        (total, item) => total + item.quantity,
        0,
    );
    const isLoggedIn = !!getAccessToken();

    const handleLogout = () => {
        clearTokens();
        localStorage.removeItem("username");
        localStorage.removeItem("email");
        clearCart();
        setUsername("");
        setProfilePicture(DEFAULT_AVATAR);
        window.dispatchEvent(new Event("winkelo:auth-changed"));
        navigate("/login");
    };

    return (
        <nav
            className={`fixed top-0 z-50 w-full border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur transition-transform duration-300 ${
                showNav ? "translate-y-0" : "-translate-y-full"
            }`}
        >
            <div className="mx-auto grid h-16 max-w-[1600px] grid-cols-[40px_auto_1fr_auto] items-center gap-3 px-4 max-[360px]:gap-2 max-[360px]:px-3 sm:px-6 md:flex md:h-auto md:py-3 lg:px-8">
                <button
                    className="flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100 md:hidden"
                    onClick={onMenuToggle}
                    aria-label="Toggle menu"
                    type="button"
                >
                    <FaBars className="text-xl" />
                </button>

                <Link
                    to="/"
                    className="flex h-10 shrink-0 items-center gap-2 text-xl font-black leading-none tracking-tight text-slate-950 max-[360px]:text-lg"
                >
                    <img
                        src="/favicon-96x96.png"
                        alt=""
                        className="h-10 w-10 object-contain max-[360px]:h-8 max-[360px]:w-8"
                    />
                    <span className="relative top-[3px] max-[300px]:sr-only md:top-0">
                        Winkelo
                    </span>
                </Link>

                <form
                    onSubmit={handleSearch}
                    className="hidden flex-1 items-center md:flex"
                >
                    <div className="flex h-11 w-full overflow-hidden rounded-md border border-slate-300 bg-white focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
                        <input
                            id="desktop-product-search"
                            name="search"
                            type="text"
                            autoComplete="off"
                            placeholder="Search fashion, electronics, toys, plants..."
                            value={search}
                            onChange={handleSearchChange}
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

                <div className="col-start-4 flex h-10 min-w-0 shrink items-center gap-2 self-center sm:gap-3 md:col-auto md:ml-auto">
                    <Link
                        to="/cart"
                        className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-800 transition hover:bg-slate-100"
                        aria-label="Cart"
                    >
                        <FaShoppingCart className="text-xl" />
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
                        <div className="flex min-w-0 items-center gap-1">
                            <Link
                                to="/profile"
                                className="group flex min-w-0 items-center gap-2 rounded-full p-1 transition hover:bg-slate-100 md:pr-3"
                                aria-label="Open account profile"
                            >
                                <img
                                    src={profilePicture}
                                    alt=""
                                    className="h-8 w-8 shrink-0 rounded-full border border-slate-200 object-cover"
                                    decoding="async"
                                    onError={(event) => {
                                        event.currentTarget.onerror = null;
                                        event.currentTarget.src =
                                            DEFAULT_AVATAR;
                                    }}
                                />
                                <span className="hidden max-w-[92px] truncate text-sm font-black text-slate-900 transition group-hover:text-emerald-700 md:block">
                                    {username
                                        ? username.charAt(0).toUpperCase() +
                                          username.slice(1)
                                        : "Account"}
                                </span>
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
                                type="button"
                                aria-label="Log out"
                                title="Log out"
                            >
                                <FaSignOutAlt className="text-xl" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="px-4 pb-3 max-[360px]:px-3 md:hidden">
                <form onSubmit={handleSearch} className="flex h-10">
                    <input
                        id="mobile-product-search"
                        name="search"
                        type="text"
                        autoComplete="off"
                        placeholder="Search products..."
                        value={search}
                        onChange={handleSearchChange}
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
