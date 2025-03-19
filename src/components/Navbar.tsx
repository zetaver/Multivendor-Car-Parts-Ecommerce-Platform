import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout, setCredentials } from "../store/slices/authSlice";
import { RootState } from "../store/store";

import { Search, ChevronRight, ChevronLeft, User, ShoppingBag, Menu, Home, MessageSquare, Plus, LogOut, LogIn, Tag, ChevronDown, Package, Heart, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import clsx from 'clsx';
import SellDialog from './SellDialog';
import { div } from "framer-motion/client";
import { API_URL } from "../config";

interface SubCategory {
  name: string;
  items: string[];
}

interface Category {
  id: string;
  name: string;
  icon: string;
  subcategories: SubCategory[];
  parentId?: string;
}

interface ApiCategory {
  _id: string;
  name: string;
  description?: string;
  slug: string;
  imageUrl?: string;
  parentId?: string;
  subcategories?: ApiCategory[];
}

export const categories: Category[] = [
  {
    id: "women",
    name: "Women",
    icon: "/categorye/1.svg",
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
      }, {
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
      }, {
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
    id: "men",
    name: "Men",
    icon: "/categorye/2.svg",
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
    id: "electronics",
    name: "Electronics",
    icon: "/categorye/3.svg",
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
    id: "toys",
    name: "Toys",
    icon: "/categorye/4.svg",
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
    id: "gaming",
    name: "Gaming",
    icon: "/categorye/5.svg",
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
    id: "handbags",
    name: "Handbags",
    icon: "/categorye/6.svg",
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
    id: "home",
    name: "Home",
    icon: "/categorye/7.svg",
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
    id: "vintage",
    name: "Vintage",
    icon: "/categorye/8.svg",
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
    id: "beauty",
    name: "Beauty",
    icon: "/categorye/9.svg",
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
    id: "kids",
    name: "Kids",
    icon: "/categorye/10.svg",
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


interface NavbarProps {
  onMobileMenuToggle: (isOpen: boolean) => void;
  onMobileSearchToggle: (isOpen: boolean) => void;
  onBottomNavVisibilityChange: (isVisible: boolean) => void;
}

const Navbar: React.FC<NavbarProps> = ({
  onMobileMenuToggle,
  onMobileSearchToggle,
  onBottomNavVisibilityChange
}) => {
  <style>
    {`
      .scrollbar-thin::-webkit-scrollbar {
        width: 6px;
      }
      .scrollbar-thin::-webkit-scrollbar-track {
        background: #f1f1f1;
      }
      .scrollbar-thin::-webkit-scrollbar-thumb {
        background: #888;
        border-radius: 3px;
      }
      .scrollbar-thin::-webkit-scrollbar-thumb:hover {
        background: #555;
      }
    `}
  </style>
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDesktopSearchOpen, setIsDesktopSearchOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedSubcategory, setExpandedSubcategory] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [bottomNavVisible, setBottomNavVisible] = useState(true);
  const [currentView, setCurrentView] = useState<'main' | 'subcategory' | 'items'>('main');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<SubCategory | null>(null);
  const [showViewAll, setShowViewAll] = useState(false);
  const [selectedViewAllCategory, setSelectedViewAllCategory] = useState<Category | null>(null);
  const [selectedViewAllSubcategory, setSelectedViewAllSubcategory] = useState<SubCategory | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [hoveredSubcategory, setHoveredSubcategory] = useState<string | null>(null);
  const [clickedCategory, setClickedCategory] = useState<string | null>(null);
  const [isReturnPolicyOpen, setIsReturnPolicyOpen] = useState(false);
  const [isSellDialogOpen, setIsSellDialogOpen] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [hasCheckedLocalStorage, setHasCheckedLocalStorage] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const navigate = useNavigate();

  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [apiCategories, setApiCategories] = useState<ApiCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState('');



  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await fetch(`${API_URL}/api/categories`);

      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }

      const data = await response.json();
      console.log('Fetched categories:', data);
      setApiCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategoriesError('Failed to load categories');
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Add this effect near the top with other useEffects
  useEffect(() => {
    // Check localStorage for token immediately on component mount
    const token = localStorage.getItem('accessToken');
    const userRole = localStorage.getItem('userRole');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    console.log("User from localStorage:", user);

    console.log("Checking auth status:", { token, userRole });

    if (token) {
      setHasToken(true);

      // If token exists but Redux state isn't authenticated, we should try to restore
      // the auth state from the token
      if (!isAuthenticated) {
        // Here you would dispatch an action to validate the token and restore auth
        console.log("User has token but isn't authenticated in Redux state");

        // For a temporary solution, you could try to recreate a minimal user object
        // from localStorage if you store any user data there
        // This is not ideal but can help display the UI correctly
        const storedUserData = localStorage.getItem('user');
        if (storedUserData) {
          try {
            const userData = JSON.parse(storedUserData);
            // Here you would dispatch an action to set the user in Redux
            console.log("Restored user data from localStorage:", userData);
            dispatch(setCredentials({ user: userData, token: token }));
          } catch (e) {
            console.error("Failed to parse stored user data:", e);
          }
        }
      }
    } else {
      setHasToken(false);
    }

    setHasCheckedLocalStorage(true);
  }, [isAuthenticated]); // Re-run if isAuthenticated changes

  // Update checking state when authentication changes
  useEffect(() => {
    if (isAuthenticated && isCheckingAuth) {
      setIsCheckingAuth(false);
    }
  }, [isAuthenticated]);

  const formatImageUrl = (imageUrl: string | undefined | null): string => {
    // If the URL is null, undefined, or empty, return a placeholder image
    if (!imageUrl || imageUrl.trim() === '') {
      return 'https://via.placeholder.com/64'; // Larger placeholder for product cards
    }

    // Check if the URL already includes http:// or https://
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }

    // Check if the URL starts with a slash
    if (!imageUrl.startsWith('/')) {
      imageUrl = '/' + imageUrl;
    }

    // Return the complete URL
    return `${API_URL}${imageUrl}`;
  };

  // Add resize listener
  React.useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setIsMobileView(isMobile);
      // Sync mobile menu state with parent
      if (!isMobile && isMobileMenuOpen) {
        handleCloseMobileMenu();
      }
    };

    // Initial check
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileMenuOpen]); // Add isMobileMenuOpen as dependency

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.mega-menu-container')) {
        setClickedCategory(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
      setIsDesktopSearchOpen(false);
    }
  };

  const handleDesktopSearchFocus = () => {
    navigate('/search');
  };

  const handleDesktopSearchClose = () => {
    setIsDesktopSearchOpen(false);
  };

  const handleMobileSearchFocus = () => {

    navigate('/search');
  };

  const handleCategoryClick = (category: Partial<Category>) => {
    if (isMobileView) {
      setIsMobileMenuOpen(true);
      onBottomNavVisibilityChange(false);
    }
    setSelectedCategory(category as Category);
    setCurrentView('subcategory');
  };
  const handleSubcategoryClick = (subcategory: SubCategory) => {
    setSelectedSubcategory(subcategory);

    setCurrentView('items');
  };

  const handleBackClick = () => {
    if (currentView === 'items') {
      setCurrentView('subcategory');
      setSelectedSubcategory(null);
    } else if (currentView === 'subcategory') {
      setCurrentView('main');
      setSelectedCategory(null);
    }
  };

  const handleOpenMobileMenu = () => {
    setIsMobileMenuOpen(true);
    onBottomNavVisibilityChange(false);
    setBottomNavVisible(false);
  };

  const handleCloseMobileMenu = () => {
    setIsMobileMenuOpen(false);
    onBottomNavVisibilityChange(true);
    setBottomNavVisible(true);
    setCurrentView('main');
    setSelectedCategory(null);
  };

  // Add useEffect to sync bottom nav visibility
  React.useEffect(() => {
    onBottomNavVisibilityChange(!isMobileMenuOpen);
  }, [isMobileMenuOpen, onBottomNavVisibilityChange]);

  // Handle sell dialog open/close
  const handleSellDialogChange = (isOpen: boolean) => {
    setIsSellDialogOpen(isOpen);
    setBottomNavVisible(!isOpen);
    onBottomNavVisibilityChange(!isOpen);
    if (isOpen) {
      // setIsMobileMenuOpen(false);
    }
  };

  // Update the active category determination
  const activeCategory = apiCategories.find(
    (category) => category._id === (hoveredCategory || clickedCategory)
  );

  const handleProfileClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault(); // Prevent default link behavior

    // Check if user is logged in
    const token = localStorage.getItem('accessToken');
    if (token) {
      // User is logged in, navigate to profile
      navigate('/profile?tab=profile');
    } else {
      // User is not logged in, redirect to login
      navigate('/login', { state: { returnUrl: '/profile?tab=profile' } });
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 bg-[#1a1a1a] z-50">
      {/* Top Row - Logo and Actions */}
      {/* border-b border-gray-700 */}
      <div className="">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0 flex items-center">
              <img
                src="/logo.png"
                alt="EasyCasse"
                className="h-12 w-auto"
              />
            </Link>

            {/* Search Bar - Only show on desktop */}
            <div className="hidden md:block flex-1 mx-8 relative">
              <form
                onSubmit={handleSearch}
                className="relative flex items-center"
              >
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={handleDesktopSearchFocus}
                  placeholder="Rechercher un produit, une marque..."
                  className="w-full pl-4 pr-10 py-2 bg-white rounded-lg text-black placeholder-gray-500 focus:outline-none font-sans text-base"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <Search className="w-5 h-5" />
                </button>
              </form>

              {/* Desktop Search Overlay */}
              {isDesktopSearchOpen && (
                <div
                  className="fixed inset-0 bg-black bg-opacity-50 z-50 top-[65px]"
                  onClick={handleDesktopSearchClose}
                >
                  <div
                    className="max-w-7xl mx-auto px-4 pt-4 bg-white rounded md:h-[400px] md:w-[650px]"
                    onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
                  >
                    {/* Search Input */}
                    <div className="relative flex items-center mb-8">
                      <Search className="w-8 h-8 text-gray-400 hover:text-gray-600 pr-1.5" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Rechercher un produit, une marque..."
                        className="w-full pl-4 pr-10 py-3 bg-white text-black placeholder-gray-500 focus:outline-none font-sans text-base"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSearch(e as any);
                        }}
                        className="absolute right-2 bg-[#BonLoginSuccess={() => onClose()}E4A09] top-1/2 transform -translate-y-1/2 text-white p-3 rounded font-sans text-base"
                      >
                        Rechercher
                      </button>
                    </div>

                    {/* Search Content */}
                    <div className="grid grid-cols-2 gap-12 pb-10">
                      {/* Popular Searches */}
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-4 font-sans">
                          Recherches populaires
                        </h3>
                        <div className="space-y-2">
                          {categories.slice(0, 5).map((category) => (
                            <button
                              key={category.id}
                              onClick={() => {
                                setSearchQuery(category.name);
                                handleDesktopSearchClose();
                              }}
                              className="block w-full text-left px-2 py-1 text-gray-700 hover:bg-gray-100 rounded font-sans text-base"
                            >
                              {category.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Categories */}
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-4 font-sans">
                          Catégories du moment
                        </h3>
                        <div className="space-y-2">
                          {categories.slice(0, 5).map((category) => (
                            <Link
                              key={category.id}
                              to={`/category/${category.id}`}
                              onClick={handleDesktopSearchClose}
                              className="flex items-center space-x-2 px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded"
                            >
                              <img src={category.icon} alt={category.name} className="w-4 h-4" />
                              <span className="font-sans text-base">{category.name}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Navigation - Always visible */}
            <div className="flex items-center space-x-6">
              {(isAuthenticated || (hasCheckedLocalStorage && hasToken)) ? (
                <div className="flex items-center gap-3">
                  <div className="relative group">
                    <button className="flex items-center gap-2 text-white hover:text-emerald-300 transition-all duration-200 rounded-full py-1 px-2 hover:bg-gray-800/40">
                      <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-md ring-2 ring-emerald-400/30">
                        {user?.firstName?.[0]?.toUpperCase() || <User className="w-4 h-4" />}
                      </div>
                      <span className="text-sm font-medium">{user?.firstName || 'User'}</span>
                      <ChevronDown className="w-4 h-4 opacity-70 group-hover:rotate-180 transition-transform duration-200" />
                    </button>

                    {/* Enhanced Dropdown menu with animation */}
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl py-2 invisible opacity-0 transform translate-y-1 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 border border-gray-100 z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-xs text-gray-500">Signed in as</p>
                        <p className="font-medium text-gray-800">{user?.firstName || 'user@example.com'} {user?.lastName}</p>
                      </div>

                      <a
                        href="#"
                        onClick={handleProfileClick}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-emerald-600 transition-colors"
                      >
                        <User className="w-4 h-4 mr-2 text-gray-400" />
                        Profile
                      </a>

                      {/* Only show My Products link for sellers */}
                      {localStorage.getItem('userRole') === 'seller' && (
                        <Link
                          to="/profile?tab=wardrobe"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-emerald-600 transition-colors"
                        >
                          <Package className="w-4 h-4 mr-2 text-gray-400" />
                          My Products
                        </Link>

                      )}
                      {/* only show this if user is seller */}
                      {localStorage.getItem('userRole') === 'seller' && (
                        <Link
                          to="/profile?tab=seller-orders"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-emerald-600 transition-colors"
                        >
                          <Package className="w-4 h-4 mr-2 text-gray-400" />
                          Seller Orders
                        </Link>
                      )}
                       {/* only show this if user is user */}
                      {localStorage.getItem('userRole') === 'user' && (
                        <div>
                          <Link
                            to="/profile?tab=wishlist"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-emerald-600 transition-colors"
                          >
                            <Heart className="w-4 h-4 mr-2 text-gray-400" />
                            My Wishlist
                          </Link>
                          <Link
                          to="/profile?tab=orders"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-emerald-600 transition-colors"
                        >
                          <Package className="w-4 h-4 mr-2 text-gray-400" />
                          My Orders
                        </Link>
                        <Link
                          to="/profile?tab=messages"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-emerald-600 transition-colors"
                        >
                          <MessageSquare className="w-4 h-4 mr-2 text-gray-400" />
                          My Messages
                        </Link>
                        <Link
                          to="/profile?tab=addresses"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-emerald-600 transition-colors"
                        >
                          <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                          My Addresses
                        </Link>

                        </div>

                      )}

                      <div className="border-t border-gray-100 my-1"></div>
                      <button
                        onClick={() => {
                          // Handle logout with confirmation
                          if (window.confirm('Are you sure you want to log out?')) {
                            localStorage.removeItem('accessToken');
                            localStorage.removeItem('userRole');
                            window.location.reload();
                          }
                        }}
                        className="flex w-full items-center text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setIsSellDialogOpen(true)}
                    className="text-white hover:text-emerald-300 transition-colors text-sm font-medium flex items-center gap-1"
                  >
                    <Tag className="w-4 h-4" />
                    Vendre
                  </button>

                  <Link
                    to="/login"
                    className="bg-emerald-600 hover:bg-emerald-700 md:px-3 md:py-2 px-2 py-1 rounded-lg text-white transition-colors flex items-center gap-1 text-sm md:font-medium font-normal shadow-md"
                  >
                    <LogIn className="md:w-4 md:h-4 w-3 h-3" />
                    Se connecter
                  </Link>
                </div>
              )}

              <Link
                to="/profile?tab=wishlist"
                className="relative group"
              >
                <div className="bg-emerald-600/20 p-2 rounded-full hover:bg-emerald-600/30 transition-colors">
                  <Heart className="w-5 h-5 text-white group-hover:text-red-300 transition-colors" />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row - Menu and Search (Mobile) */}
      <div className="md:hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-12">
            <button
              onClick={handleOpenMobileMenu}
              className="text-white p-2"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Search Bar */}
            <div className="flex-1 mx-4">
              <form
                onSubmit={handleSearch}
                className="relative flex items-center"
              >
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={handleMobileSearchFocus}
                  placeholder="Rechercher un produit, une marque..."
                  className="w-full pl-4 pr-10 py-1.5 bg-white rounded-lg text-black placeholder-gray-500 focus:outline-none text-sm"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <Search className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-[#1a1a1a] border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-20 overflow-x-auto relative">
            {categoriesLoading ? (
              // Loading state
              <div className="text-white opacity-75">Loading categories...</div>
            ) : categoriesError ? (
              // Enhanced error state
              <div className="flex items-center justify-center w-full py-3">
                <div className="bg-red-500/10 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-3 border border-red-500/20 shadow-sm max-w-fit">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <span className="text-red-400 font-medium text-sm">{categoriesError}</span>
                  <button 
                    onClick={fetchCategories} 
                    className="ml-2 flex-shrink-0 text-white bg-red-500 hover:bg-red-600 transition-colors rounded-md px-3 py-1 text-xs font-medium"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : (
              // Render API categories
              apiCategories.map((category) => (
                <div
                  key={category._id}
                  className="relative mega-menu-container"
                  onClick={() => {
                    if (clickedCategory === category._id) {
                      setClickedCategory(null);
                    } else {
                      setClickedCategory(category._id);
                    }
                    setShowViewAll(false);
                  }}
                >
                  <button
                    onClick={() => handleCategoryClick({
                      id: category._id,
                      name: category.name,
                      icon: formatImageUrl(category.imageUrl),
                      subcategories: []
                    })}
                    className={clsx(
                      "flex flex-row items-center text-white hover:text-gray-300 transition-colors px-2 min-w-[60px] group gap-2 py-2 pr-6 pl-6"
                    )}
                  >
                    <img
                      src={formatImageUrl(category.imageUrl)}
                      alt={category.name}
                      width={45}
                      height={45}
                      className="w-6 h-6 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/default-category-icon.png';
                      }}
                    />
                    <span className="text-[11px] whitespace-nowrap">{category.name}</span>
                  </button>
                  <span
                    className={clsx(
                      "absolute bottom-0 left-0 w-full h-0.5 transform transition-all duration-200 z-50 top-[50px]",
                      clickedCategory === category._id
                        ? "bg-white scale-x-100"
                        : "bg-white scale-x-0 group-hover:scale-x-100"
                    )}
                  />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Regular Mega Menu - Only show on desktop */}
        {(hoveredCategory || clickedCategory) && !showViewAll && !isMobileView && (
          <div
            className=" absolute left-0 right-0 top-[170px] z-50 max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100"
            style={{
              width: '100vw',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'transparent',
              WebkitOverflowScrolling: 'touch'
            }}
            onMouseEnter={() => setHoveredCategory(hoveredCategory)}
            onMouseLeave={() => {
              if (!clickedCategory) {
                setHoveredCategory(null);
                setHoveredSubcategory(null);
              }
            }}
          >
            <div className="max-w-7xl mx-auto px-0">
              <div className="bg-white rounded-lg shadow-lg px-6 pb-10">
                {/* Category Title */}
                <div className="p-4 ">
                  <div className="flex items-center gap-3">
                    <img
                      src={formatImageUrl(activeCategory?.imageUrl)}
                      alt={activeCategory?.name}
                      width={45}
                      height={45}
                      className="w-6 h-6 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/default-category-icon.png';
                      }}
                    />
                    <h2 className="text-lg font-semibold text-black">{activeCategory?.name}</h2>
                  </div>
                </div>

                <div className="flex">
                  {/* Main Content Area - 75% width */}
                  <div className="w-3/4 p-6">
                    <div className="grid grid-cols-3 gap-8 ">
                      {/* First Row */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <img src="/Skis_alpins_1__3_.png" alt="Level" className="w-[60px] h-[60px] bg-[#f7f7f7] p-2 rounded" />
                          <h3 className="text-lg font-semibold text-[#BE4A09]">Pack ski + fix par niveau</h3>
                        </div>
                        <div className="space-y-3">
                          <Link to="" className="block text-sm text-gray-600 hover:text-[#BE4A09]">Pack skis + fixations débutant</Link>
                          <Link to="" className="block text-sm text-gray-600 hover:text-[#BE4A09]">Pack skis + fixations intermédiaire</Link>
                          <Link to="" className="block text-sm text-gray-600 hover:text-[#BE4A09]">Pack skis + fixations confirmé</Link>
                          <Link to="" className="block text-sm text-[#BE4A09] font-medium">Voir tous les skis alpins</Link>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <img src="/Skis_alpins_1__4_.png" alt="Genre" className="w-[60px] h-[60px] bg-[#f7f7f7] p-2 rounded" />
                          <h3 className="text-lg font-semibold text-[#BE4A09]">Pack ski + fix par genre</h3>
                        </div>
                        <div className="space-y-3">
                          <Link to="" className="block text-sm text-gray-600 hover:text-[#BE4A09]">Pack skis + fixations homme</Link>
                          <Link to="" className="block text-sm text-gray-600 hover:text-[#BE4A09]">Pack skis + fixations femme</Link>
                          <Link to="" className="block text-sm text-gray-600 hover:text-[#BE4A09]">Pack skis + fixations enfant</Link>
                          <Link to="" className="block text-sm text-[#BE4A09] font-medium">Voir tous les skis alpins</Link>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <img src="/Skis_de_rando_1.png" alt="Marque" className="w-[60px] h-[60px] bg-[#f7f7f7] p-2 rounded" />
                          <h3 className="text-lg font-semibold text-[#BE4A09]">Pack ski + fix par marque</h3>
                        </div>
                        <div className="space-y-3">
                          <Link to="" className="block text-sm text-gray-600 hover:text-[#BE4A09]">Pack skis + fixations Rossignol</Link>
                          <Link to="" className="block text-sm text-gray-600 hover:text-[#BE4A09]">Pack skis + fixations Dynastar</Link>
                          <Link to="" className="block text-sm text-gray-600 hover:text-[#BE4A09]">Pack skis + fixations Atomic</Link>
                          <Link to="" className="block text-sm text-[#BE4A09] font-medium">Voir tous les skis alpins</Link>
                        </div>
                      </div>

                      {/* Second Row */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <img src="/Chaussures_de_ski_alpin_1.png" alt="Chaussures" className="w-[60px] h-[60px] bg-[#f7f7f7] p-2 rounded" />
                          <h3 className="text-lg font-semibold text-[#BE4A09]">Chaussures de ski</h3>
                        </div>
                        <div className="space-y-3">
                          <Link to="" className="block text-sm text-gray-600 hover:text-[#BE4A09]">Chaussures homme</Link>
                          <Link to="" className="block text-sm text-gray-600 hover:text-[#BE4A09]">Chaussures femme</Link>
                          <Link to="" className="block text-sm text-gray-600 hover:text-[#BE4A09]">Chaussures enfant</Link>
                          <Link to="" className="block text-sm text-[#BE4A09] font-medium">Voir toutes les chaussures</Link>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <img src="/Masque_de_ski_1__1_.png" alt="Accessoires" className="w-[60px] h-[60px] bg-[#f7f7f7] p-2 rounded" />
                          <h3 className="text-lg font-semibold text-[#BE4A09]">Accessoires de ski</h3>
                        </div>
                        <div className="space-y-3">
                          <Link to="" className="block text-sm text-gray-600 hover:text-[#BE4A09]">Fixation de ski</Link>
                          <Link to="" className="block text-sm text-gray-600 hover:text-[#BE4A09]">Bâtons de ski</Link>
                          <Link to="" className="block text-sm text-gray-600 hover:text-[#BE4A09]">Housse de ski</Link>
                          <Link to="" className="block text-sm text-gray-600 hover:text-[#BE4A09]">Casque et protection</Link>
                          <Link to="" className="block text-sm text-gray-600 hover:text-[#BE4A09]">Masque de ski</Link>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <img src="/Vestes_de_ski_1.png" alt="Vêtements" className="w-[65px] h-[60px] bg-[#f7f7f7] p-2 rounded" />
                          <h3 className="text-lg font-semibold text-[#BE4A09]">Vêtements de ski</h3>
                        </div>
                        <div className="space-y-3">
                          <Link to="" className="block text-sm text-gray-600 hover:text-[#BE4A09]">Veste de ski</Link>
                          <Link to="" className="block text-sm text-gray-600 hover:text-[#BE4A09]">Pantalon de ski</Link>
                          <Link to="" className="block text-sm text-gray-600 hover:text-[#BE4A09]">Gants de ski</Link>
                          <Link to="" className="block text-sm text-gray-600 hover:text-[#BE4A09]">Autres vêtements</Link>
                          <Link to="" className="block text-sm text-[#BE4A09] font-medium">Voir tous les vêtements</Link>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Featured Panel - 25% width */}
                  <div className="w-1/4 p-4">
                    <div
                      className="bg-[#f9efe9] rounded-lg flex flex-col items-center justify-center text-center"
                      style={{ width: '280px', height: '238px' }}
                    >
                      <div className="space-y-4">
                        <div className="w-16 h-16 mx-auto">
                          <img src="/question.png" alt="Find your perfect match" className="w-full h-full" />
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">5 secondes pour</p>
                          <p className="text-lg font-semibold text-gray-900">TROUVER MES SKIS</p>
                          <button className="bg-[#BE4A09] text-white px-6 py-2 rounded-lg hover:bg-[#A43F08] transition-colors">
                            Faire le test
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>


                </div>
                {/* Bottom header */}
                <div className="">
                  <div className="max-w-7xl mx-auto ">
                    <div className="bg-[#f7f7f7] px-4 py-4">
                      <div className="flex justify-between items-center py-4 px-8">
                        {/* Return Policy */}
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsReturnPolicyOpen(true)}>
                          <svg
                            className="w-5 h-5 text-[#BE4A09]"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M9 14L4 9L9 4" />
                            <path d="M20 20v-7a4 4 0 00-4-4H4" />
                          </svg>
                          <span className="text-sm">
                            Retour gratuit sous <span className="font-semibold">30 jours</span>
                          </span>
                        </div>

                        {/* Payment Options */}
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-5 h-5 text-[#BE4A09]"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <rect x="2" y="5" width="20" height="14" rx="2" />
                            <path d="M2 10h20" />
                          </svg>
                          <span className="text-sm">
                            Payez en <span className="font-semibold">3x, 4x ou 10x</span> sans frais
                          </span>
                        </div>

                        {/* Customer Service */}
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-5 h-5 text-[#BE4A09]"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
                            <path d="M12 17h.01" />
                          </svg>
                          <span className="text-sm">
                            Service client <span className="font-semibold">réactif</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}




      </div>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-[60] bg-black bg-opacity-50 transition-opacity duration-300 ${isMobileMenuOpen ? 'block' : 'hidden'
          }`}
        onClick={handleCloseMobileMenu}
      >
        <div
          className={`fixed inset-x-3 z-[60] top-3 bottom-3 right-3 left-3 flex items-end justify-center transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-y-0' : 'translate-y-full'
            }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white shadow-lg w-full h-full transition-all duration-300 overflow-hidden">
            {/* Main Categories View */}
            <div className={`absolute inset-0 transition-transform duration-300 ${currentView === 'main' ? 'translate-x-0' : '-translate-x-full'}`}>
              <div className="sticky top-0 mx-4 my-6  px-4 py-4 flex justify-between items-center">
                <h2 className="text-gray-800 font-semibold text-lg">All Categories</h2>
                <button
                  className="text-gray-800 p-2 text-[20px]"
                  onClick={handleCloseMobileMenu}
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4 overflow-y-auto h-full pb-20  pl-6 pr-2">
                {apiCategories.map((category) => (
                  <button
                    key={category._id}
                    className="flex items-center justify-between w-full py-3 px-4 text-gray-700 "
                    onClick={() => handleCategoryClick({
                      id: category._id,
                      name: category.name,
                      icon: formatImageUrl(category.imageUrl),
                      subcategories: []
                    })}
                  >
                    <div className="flex items-center space-x-3">
                      <img src={formatImageUrl(category.imageUrl)} alt={category.name} className="h-6 w-6" />
                      <span>{category.name}</span>
                    </div>
                    <ChevronRight className="h-5 w-5" />
                  </button>
                ))}
              </div>
            </div>

            {/* Subcategories View */}
            <div className={`absolute inset-0 transition-transform duration-300 ${currentView === 'subcategory' ? 'translate-x-0' : currentView === 'main' ? 'translate-x-full' : '-translate-x-full'
              }`}>
              <div className="sticky top-0 mx-4 my-6 px-4 py-4 flex justify-between items-center">
                <button
                  className="text-gray-800 flex items-center gap-0"
                  onClick={handleBackClick}
                >
                  <ChevronLeft className="h-6 w-6" />
                  <h2 className="text-gray-800 font-semibold text-lg ml-2">
                    {selectedCategory?.name}
                  </h2>
                </button>
              </div>
              <div className="space-y-4 overflow-y-auto h-full pb-20  pl-6 pr-2">
                {selectedCategory?.subcategories.map((subcategory) => (
                  <button
                    key={subcategory.name}
                    className="flex items-center justify-between w-full py-3 px-4 text-gray-700"
                    onClick={() => handleSubcategoryClick(subcategory)}
                  >
                    <span>{subcategory.name}</span>
                    <ChevronRight className="h-5 w-5" />
                  </button>
                ))}
              </div>
            </div>

            {/* Items View */}
            <div className={`absolute inset-0 transition-transform duration-300 ${currentView === 'items' ? 'translate-x-0' : 'translate-x-full'
              }`}>
              <div className="sticky top-0 mx-4 my-6 px-4 py-4 flex items-center">
                <button
                  className="text-gray-800 flex items-center gap-0"
                  onClick={handleBackClick}
                >
                  <ChevronLeft className="h-6 w-6" />
                  <h2 className="text-gray-800 font-semibold text-lg pl-2">
                    {selectedSubcategory?.name}
                  </h2>
                </button>
              </div>
              <div className="space-y-4 overflow-y-auto h-full pb-20 pl-8 pr-2">
                {selectedSubcategory?.items.map((item) => (
                  <Link
                    key={item}
                    to={`/category/${selectedCategory?.id}/${selectedSubcategory?.name}/${item}`}
                    className="flex items-center justify-between w-full py-3 px-4 text-gray-700"
                    onClick={handleCloseMobileMenu}
                  >
                    <span>{item}</span>
                    {/* <ChevronRight className="h-5 w-5" /> */}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add the SellDialog component */}
      <SellDialog
        isOpen={isSellDialogOpen}
        onClose={() => handleSellDialogChange(false)}
        onOpenChange={handleSellDialogChange}
      />

      {/* end */}

    </div>

  );
};

export default Navbar;