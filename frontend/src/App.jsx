import {
    BrowserRouter as Router,
    Route,
    Routes,
    useLocation,
} from "react-router-dom";
import { lazy, Suspense, useEffect, useState } from "react";
import { AlertProvider } from "./context/AlertContext";
import ProductList from "../src/pages/ProductList";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import PrivateRouter from "./components/PrivateRouter";
import Footer from "./components/Footer";

const CartPage = lazy(() => import("./pages/CartPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const CompareProducts = lazy(() => import("./pages/CompareProducts"));
const Login = lazy(() => import("./pages/Login"));
const NewArrivals = lazy(() => import("./pages/NewArrivals"));
const OrderDetailPage = lazy(() => import("./pages/OrderDetailPage"));
const ProductDetails = lazy(() => import("./pages/ProductDetails"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const SaleProducts = lazy(() => import("./pages/SaleProducts"));
const Signup = lazy(() => import("./pages/Signup"));
const WeeklyTopSelling = lazy(() => import("./pages/WeeklyTopSelling"));

function ScrollToTop() {
    const { pathname, search } = useLocation();

    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }, [pathname, search]);

    return null;
}

function App() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia("(min-width: 768px)");
        const syncSidebar = () => setSidebarOpen(mediaQuery.matches);

        syncSidebar();
        mediaQuery.addEventListener("change", syncSidebar);
        return () => mediaQuery.removeEventListener("change", syncSidebar);
    }, []);

    return (
        <AlertProvider>
            <Router>
                <ScrollToTop />
                <Navbar onMenuToggle={() => setSidebarOpen((prev) => !prev)} />
                <Sidebar
                    isOpen={sidebarOpen}
                    onOpen={() => setSidebarOpen(true)}
                    onClose={() => setSidebarOpen(false)}
                />

                <div
                    className={`transition-[margin] duration-300 ${
                        sidebarOpen ? "md:ml-[286px]" : "md:ml-0"
                    }`}
                >
                    <Suspense fallback={<RouteLoading />}>
                        <Routes>
                            <Route path="/" element={<ProductList />} />
                            <Route path="/products" element={<ProductList />} />
                            <Route
                                path="/product/:id"
                                element={<ProductDetails />}
                            />
                            <Route
                                path="/compare"
                                element={<CompareProducts />}
                            />
                            <Route
                                path="/weekly-top-selling"
                                element={<WeeklyTopSelling />}
                            />
                            <Route
                                path="/new-arrivals"
                                element={<NewArrivals />}
                            />
                            <Route path="/sale" element={<SaleProducts />} />
                            <Route path="/cart" element={<CartPage />} />

                            <Route element={<PrivateRouter />}>
                                <Route
                                    path="/checkout"
                                    element={<CheckoutPage />}
                                />
                                <Route
                                    path="/profile"
                                    element={<ProfilePage />}
                                />
                                <Route
                                    path="/profile/orders/:id"
                                    element={<OrderDetailPage />}
                                />
                            </Route>

                            <Route path="/login" element={<Login />} />
                            <Route path="/signup" element={<Signup />} />
                        </Routes>
                    </Suspense>
                    <Footer />
                </div>
            </Router>
        </AlertProvider>
    );
}

function RouteLoading() {
    return (
        <main className="min-h-screen bg-[#f6f7f9] px-4 pt-36 md:pt-28">
            <div className="mx-auto max-w-[1440px] animate-pulse space-y-6">
                <div className="h-9 w-56 rounded bg-slate-200" />
                <div className="h-96 rounded-xl bg-white" />
            </div>
        </main>
    );
}

export default App;
