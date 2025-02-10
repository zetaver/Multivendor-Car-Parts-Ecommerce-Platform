import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../store/slices/authSlice";
import { RootState } from "../store/store";
import {
  Search,
  ShoppingCart,
  User,
  MessageSquare,
  Bell,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Car,
  Home,
  Plus,
} from "lucide-react";
import LanguageSelector from "./LanguageSelector";
import { useTranslation } from "react-i18next";

// Updated categories type to include nested subcategories
interface SubCategory {
  name: string;
  items: string[];
}

interface Category {
  id: string;
  name: string;
  icon: string;
  subcategories: SubCategory[];
}

const categories: Category[] = [
  {
    id: "engine",
    name: "Engine Parts",
    icon: "🔧",
    subcategories: [
      {
        name: "Engine Components",
        items: [
          "Engine Blocks",
          "Pistons & Rings",
          "Crankshafts",
          "Camshafts",
          "Valves & Springs",
          "Cylinder Heads",
          "Timing Belts & Chains"
        ]
      },
      {
        name: "Fuel System",
        items: [
          "Fuel Pumps",
          "Fuel Injectors",
          "Carburetors",
          "Fuel Filters",
          "Fuel Lines",
          "Fuel Tanks"
        ]
      }
    ]
  },
  {
    id: "transmission",
    name: "Transmission",
    icon: "⚙️",
    subcategories: [
      {
        name: "Transmission Parts",
        items: [
          "Gearboxes",
          "Clutch Kits",
          "Torque Converters",
          "Transmission Filters",
          "Shift Kits",
          "Transmission Mounts"
        ]
      },
      {
        name: "Drive Train",
        items: [
          "CV Joints",
          "Drive Shafts",
          "Differentials",
          "Transfer Cases",
          "Axle Assemblies"
        ]
      }
    ]
  },
  {
    id: "brakes",
    name: "Brakes",
    icon: "🛑",
    subcategories: [
      {
        name: "Brake Components",
        items: [
          "Brake Pads",
          "Brake Rotors",
          "Brake Calipers",
          "Brake Lines",
          "Master Cylinders",
          "Brake Boosters"
        ]
      },
      {
        name: "ABS System",
        items: [
          "ABS Sensors",
          "ABS Modules",
          "Hydraulic Units",
          "Speed Sensors",
          "Control Modules"
        ]
      }
    ]
  },
  {
    id: "suspension",
    name: "Suspension",
    icon: "🔩",
    subcategories: [
      {
        name: "Suspension Parts",
        items: [
          "Shock Absorbers",
          "Struts",
          "Coil Springs",
          "Control Arms",
          "Ball Joints",
          "Tie Rods"
        ]
      },
      {
        name: "Steering",
        items: [
          "Steering Racks",
          "Power Steering Pumps",
          "Steering Columns",
          "Steering Wheels",
          "Steering Linkages"
        ]
      }
    ]
  },
  {
    id: "electrical",
    name: "Electrical",
    icon: "⚡",
    subcategories: [
      {
        name: "Starting & Charging",
        items: [
          "Alternators",
          "Starters",
          "Batteries",
          "Voltage Regulators",
          "Ignition Coils",
          "Spark Plugs"
        ]
      },
      {
        name: "Sensors & Switches",
        items: [
          "Oxygen Sensors",
          "MAP Sensors",
          "Temperature Sensors",
          "Pressure Switches",
          "Position Sensors"
        ]
      }
    ]
  },
  {
    id: "exterior",
    name: "Exterior",
    icon: "🚗",
    subcategories: [
      {
        name: "Body Parts",
        items: [
          "Bumpers",
          "Fenders",
          "Hoods",
          "Grilles",
          "Door Panels",
          "Side Mirrors",
          "Windshields"
        ]
      },
      {
        name: "Lighting",
        items: [
          "Headlights",
          "Tail Lights",
          "Fog Lights",
          "Turn Signals",
          "LED Bulbs",
          "Light Assemblies"
        ]
      }
    ]
  },
  {
    id: "interior",
    name: "Interior",
    icon: "💺",
    subcategories: [
      {
        name: "Interior Parts",
        items: [
          "Seats",
          "Dashboard Components",
          "Floor Mats",
          "Steering Wheel Covers",
          "Shift Knobs",
          "Pedal Covers"
        ]
      },
      {
        name: "Climate Control",
        items: [
          "A/C Compressors",
          "Heater Cores",
          "Blower Motors",
          "A/C Condensers",
          "Climate Control Units"
        ]
      }
    ]
  },
  {
    id: "exhaust",
    name: "Exhaust",
    icon: "💨",
    subcategories: [
      {
        name: "Exhaust Components",
        items: [
          "Mufflers",
          "Catalytic Converters",
          "Exhaust Pipes",
          "Headers",
          "Resonators",
          "O2 Sensors"
        ]
      },
      {
        name: "Emission Control",
        items: [
          "EGR Valves",
          "Air Pumps",
          "PCV Valves",
          "Emission Control Units",
          "Vapor Canisters"
        ]
      }
    ]
  },
  {
    id: "maintenance",
    name: "Maintenance",
    icon: "🔧",
    subcategories: [
      {
        name: "Filters",
        items: [
          "Oil Filters",
          "Air Filters",
          "Fuel Filters",
          "Cabin Air Filters",
          "Transmission Filters"
        ]
      },
      {
        name: "Fluids",
        items: [
          "Motor Oil",
          "Transmission Fluid",
          "Brake Fluid",
          "Coolant",
          "Power Steering Fluid",
          "Windshield Washer Fluid"
        ]
      }
    ]
  },
  {
    id: "tools",
    name: "Tools",
    icon: "🛠️",
    subcategories: [
      {
        name: "Hand Tools",
        items: [
          "Wrenches",
          "Socket Sets",
          "Screwdrivers",
          "Pliers",
          "Hammers",
          "Specialty Tools"
        ]
      },
      {
        name: "Diagnostic Tools",
        items: [
          "OBD Scanners",
          "Multimeters",
          "Pressure Testers",
          "Timing Lights",
          "Battery Testers"
        ]
      }
    ]
  }
];

