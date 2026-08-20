import { FaStar } from "react-icons/fa";
import CatalogProductsPage from "../components/CatalogProductsPage.jsx";

function WeeklyTopSelling() {
    return (
        <CatalogProductsPage
            catalog="weekly-top-selling"
            title="Weekly Top Selling"
            icon={<FaStar />}
            iconClassName="text-amber-500"
            emptyCopy="No weekly top-selling products are available yet."
            countLabel="products"
        />
    );
}

export default WeeklyTopSelling;
