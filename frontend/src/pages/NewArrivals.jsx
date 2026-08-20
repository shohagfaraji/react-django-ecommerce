import { FaFire } from "react-icons/fa";
import CatalogProductsPage from "../components/CatalogProductsPage.jsx";

function NewArrivals() {
    return (
        <CatalogProductsPage
            catalog="new-arrivals"
            title="New Arrivals"
            icon={<FaFire />}
            iconClassName="text-orange-500"
            emptyCopy="No products found."
            countLabel="products"
        />
    );
}

export default NewArrivals;
