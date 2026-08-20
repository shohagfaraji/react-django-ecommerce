import { FaBolt } from "react-icons/fa";
import CatalogProductsPage from "../components/CatalogProductsPage.jsx";

function SaleProducts() {
    return (
        <CatalogProductsPage
            catalog="sale"
            title="Deals"
            icon={<FaBolt />}
            iconClassName="text-[#b62324]"
            emptyCopy="No discounted products right now."
            countLabel="deals"
        />
    );
}

export default SaleProducts;
