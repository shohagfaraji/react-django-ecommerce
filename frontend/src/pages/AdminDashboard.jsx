import { useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import {
    FaBars,
    FaBoxOpen,
    FaChartLine,
    FaClipboardList,
    FaImages,
    FaLayerGroup,
    FaSignOutAlt,
    FaStar,
    FaStore,
    FaTimes,
} from "react-icons/fa";
import AdminOverview from "../components/admin/AdminOverview";
import ProductsManager from "../components/admin/ProductsManager";
import {
    OrdersManager,
    ReviewsManager,
} from "../components/admin/OrderReviewManagers";
import {
    BannersManager,
    CategoriesManager,
} from "../components/admin/CatalogManagers";
import { clearTokens } from "../utils/auth";

const NAV_ITEMS = [
    { id: "overview", label: "Overview", icon: FaChartLine },
    { id: "products", label: "Products", icon: FaBoxOpen },
    { id: "orders", label: "Orders", icon: FaClipboardList },
    { id: "reviews", label: "Reviews", icon: FaStar },
    { id: "categories", label: "Categories", icon: FaLayerGroup },
    { id: "banners", label: "Hero banners", icon: FaImages },
];

function AdminDashboard() {
    const { staff } = useOutletContext();
    const [activeSection, setActiveSection] = useState("overview");
    const [menuOpen, setMenuOpen] = useState(false);
    const [overviewVersion, setOverviewVersion] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const previousTitle = document.title;
        document.title = "Admin Dashboard | Winkelo";
        return () => {
            document.title = previousTitle;
        };
    }, []);

    const openSection = (section) => {
        setActiveSection(section);
        setMenuOpen(false);
    };

    const handleLogout = () => {
        clearTokens();
        localStorage.removeItem("username");
        localStorage.removeItem("email");
        window.dispatchEvent(new Event("winkelo:auth-changed"));
        navigate("/login");
    };

    const sectionTitle = NAV_ITEMS.find(
        (item) => item.id === activeSection,
    )?.label;

    return (
        <div className="min-h-screen bg-[#f3f5f7] text-slate-900">
            {menuOpen && (
                <button
                    type="button"
                    className="fixed inset-0 z-40 bg-slate-950/45 lg:hidden"
                    onClick={() => setMenuOpen(false)}
                    aria-label="Close navigation"
                />
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-slate-950 text-white shadow-2xl transition-transform duration-300 lg:translate-x-0 ${
                    menuOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
                    <Link to="/" className="flex items-center gap-3">
                        <img
                            src="/favicon-96x96.png"
                            alt=""
                            className="h-10 w-10 object-contain"
                        />
                        <div>
                            <p className="text-lg font-black tracking-tight">
                                Winkelo
                            </p>
                            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-emerald-300">
                                Store admin
                            </p>
                        </div>
                    </Link>
                    <button
                        type="button"
                        onClick={() => setMenuOpen(false)}
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10 lg:hidden"
                        aria-label="Close navigation"
                    >
                        <FaTimes />
                    </button>
                </div>

                <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const selected = activeSection === item.id;
                        return (
                            <button
                                type="button"
                                key={item.id}
                                onClick={() => openSection(item.id)}
                                className={`flex h-12 w-full items-center gap-3 rounded-xl px-4 text-sm font-extrabold transition ${
                                    selected
                                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-950/20"
                                        : "text-slate-300 hover:bg-white/10 hover:text-white"
                                }`}
                            >
                                <Icon className="text-lg" />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>

                <div className="border-t border-white/10 p-4">
                    <Link
                        to="/"
                        className="flex h-11 items-center gap-3 rounded-xl px-4 text-sm font-bold text-slate-300 transition hover:bg-white/10 hover:text-white"
                    >
                        <FaStore />
                        View storefront
                    </Link>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="mt-1 flex h-11 w-full items-center gap-3 rounded-xl px-4 text-sm font-bold text-slate-300 transition hover:bg-[#b62324] hover:text-white"
                    >
                        <FaSignOutAlt />
                        Log out
                    </button>
                </div>
            </aside>

            <div className="lg:pl-[280px]">
                <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-7 lg:px-9">
                    <div className="flex min-w-0 items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setMenuOpen(true)}
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-700 lg:hidden"
                            aria-label="Open navigation"
                        >
                            <FaBars />
                        </button>
                        <div className="min-w-0">
                            <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">
                                Administration
                            </p>
                            <h1 className="truncate text-xl font-black text-slate-950 sm:text-2xl">
                                {sectionTitle}
                            </h1>
                        </div>
                    </div>
                    <div className="ml-3 min-w-0 text-right">
                        <p className="truncate text-sm font-black text-slate-900">
                            {staff.username}
                        </p>
                        <p className="hidden truncate text-xs font-semibold text-slate-500 sm:block">
                            {staff.email || "Staff account"}
                        </p>
                    </div>
                </header>

                <main className="p-4 sm:p-7 lg:p-9">
                    <div className={activeSection === "overview" ? "" : "hidden"}>
                        <AdminOverview
                            active={activeSection === "overview"}
                            refreshVersion={overviewVersion}
                            onNavigate={openSection}
                        />
                    </div>
                    <div className={activeSection === "products" ? "" : "hidden"}>
                        <ProductsManager
                            active={activeSection === "products"}
                            onChanged={() => setOverviewVersion((value) => value + 1)}
                        />
                    </div>
                    <div className={activeSection === "orders" ? "" : "hidden"}>
                        <OrdersManager
                            active={activeSection === "orders"}
                            onChanged={() => setOverviewVersion((value) => value + 1)}
                        />
                    </div>
                    <div className={activeSection === "reviews" ? "" : "hidden"}>
                        <ReviewsManager
                            active={activeSection === "reviews"}
                            onChanged={() => setOverviewVersion((value) => value + 1)}
                        />
                    </div>
                    <div className={activeSection === "categories" ? "" : "hidden"}>
                        <CategoriesManager
                            active={activeSection === "categories"}
                            onChanged={() => setOverviewVersion((value) => value + 1)}
                        />
                    </div>
                    <div className={activeSection === "banners" ? "" : "hidden"}>
                        <BannersManager
                            active={activeSection === "banners"}
                            onChanged={() => setOverviewVersion((value) => value + 1)}
                        />
                    </div>
                </main>
            </div>
        </div>
    );
}


export default AdminDashboard;
