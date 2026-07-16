import { Link } from "react-router-dom";
import { FaHeadset, FaShieldAlt, FaTruck } from "react-icons/fa";

function Footer() {
    return (
        <footer className="border-t border-slate-800 bg-slate-950 text-slate-300">
            <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.2fr_0.8fr_0.8fr_1fr] lg:px-8">
                <div>
                    <Link
                        to="/"
                        className="flex items-center gap-2 text-2xl font-black text-white"
                    >
                        <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md bg-white">
                            <img
                                src="/favicon.svg"
                                alt=""
                                className="h-full w-full object-contain"
                            />
                        </span>
                        Winkelo
                    </Link>
                    <p className="mt-4 max-w-sm text-sm leading-6 text-slate-400">
                        Shop everyday finds across fashion, electronics, toys,
                        plants, home essentials, and more from one organized
                        marketplace.
                    </p>
                    <div className="mt-5 grid gap-3 text-sm">
                        <div className="flex items-center gap-3">
                            <FaTruck className="text-emerald-400" />
                            Fast delivery updates
                        </div>
                        <div className="flex items-center gap-3">
                            <FaShieldAlt className="text-emerald-400" />
                            Secure checkout
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8 md:contents">
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
                </div>

                <div>
                    <p className="text-sm font-black uppercase tracking-wide text-white">
                        Customer Care
                    </p>
                    <p className="mt-4 text-sm leading-6 text-slate-400">
                        Need help choosing products or reviewing an order? Our
                        support team is here to keep shopping simple.
                    </p>
                    <div className="mt-5 inline-flex items-center gap-3 rounded-md border border-slate-700 px-4 py-3 text-sm font-bold text-slate-300">
                        <FaHeadset className="text-emerald-400" />
                        Support available daily
                    </div>
                </div>
            </div>

            <div className="border-t border-slate-800 px-4 py-5 text-center text-xs text-slate-500">
                &copy; {new Date().getFullYear()} Winkelo. All rights reserved.
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
