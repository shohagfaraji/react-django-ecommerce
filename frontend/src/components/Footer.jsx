import { Link } from "react-router-dom";
import {
    FaGithub,
    FaGlobe,
    FaLinkedin,
    FaShieldAlt,
    FaStore,
    FaTruck,
} from "react-icons/fa";

const socials = [
    {
        icon: <FaLinkedin size={16} />,
        label: "LinkedIn",
        href: "https://www.linkedin.com/in/shohagfaraji",
    },
    {
        icon: <FaGithub size={16} />,
        label: "GitHub",
        href: "https://github.com/shohagfaraji/",
    },
    {
        icon: <FaGlobe size={16} />,
        label: "Portfolio",
        href: "https://shohagfaraji.netlify.app/",
    },
];

function Footer() {
    return (
        <footer className="border-t border-slate-800 bg-slate-950 text-slate-300">
            <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.2fr_0.8fr_0.8fr_1fr] lg:px-8">
                <div>
                    <Link
                        to="/"
                        className="flex items-center gap-2 text-2xl font-black text-white"
                    >
                        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-600">
                            <FaStore />
                        </span>
                        VoltEdge
                    </Link>
                    <p className="mt-4 max-w-sm text-sm leading-6 text-slate-400">
                        A full-stack marketplace demo with departments, offers,
                        product comparison, cart, checkout, admin-controlled
                        banners, and real deployment integrations.
                    </p>
                    <div className="mt-5 grid gap-3 text-sm">
                        <div className="flex items-center gap-3">
                            <FaTruck className="text-emerald-400" />
                            Fast catalog browsing
                        </div>
                        <div className="flex items-center gap-3">
                            <FaShieldAlt className="text-emerald-400" />
                            Secure JWT checkout flow
                        </div>
                    </div>
                </div>

                <FooterColumn
                    title="Shop"
                    links={[
                        ["All products", "/products"],
                        ["Live offers", "/sale"],
                        ["New arrivals", "/new-arrivals"],
                        ["Top selling", "/weekly-top-selling"],
                    ]}
                />

                <FooterColumn
                    title="Departments"
                    links={[
                        ["Clothing", "/products?category=clothing"],
                        ["Electronics", "/products?category=electronics"],
                        ["Toys & Kids", "/products?category=toys"],
                        ["Garden", "/products?category=garden"],
                    ]}
                />

                <div>
                    <p className="text-sm font-black uppercase tracking-wide text-white">
                        Developer
                    </p>
                    <a
                        href="https://shohagfaraji.netlify.app/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-block text-lg font-black text-emerald-400 transition hover:text-emerald-300"
                    >
                        Shohag Faraji
                    </a>
                    <div className="mt-5 flex flex-wrap gap-3">
                        {socials.map(({ icon, label, href }) => (
                            <a
                                key={label}
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={label}
                                className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-700 px-3 text-sm font-bold text-slate-300 transition hover:border-emerald-500 hover:text-emerald-400"
                            >
                                {icon}
                                {label}
                            </a>
                        ))}
                    </div>
                </div>
            </div>

            <div className="border-t border-slate-800 px-4 py-5 text-center text-xs text-slate-500">
                © {new Date().getFullYear()} VoltEdge. Full-stack ecommerce
                portfolio project.
            </div>
        </footer>
    );
}

function FooterColumn({ title, links }) {
    return (
        <div>
            <p className="text-sm font-black uppercase tracking-wide text-white">
                {title}
            </p>
            <div className="mt-4 grid gap-3">
                {links.map(([label, href]) => (
                    <Link
                        key={href}
                        to={href}
                        className="text-sm font-semibold text-slate-400 transition hover:text-emerald-400"
                    >
                        {label}
                    </Link>
                ))}
            </div>
        </div>
    );
}

export default Footer;
