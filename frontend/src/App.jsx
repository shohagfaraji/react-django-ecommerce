import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { useState, useEffect } from "react";
import { AlertProvider } from "./context/AlertContext";

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

function App() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_DJANGO_BASE_URL}/api/categories/`).catch(
            () => {},
        );
    }, []);

    return (
        <AlertProvider>
            <Router>
                <Navbar onMenuToggle={() => setSidebarOpen((prev) => !prev)} />
                <Sidebar
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                />

                <div className="md:ml-[60px]">
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
