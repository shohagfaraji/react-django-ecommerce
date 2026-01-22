import { useEffect, useState } from "react";
// import "./App.css";

function App() {
    const [products, setProducts] = useState([]);

    useEffect(() => {
        fetch("http://127.0.0.1:8000/api/products/")
            .then((response) => response.json())
            .then((data) => setProducts(data))
            .catch((error) => console.error(error));
    }, []);

    return (
        <>
            <div className="min-h-screen bg-gray-100 test-gray-800">
                <h1 className="text-3xl font-bold">Product list</h1>
                <div className="container mx-auto p-4">
                    {products.map((product) => (
                        <div
                            key={product.id}
                            className="bg-white p-4 rounded shadow mb-4"
                        >
                            <h2 className="text-xl font-semibold">
                                {product.name}
                            </h2>
                            <p className="text-gray-600">
                                {product.description}
                            </p>
                            <p className="text-gray-600 font-bold">
                                {product.price} BDT
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}

export default App;
