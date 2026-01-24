import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import ProductList from "../src/pages/ProductList";
import ProductDetails from "../src/pages/ProductDetails";

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<ProductList />} />
                <Route path="/product/:id" element={<ProductDetails />} />
            </Routes>
        </Router>
    );
}

export default App;
