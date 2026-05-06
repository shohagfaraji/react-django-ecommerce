import { FaLinkedin, FaGithub, FaGlobe } from "react-icons/fa";

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
        <footer className="bg-slate-900 text-gray-400 py-5 px-6">
            <div className="max-w-5xl mx-auto flex flex-col items-center gap-6">
                {/* Developer credit */}
                <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">
                        Designed & developed by
                    </p>
                    <a
                        href="https://shohagfaraji.netlify.app/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 hover:text-emerald-300 transition font-semibold text-base"
                    >
                        Shohag Faraji
                    </a>
                </div>

                {/* Social links */}
                <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6">
                    {socials.map(({ icon, label, href }) => (
                        <a
                            key={label}
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={label}
                            className="flex items-center gap-2 text-gray-400 hover:text-emerald-400 transition text-sm"
                        >
                            {icon}
                            <span>{label}</span>
                        </a>
                    ))}
                </div>

                {/* Bottom line */}
                <div className="w-full border-t border-slate-800 pt-4 text-center text-xs text-gray-600">
                    © {new Date().getFullYear()} VoltEdge · All rights reserved
                </div>
            </div>
        </footer>
    );
}

export default Footer;
