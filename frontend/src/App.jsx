import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { useState, useEffect } from "react";
import { AlertProvider } from "./context/AlertContext";

import ProductList from "../src/pages/ProductList";
import ProductDetails from "../src/pages/ProductDetails";
import CompareProducts from "./pages/CompareProducts";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import PrivateRouter from "./components/PrivateRouter";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

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

                {/* On desktop: respect the 60px collapsed sidebar. On mobile: no left margin */}
                <div className="md:ml-[60px] px-3 md:px-5 pt-1">
                    <Routes>
                        <Route path="/" element={<ProductList />} />
                        <Route path="/products" element={<ProductList />} />
                        <Route
                            path="/product/:id"
                            element={<ProductDetails />}
                        />
                        <Route path="/compare" element={<CompareProducts />} />
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
                </div>
            </Router>
        </AlertProvider>
    );
}

export default App;
