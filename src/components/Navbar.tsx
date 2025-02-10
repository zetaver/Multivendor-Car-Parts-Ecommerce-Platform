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
  ChevronDown,
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
    <div className="fixed top-0 left-0 right-0 bg-secondary z-50">
      {/* Top Bar */}
      <div className="bg-secondary-dark text-white py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center space-x-4">
              <Link to="/seller-support" className="hover:text-primary transition-colors">
                Seller Support
              </Link>
              <Link to="/help" className="hover:text-primary transition-colors">
                Help Center
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSelector />
              <Link to="/track-order" className="hover:text-primary transition-colors">
                Track Order
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="bg-secondary border-b border-secondary-light/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0 flex items-center">
              <img
                src="/logo.png"
                alt="EasyCasse"
                className="h-12 w-auto"
              />
            </Link>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl mx-8">
              <form 
                onSubmit={handleSearch}
                className="relative flex items-center"
              >
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for auto parts..."
                  className="w-full pl-4 pr-10 py-2 bg-secondary-light rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button 
                  type="submit" 
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary"
                >
                  <Search className="w-5 h-5" />
                </button>
              </form>
            </div>

            {/* Right Navigation */}
            <div className="flex items-center space-x-6">
              <Link 
                to="/sell" 
                className="bg-primary hover:bg-primary-dark text-secondary-dark px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Sell Parts
              </Link>

              {isAuthenticated ? (
                <>
                  <Link 
                    to="/messages" 
                    className="text-white hover:text-primary transition-colors"
                  >
                    <MessageSquare className="w-6 h-6" />
                  </Link>
                  <Link 
                    to="/notifications" 
                    className="text-white hover:text-primary transition-colors"
                  >
                    <Bell className="w-6 h-6" />
                  </Link>
                  <div className="relative group">
                    <button className="flex items-center text-white hover:text-primary transition-colors">
                      <User className="w-6 h-6" />
                      <ChevronDown className="w-4 h-4 ml-1" />
                    </button>
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 hidden group-hover:block">
                      <Link 
                        to="/profile" 
                        className="block px-4 py-2 text-secondary hover:bg-gray-100"
                      >
                        Profile
                      </Link>
                      <Link 
                        to="/settings" 
                        className="block px-4 py-2 text-secondary hover:bg-gray-100"
                      >
                        Settings
                      </Link>
                      <button 
                        onClick={() => dispatch(logout())}
                        className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <Link 
                  to="/login" 
                  className="text-white hover:text-primary transition-colors flex items-center"
                >
                  <User className="w-6 h-6 mr-2" />
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Categories Bar */}
      <div className="bg-secondary-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-8 h-12 text-sm">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/products?category=${category.id}`}
                className="text-gray-300 hover:text-primary transition-colors flex items-center"
              >
                <span className="mr-2">{category.icon}</span>
                {category.name}
              </Link>
            ))}
          </div>
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