import {
    BrowserRouter as Router,
    Route,
    Routes,
    useLocation,
} from "react-router-dom";
import { useEffect, useState } from "react";
import { AlertProvider } from "./context/AlertContext";
import SaleProducts from "./pages/SaleProducts";
import ProductList from "../src/pages/ProductList";
import ProductDetails from "../src/pages/ProductDetails";
import CompareProducts from "./pages/CompareProducts";
import WeeklyTopSelling from "./pages/WeeklyTopSelling";
import NewArrivals from "./pages/NewArrivals";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import PrivateRouter from "./components/PrivateRouter";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Footer from "./components/Footer";

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
                    <Routes>
                        <Route path="/" element={<ProductList />} />
                        <Route path="/products" element={<ProductList />} />
                        <Route
                            path="/product/:id"
                            element={<ProductDetails />}
                        />
                        <Route path="/compare" element={<CompareProducts />} />
                        <Route
                            path="/weekly-top-selling"
                            element={<WeeklyTopSelling />}
                        />
                        <Route path="/new-arrivals" element={<NewArrivals />} />
                        <Route path="/sale" element={<SaleProducts />} />
                        <Route path="/cart" element={<CartPage />} />

                        <Route element={<PrivateRouter />}>
                            <Route
                                path="/checkout"
                                element={<CheckoutPage />}
                            />
                        </Route>

                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                    </Routes>
                    <Footer />
                </div>
            </Router>
        </AlertProvider>
    );
}

export default App;
