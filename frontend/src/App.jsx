import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import ProductList from "../src/pages/ProductList";
import ProductDetails from "../src/pages/ProductDetails";
import Navbar from "./components/Navbar";
import CartPage from "./pages/CartPage";

function App() {
    return (
        <Router>
            <Navbar />
            <Routes>
                <Route path="/" element={<ProductList />} />
                <Route path="/product/:id" element={<ProductDetails />} />
                <Route path="/cart" element={<CartPage />} />
            </Routes>
        </Router>
    );
}

export default App;
