import "./Sidebar.css";
import {
    FaMobileAlt,
    FaLaptop,
    FaTabletAlt,
    FaDesktop,
    FaPrint,
    FaCamera,
    FaTv,
    FaVolumeUp,
    FaHeadphones,
    FaLightbulb,
    FaPlug,
    FaFan,
    FaBatteryFull,
    FaKeyboard,
    FaMouse,
    FaHdd,
    FaWifi,
    FaNetworkWired,
    FaClock,
    FaGamepad,
    FaVideo,
    FaDoorOpen,
    FaBolt,
    FaMicrochip,
    FaBroadcastTower,
    FaServer,
    FaTools,
    FaSdCard,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const categories = [
    { icon: <FaMobileAlt />, name: "Mobile Phones" },
    { icon: <FaDesktop />, name: "Desktop Computers" },
    { icon: <FaLaptop />, name: "Laptops" },
    { icon: <FaTabletAlt />, name: "Tablets" },
    { icon: <FaHeadphones />, name: "Headphones" },
    { icon: <FaKeyboard />, name: "Keyboard" },
    { icon: <FaMouse />, name: "Mouse" },
    { icon: <FaHdd />, name: "Hard Drives / SSD" },
    { icon: <FaGamepad />, name: "Gaming Consoles" },
    { icon: <FaWifi />, name: "WiFi Routers" },
    { icon: <FaPrint />, name: "Printers & Scanners" },
    { icon: <FaClock />, name: "Smart Watches" },
    { icon: <FaCamera />, name: "Cameras" },
    { icon: <FaTv />, name: "Smart TVs" },
    { icon: <FaBolt />, name: "Wires & Cables" },
    { icon: <FaBatteryFull />, name: "Power Banks" },
    { icon: <FaBolt />, name: "Chargers & Adapters" },
    { icon: <FaServer />, name: "UPS / Inverters" },
    { icon: <FaSdCard />, name: "USB Drives" },
    { icon: <FaNetworkWired />, name: "Network Switches" },
    { icon: <FaBroadcastTower />, name: "LAN Cables" },
    { icon: <FaVideo />, name: "Security Cameras" },
];

function Sidebar() {
    const navigate = useNavigate();
    const toSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    return (
        <div className="sidebar">
            {categories.map((cat, index) => (
                <div
                    key={index}
                    className="sidebar-item"
                    onClick={() =>
                        navigate(`/products?category=${toSlug(cat.name)}`)
                    }
                >
                    <span className="icon">{cat.icon}</span>
                    <span className="text">{cat.name}</span>
                </div>
            ))}
        </div>
    );
}

export default Sidebar;