const Navbar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedSubcategory, setExpandedSubcategory] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { t } = useTranslation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    if (expandedCategory === categoryId) {
      setExpandedCategory(null);
      setExpandedSubcategory(null);
    } else {
      setExpandedCategory(categoryId);
      setExpandedSubcategory(null);
    }
  };

  const handleSubcategoryClick = (subcategoryName: string) => {
    setExpandedSubcategory(subcategoryName);
  };

  return (
    <div className="fixed top-0 left-0 right-0 bg-[#1e3a8a] text-white z-50">
      <div className="max-w-7xl mx-auto px-4">
        {/* Top Bar */}
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <span className="text-2xl font-bold text-white">EasyCasse</span>
          </Link>

          {/* Right Navigation */}
          <div className="flex items-center space-x-4">
            <LanguageSelector />
            {isAuthenticated ? (
              <>
                <Link 
                  to="/messages" 
                  className="text-white/90 hover:text-white"
                >
                  <MessageSquare className="w-6 h-6" />
                </Link>
                <Link 
                  to="/notifications" 
                  className="text-white/90 hover:text-white"
                >
                  <Bell className="w-6 h-6" />
                </Link>
              </>
            ) : (
              <Link 
                to="/login" 
                className="text-white/90 hover:text-white"
              >
                <User className="w-6 h-6" />
              </Link>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white/90 hover:text-white md:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="py-2 border-t border-white/10">
          <form 
            onSubmit={handleSearch}
            className="relative flex items-center w-full"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for..."
              className="w-full pl-4 pr-10 py-1.5 bg-white rounded text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <button 
              type="submit" 
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
            >
              <Search className="w-4 h-4 text-gray-400" />
            </button>
          </form>
        </div>

        {/* Category Icons */}
        <div className="relative border-t border-white/10">
          <div className="flex overflow-x-auto scrollbar-hide py-2 space-x-8 px-2">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/products?category=${category.id}`}
                className="flex flex-col items-center group flex-shrink-0"
              >
                <div className="w-8 h-8 flex items-center justify-center text-lg mb-1">
                  {category.icon}
                </div>
                <span className="text-xs text-white/80 group-hover:text-white whitespace-nowrap">
                  {category.name}
                </span>
              </Link>
            ))}
          </div>
          
          {/* Scroll indicators */}
          <div className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-[#1e3a8a] w-8 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 bg-gradient-to-l from-[#1e3a8a] w-8 pointer-events-none" />
        </div>
      </div>
    </div>
  );
};

// Update the CSS styles
const styles = `
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }

  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  /* Add smooth scrolling */
  .scrollbar-hide {
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
  }
`;

// Add the styles to the document
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default Navbar;