import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import ProductList from "../src/pages/ProductList";
import ProductDetails from "../src/pages/ProductDetails";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import PrivateRouter from "./components/PrivateRouter";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

function App() {
    return (
        <Router>
            <Navbar />
            <Sidebar />

            <div style={{ marginLeft: "60px", padding: "20px" }}>
                <Routes>
                    <Route path="/" element={<ProductList />} />
                    <Route path="/products" element={<ProductList />} />
                    <Route path="/product/:id" element={<ProductDetails />} />
                    <Route path="/cart" element={<CartPage />} />

                    <Route element={<PrivateRouter />}>
                        <Route path="/checkout" element={<CheckoutPage />} />
                    </Route>

                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
