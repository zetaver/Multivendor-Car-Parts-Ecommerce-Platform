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
    <div className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-4">
        {/* Main Navbar */}
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <span className="text-2xl font-bold text-blue-600">EasyCasse</span>
          </Link>

          {/* Desktop Search Bar */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8">
            <div 
              onClick={() => navigate('/products')}
              className="relative flex items-center w-full bg-gray-100 rounded-full px-4 py-2.5 cursor-pointer"
            >
              <Search className="w-5 h-5 text-gray-400 mr-2" />
              <span className="text-gray-500">Search</span>
            </div>
          </div>

          {/* Mobile Icons */}
          <div className="flex md:hidden items-center space-x-4">
            <button
              onClick={() => navigate('/products')}
              className="text-gray-600 hover:text-gray-900"
            >
              <Search className="h-6 w-6" />
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600 hover:text-gray-900"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>

          {/* Desktop Right Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <LanguageSelector />
            {isAuthenticated ? (
              <>
                <Link 
                  to="/messages" 
                  className="text-gray-600 hover:text-gray-900 flex items-center space-x-1"
                >
                  <MessageSquare className="w-6 h-6" />
                </Link>
                <Link 
                  to="/notifications" 
                  className="text-gray-600 hover:text-gray-900 flex items-center space-x-1"
                >
                  <Bell className="w-6 h-6" />
                </Link>
                <button
                  onClick={() => dispatch(logout())}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  {t("common.logout")}
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  to="/login" 
                  className="text-blue-600 hover:text-blue-700"
                >
                  {t("common.login")}
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  {t("common.register")}
                </Link>
              </div>
            )}
            <Link
              to="/sell"
              className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 font-medium"
            >
              {t("nav.sell")}
            </Link>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="hidden md:block border-t">
          <div className="flex items-center space-x-8 h-12 text-sm">
            {categories.map((category) => (
              <div
                key={category.id}
                className="relative group"
                onMouseEnter={() => handleCategoryClick(category.id)}
                onMouseLeave={() => setExpandedCategory(null)}
              >
                <button className="flex items-center space-x-1 text-gray-600 hover:text-gray-900">
                  <span>{category.icon}</span>
                  <span>{category.name}</span>
                </button>

                {/* Dropdown Menu */}
                {expandedCategory === category.id && (
                  <div className="absolute top-full left-0 w-64 bg-white shadow-lg rounded-lg mt-1 py-2 z-50">
                    {category.subcategories.map((subcategory) => (
                      <div key={subcategory.name} className="px-4 py-2">
                        <div className="font-medium text-gray-900 mb-2">
                          {subcategory.name}
                        </div>
                        <div className="space-y-2">
                          {subcategory.items.map((item) => (
                            <Link
                              key={item}
                              to={`/products?category=${category.id}&subcategory=${subcategory.name}&item=${item}`}
                              className="block text-sm text-gray-600 hover:text-blue-600"
                            >
                              {item}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Categories Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
            {categories.map((category) => (
              <div key={category.id}>
                <button
                  onClick={() => handleCategoryClick(category.id)}
                  className="flex items-center justify-between w-full px-4 py-3 text-gray-600 hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-2">
                    <span>{category.icon}</span>
                    <span>{category.name}</span>
                  </div>
                  <ChevronRight className="w-5 h-5" />
                </button>

                {expandedCategory === category.id && (
                  <div className="bg-gray-50 px-4 py-2">
                    {category.subcategories.map((subcategory) => (
                      <div key={subcategory.name} className="mb-4">
                        <div className="font-medium text-gray-900 mb-2">
                          {subcategory.name}
                        </div>
                        <div className="space-y-2">
                          {subcategory.items.map((item) => (
                            <Link
                              key={item}
                              to={`/products?category=${category.id}&subcategory=${subcategory.name}&item=${item}`}
                              className="block text-sm text-gray-600 hover:text-blue-600 py-1"
                            >
                              {item}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Add this CSS to your global styles or create a new CSS module
const styles = `
  /* Hide scrollbar for Chrome, Safari and Opera */
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }

  /* Hide scrollbar for IE, Edge and Firefox */
  .scrollbar-hide {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
  }
`;

// Add the styles to the document
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default Navbar;