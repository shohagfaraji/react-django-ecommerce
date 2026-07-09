import "./Sidebar.css";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    FaBaby,
    FaChevronRight,
    FaLeaf,
    FaMobileAlt,
    FaRunning,
    FaShoppingBag,
    FaSpa,
    FaTimes,
    FaTshirt,
} from "react-icons/fa";

const sectionIcons = {
    clothing: <FaTshirt />,
    electronics: <FaMobileAlt />,
    toys: <FaBaby />,
    garden: <FaLeaf />,
    home: <FaShoppingBag />,
    beauty: <FaSpa />,
    sports: <FaRunning />,
    other: <FaShoppingBag />,
};

const fallbackCategories = [
    {
        name: "Clothing",
        slug: "clothing",
        section: "clothing",
        description: "Fashion for men, women, and kids",
        children: [
            { name: "Men", slug: "mens-clothing" },
            { name: "Women", slug: "womens-clothing" },
            { name: "Kids", slug: "kids-clothing" },
            { name: "Shoes", slug: "shoes" },
        ],
    },
    {
        name: "Electronics",
        slug: "electronics",
        section: "electronics",
        description: "Phones, computers, gaming, storage, and accessories",
        children: [
            { name: "Mobile Phones", slug: "mobile-phones" },
            { name: "Laptops", slug: "laptops" },
            { name: "Headphones", slug: "headphones" },
            { name: "Smart Watches", slug: "smart-watches" },
        ],
    },
    {
        name: "Toys & Kids",
        slug: "toys",
        section: "toys",
        description: "Baby items, learning toys, outdoor play, and gifts",
        children: [
            { name: "Baby Toys", slug: "baby-toys" },
            { name: "Learning Toys", slug: "learning-toys" },
            { name: "Outdoor Play", slug: "outdoor-play" },
        ],
    },
    {
        name: "Garden & Plants",
        slug: "garden",
        section: "garden",
        description: "Indoor plants, planters, soil, and garden care",
        children: [
            { name: "Indoor Plants", slug: "indoor-plants" },
            { name: "Flowering Plants", slug: "flowering-plants" },
            { name: "Plant Pots", slug: "plant-pots" },
        ],
    },
];

function Sidebar({ isOpen, onClose }) {
    const [categories, setCategories] = useState(fallbackCategories);
    const navigate = useNavigate();
    const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL;

    useEffect(() => {
        const controller = new AbortController();

        fetch(`${BASEURL}/api/categories/`, { signal: controller.signal })
            .then((res) => res.json())
            .then((data) => {
                const nextCategories = Array.isArray(data) ? data : [];
                setCategories(
                    nextCategories.length ? nextCategories : fallbackCategories,
                );
            })
            .catch(() => {});

        return () => controller.abort();
    }, [BASEURL]);

    const openCategory = (slug) => {
        navigate(`/products?category=${slug}`);
        onClose();
    };

    return (
        <>
            {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}

            <aside
                className={`market-sidebar ${isOpen ? "mobile-open" : ""}`}
                aria-label="Shop departments"
            >
                <div className="sidebar-head">
                    <div>
                        <p className="sidebar-kicker">Shop by department</p>
                        <h2>All Categories</h2>
                    </div>
                    <button
                        type="button"
                        className="sidebar-close"
                        onClick={onClose}
                        aria-label="Close category menu"
                    >
                        <FaTimes />
                    </button>
                </div>

                <div className="department-list">
                    {categories.map((category) => (
                        <section className="department" key={category.slug}>
                            <button
                                type="button"
                                className="department-main"
                                onClick={() => openCategory(category.slug)}
                            >
                                <span className="department-icon">
                                    {sectionIcons[category.section] ||
                                        sectionIcons.other}
                                </span>
                                <span>
                                    <strong>{category.name}</strong>
                                    <small>{category.description}</small>
                                </span>
                                <FaChevronRight className="department-arrow" />
                            </button>

                            {category.children?.length > 0 && (
                                <div className="subcategory-grid">
                                    {category.children.map((child) => (
                                        <button
                                            type="button"
                                            key={child.slug}
                                            onClick={() =>
                                                openCategory(child.slug)
                                            }
                                        >
                                            {child.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </section>
                    ))}
                </div>

                <Link to="/sale" className="sidebar-promo" onClick={onClose}>
                    <span>Live offers</span>
                    <strong>Browse active discounts</strong>
                </Link>
            </aside>
        </>
    );
}

export default Sidebar;
