import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout, setCredentials } from "../store/slices/authSlice";
import { RootState } from "../store/store";

import { Search, ChevronRight, ChevronLeft, User, ShoppingBag, Menu, Home, MessageSquare, Plus, LogOut, LogIn, Tag, ChevronDown, Package, Heart, MapPin, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import clsx from 'clsx';
import SellDialog from './SellDialog';
import LangSwitcher from './LangSwitcher';
import { div } from "framer-motion/client";
import { API_URL } from "../config";

interface SubCategory {
  name: string;
  items: string[];
  _id?: string;
  subcategories?: ApiCategory[];
}

interface Category {
  id: string;
  name: string;
  icon: string;
  subcategories: SubCategory[];
  parentId?: string;
  _id?: string;
  imageUrl?: string;
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
      
      // Log full structure of the first category to help debug
      if (data.length > 0) {
        console.log('First category sample:', JSON.stringify(data[0]).slice(0, 500) + '...');
      }
      
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

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const userRole = localStorage.getItem('userRole');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    console.log("User from localStorage:", user);

    console.log("Checking auth status:", { token, userRole });

    if (token) {
      setHasToken(true);
      if (!isAuthenticated) {
        console.log("User has token but isn't authenticated in Redux state");
        const storedUserData = localStorage.getItem('user');
        if (storedUserData) {
          try {
            const userData = JSON.parse(storedUserData);
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
  }, [isAuthenticated]); 


  useEffect(() => {
    if (isAuthenticated && isCheckingAuth) {
      setIsCheckingAuth(false);
    }
  }, [isAuthenticated]);

  const formatImageUrl = (imageUrl: string | undefined | null): string => {
   
    if (!imageUrl || imageUrl.trim() === '') {
      return 'https://via.placeholder.com/64';
    }

    
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }

    
    if (!imageUrl.startsWith('/')) {
      imageUrl = '/' + imageUrl;
    }

   
    return `${API_URL}${imageUrl}`;
  };

  React.useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setIsMobileView(isMobile);
      // Sync mobile menu state with parent
      if (!isMobile && isMobileMenuOpen) {
        handleCloseMobileMenu();
      }
    };

    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileMenuOpen]); 

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

  const handleCategoryClick = (category: Partial<Category> | ApiCategory) => {
    if (isMobileView) {
      setIsMobileMenuOpen(true);
      onBottomNavVisibilityChange(false);
    }
    
    console.log("Category clicked:", category.name);
    
    // First, make sure we set clickedCategory regardless of type
    // This ensures the desktop mega menu and mobile menu use the same data source
    if ('_id' in category && category._id) {
      setClickedCategory(category._id);
    } else if ('id' in category && category.id) {
      setClickedCategory(category.id);
    }
    
    // If it's an ApiCategory with subcategories, use those directly
    if ('_id' in category && category._id) {
      const apiCategory = category as ApiCategory;
      console.log("Selected category:", apiCategory.name, "with subcategories:", apiCategory.subcategories?.length);
      
      // Attempt to get a complete category with subcategories from the API data
      const completeCategory = apiCategories.find(cat => cat._id === apiCategory._id);
      
      // Create a proper Category object
      const fullCategory = {
        id: apiCategory._id,
        name: apiCategory.name,
        icon: formatImageUrl(apiCategory.imageUrl),
        _id: apiCategory._id, 
        imageUrl: apiCategory.imageUrl,
        parentId: apiCategory.parentId,
        subcategories: [] 
      } as Category;
      
      // Add subcategories from the complete category if available, or from the provided category
      if (completeCategory && completeCategory.subcategories && completeCategory.subcategories.length > 0) {
        console.log("Using complete category data with", completeCategory.subcategories.length, "subcategories");
        fullCategory.subcategories = completeCategory.subcategories.map(sub => ({
          name: sub.name,
          _id: sub._id,
          items: (sub.subcategories || []).map(item => item.name)
        }));
      } else if (apiCategory.subcategories && apiCategory.subcategories.length > 0) {
        console.log("Using provided category data with", apiCategory.subcategories.length, "subcategories");
        fullCategory.subcategories = apiCategory.subcategories.map(sub => ({
          name: sub.name,
          _id: sub._id,
          items: (sub.subcategories || []).map(item => item.name)
        }));
      }
      
      setSelectedCategory(fullCategory);
    } else {
      // Otherwise use the existing behavior
      setSelectedCategory(category as Category);
    }
    setCurrentView('subcategory');
  };
  const handleSubcategoryClick = (subcategory: SubCategory | ApiCategory) => {
    console.log("Clicked subcategory:", subcategory.name);
    
    // Check if it's an ApiCategory with subcategories
    if ('_id' in subcategory && subcategory._id) {
      // It's an ApiCategory
      const apiSubcategory = subcategory as ApiCategory;
      console.log("API subcategory:", apiSubcategory.name, "with subcategories:", apiSubcategory.subcategories?.length);
      
      // Check if this subcategory has its own subcategories
      if (apiSubcategory.subcategories && apiSubcategory.subcategories.length > 0) {
        console.log("Has subcategories, creating new category view");
        // If it has subcategories, update the selected category to be this subcategory
        // so we can navigate down the hierarchy
        const newCategory: Category = {
          id: apiSubcategory._id,
          name: apiSubcategory.name,
          _id: apiSubcategory._id,
          icon: formatImageUrl(apiSubcategory.imageUrl),
          // Store the current category ID as parentId to track our navigation path
          parentId: selectedCategory?.id || apiSubcategory.parentId,
          subcategories: (apiSubcategory.subcategories || []).map(sub => ({
            name: sub.name,
            _id: sub._id,
            items: (sub.subcategories || []).map(item => item.name)
          }))
        };
        
        setSelectedCategory(newCategory);
        // Also update clicked category to ensure the right subcategories are shown
        setClickedCategory(apiSubcategory._id);
        // Stay in the subcategory view, but now showing the subcategories of this category
        setCurrentView('subcategory');
      } else {
        console.log("No subcategories, navigating to product list for this category");
        handleCloseMobileMenu();
        
        // Use parent category ID if available for better breadcrumb
        const parentCategoryId = selectedCategory?.id || selectedCategory?._id || apiSubcategory.parentId;
        
        if (isMobileView) {
          // For mobile, use navigate to ensure smooth transition
          navigate(`/category/${apiSubcategory._id}`);
        } else {
          // For desktop, just change window location to force a full page reload (this helps reset any state)
          window.location.href = `/category/${apiSubcategory._id}`;
        }
      }
    } else {
      console.log("Regular subcategory");
      // Check if this is a SubCategory with items
      const subCat = subcategory as Partial<SubCategory>;
      if (subCat.items && subCat.items.length > 0) {
        setSelectedSubcategory(subcategory as SubCategory);
        setCurrentView('items');
      } else {
        // If no items, navigate to product list
        console.log("No subcategory items, navigating to product list");
        handleCloseMobileMenu();
        
        // Construct the URL with the ID if available
        const categoryId = selectedCategory?.id || selectedCategory?._id;
        const subcategoryId = subcategory._id;
        
        if (categoryId && subcategoryId) {
          navigate(`/category/${categoryId}/${subcategoryId}`);
        } else if (subcategoryId) {
          navigate(`/category/${subcategoryId}`);
        } else if (categoryId) {
          navigate(`/category/${categoryId}`);
        } else {
          // Fallback to products page
          navigate('/products');
        }
      }
    }
  };

  const handleBackClick = () => {
    console.log("Back button clicked, current view:", currentView);
    console.log("Selected category:", selectedCategory?.name);
    console.log("Selected subcategory:", selectedSubcategory?.name);
    
    if (currentView === 'items') {
      console.log("Going back from items to subcategory view");
      setCurrentView('subcategory');
      setSelectedSubcategory(null);
    } else if (currentView === 'subcategory') {
      // If we're in a nested subcategory view, we need to check if we should go back to the parent category
      if (selectedCategory && selectedCategory.parentId) {
        console.log("Moving back to parent category with ID:", selectedCategory.parentId);
        // Find the parent category
        const parentCategory = apiCategories.find(cat => cat._id === selectedCategory.parentId);
        if (parentCategory) {
          console.log("Found parent category:", parentCategory.name);
          // Clear clicked category to ensure proper state reset
          setClickedCategory(parentCategory._id); // Set to parent ID instead of null
          // Navigate to the parent category
          handleCategoryClick(parentCategory);
        } else {
          console.log("Parent category not found, going back to main view");
          setCurrentView('main');
          setSelectedCategory(null);
          setClickedCategory(null);
        }
      } else {
        console.log("No parent category, going back to main view");
        setCurrentView('main');
        setSelectedCategory(null);
        // Don't reset clicked category when returning to main view
        // This allows the same category to be clicked again with proper state
        // setClickedCategory(null);
      }
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
    // Keep clickedCategory state to preserve desktop menu state
    // setClickedCategory(null);
  };

 
  React.useEffect(() => {
    onBottomNavVisibilityChange(!isMobileMenuOpen);
  }, [isMobileMenuOpen, onBottomNavVisibilityChange]);

  
  const handleSellDialogChange = (isOpen: boolean) => {
    setIsSellDialogOpen(isOpen);
    setBottomNavVisible(!isOpen);
    onBottomNavVisibilityChange(!isOpen);
    if (isOpen) {
     
    }
  };

  
  const activeCategory = apiCategories.find(
    (category) => category._id === (hoveredCategory || clickedCategory)
  );

  const handleProfileTabNavigation = (tab: string) => {
    // Navigate to the profile page with the specified tab and force a page reload
    window.location.href = `/profile?tab=${tab}`;
  };

  // Add a useEffect to monitor category changes and make sure data is properly loaded
  React.useEffect(() => {
    // When a category is clicked, make sure the clickedCategory state is updated
    // This is important for the mobile view to properly display subcategories
    if (selectedCategory && '_id' in selectedCategory && selectedCategory._id) {
      console.log("Setting clicked category from selected:", selectedCategory._id);
      setClickedCategory(selectedCategory._id);
    }
  }, [selectedCategory]);

  // Add an effect to re-fetch categories when mobile menu opens
  React.useEffect(() => {
    if (isMobileMenuOpen && apiCategories.length === 0) {
      console.log("Mobile menu opened, fetching categories");
      fetchCategories();
    }
    
    // This is crucial: When mobile menu opens, sync the current states
    // If a category was selected in desktop view, we need to use that same data
    if (isMobileMenuOpen && clickedCategory) {
      console.log("Mobile menu opened with clicked category:", clickedCategory);
      // Find the category in the API categories
      const category = apiCategories.find(cat => cat._id === clickedCategory);
      if (category && currentView === 'main') {
        console.log("Found category, setting for mobile view:", category.name);
        // Simulate clicking the category to set all the necessary state
        handleCategoryClick(category);
      }
    }
  }, [isMobileMenuOpen, apiCategories.length, clickedCategory]);

  // Add this helper function before the render function
  const subcategoryHasItems = (subcategory: SubCategory | ApiCategory): boolean => {
    if ('items' in subcategory && Array.isArray(subcategory.items)) {
      return subcategory.items.length > 0;
    }
    return false;
  };

  return (
    <div className="fixed top-0 left-0 right-0 bg-[#1a1a1a] z-50">
      {/* Top Row - Logo and Actions */}
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
                        Popular searches
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
                        Current categories
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
              {/* Add Language Switcher */}
              <LangSwitcher className="hidden md:block" />
              
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
                        onClick={() => handleProfileTabNavigation("profile")}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-emerald-600 transition-colors"
                      >
                        <User className="w-4 h-4 mr-2 text-gray-400" />
                        Profile
                      </a>

                      {/* Only show My Products link for sellers */}
                      {localStorage.getItem('userRole') === 'seller' && (
                        <div>
                          <button
                            onClick={() => handleProfileTabNavigation("wardrobe")}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-emerald-600 transition-colors text-left"
                          >
                            <Package className="w-4 h-4 mr-2 text-gray-400" />
                            My Products
                          </button>
                          <button
                            onClick={() => handleProfileTabNavigation("messages")}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-emerald-600 transition-colors text-left"
                          >
                            <MessageSquare className="w-4 h-4 mr-2 text-gray-400" />
                            My Messages
                          </button>
                        </div>
                      )}
                      
                      {/* only show this if user is seller */}
                      {localStorage.getItem('userRole') === 'seller' && (
                        <button
                          onClick={() => handleProfileTabNavigation("seller-orders")}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-emerald-600 transition-colors text-left"
                        >
                          <Package className="w-4 h-4 mr-2 text-gray-400" />
                          Seller Orders
                        </button>
                      )}
                       {/* only show this if user is user */}
                      {localStorage.getItem('userRole') === 'user' && (
                        <div>
                          <button
                            onClick={() => handleProfileTabNavigation("wishlist")}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-emerald-600 transition-colors text-left"
                          >
                            <Heart className="w-4 h-4 mr-2 text-gray-400" />
                            My Wishlist
                          </button>
                          <button
                            onClick={() => handleProfileTabNavigation("reviews")}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-emerald-600 transition-colors text-left"
                          >
                            <Star className="w-4 h-4 mr-2 text-gray-400" />
                            My Reviews
                          </button>
                          <button
                            onClick={() => handleProfileTabNavigation("orders")}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-emerald-600 transition-colors text-left"
                          >
                            <Package className="w-4 h-4 mr-2 text-gray-400" />
                            My Orders
                          </button>
                          <button
                            onClick={() => handleProfileTabNavigation("messages")}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-emerald-600 transition-colors text-left"
                          >
                            <MessageSquare className="w-4 h-4 mr-2 text-gray-400" />
                            My Messages
                          </button>
                          <button
                            onClick={() => handleProfileTabNavigation("addresses")}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-emerald-600 transition-colors text-left"
                          >
                            <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                            My Addresses
                          </button>
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

              <button
                onClick={() => handleProfileTabNavigation("wishlist")}
                className="relative group"
              >
                <div className="bg-emerald-600/20 p-2 rounded-full hover:bg-emerald-600/30 transition-colors">
                  <Heart className="w-5 h-5 text-white group-hover:text-red-300 transition-colors" />
                </div>
              </button>
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
            
            {/* Add Language Switcher to mobile view */}
            <LangSwitcher className="md:hidden" />
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
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent event bubbling
                    if (clickedCategory === category._id) {
                      setClickedCategory(null);
                    } else {
                      setClickedCategory(category._id);
                      // If we're in mobile view, also handle category click
                      if (isMobileView) {
                        handleCategoryClick(category);
                      }
                    }
                    setShowViewAll(false);
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent bubbling to parent div
                      handleCategoryClick(category);
                    }}
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
            className="absolute left-0 right-0 top-[170px] z-50 max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100"
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
                <div className="p-4">
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
                    <div className="grid grid-cols-3 gap-8">
                      {/* Dynamically render subcategories */}
                      {activeCategory?.subcategories && activeCategory.subcategories.length > 0 ? (
                        activeCategory.subcategories.map((subcategory, index) => (
                          <div key={subcategory._id || index} className="space-y-4">
                            <div 
                              className="flex items-center gap-3 cursor-pointer hover:text-[#BE4A09] transition-colors"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if(subcategory._id) {
                                  console.log("Navigating to category:", subcategory._id);
                                  // Force a complete page reload to reset all state
                                  window.location.href = `/category/${subcategory._id}`;
                                  // Add a small delay to ensure navigation happens
                                  setTimeout(() => {
                                    if(window.location.pathname !== `/category/${subcategory._id}`) {
                                      console.log("Navigation failed, retrying");
                                      window.location.replace(`/category/${subcategory._id}`);
                                    }
                                  }, 100);
                                }
                              }}
                            >
                              <img 
                                src={formatImageUrl(subcategory.imageUrl)} 
                                alt={subcategory.name} 
                                className="w-[60px] h-[60px] bg-[#f7f7f7] p-2 rounded" 
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/default-category-icon.png';
                                }}
                              />
                              <h3 className="text-lg font-semibold text-[#BE4A09]">{subcategory.name}</h3>
                            </div>
                            <div className="space-y-3">
                              {/* Render third-level items (if any) */}
                              {subcategory.subcategories && subcategory.subcategories.length > 0 ? (
                                subcategory.subcategories.map((item, idx) => (
                                  <a
                                    key={item._id || idx}
                                    href={`/category/${item._id}`}
                                    className="block text-sm text-gray-600 hover:text-[#BE4A09]"
                                    onClick={(e) => {
                                      
                                      e.preventDefault();
                                      console.log("Navigating to subcategory item:", item._id);
                                      window.location.href = `/category/${item._id}`;
                                      setHoveredCategory(null); // Close megamenu
                                    }}
                                  >
                                    {item.name}
                                  </a>
                                ))
                              ) : subcategoryHasItems(subcategory) ? (
                                // Display items if no subcategories but has items array
                                (() => {
                                  // Use a narrowed type after checking
                                  const subcatWithItems = subcategory as unknown as { items: string[] };
                                  return subcatWithItems.items.map((item, idx) => (
                                    <a
                                      key={idx}
                                      href={`/category/${item}`}
                                      className="block text-sm text-gray-600 hover:text-[#BE4A09]"
                                      onClick={(e) => {
                                        // Only use preventDefault if we're going to handle navigation manually
                                        e.preventDefault();
                                        console.log("Navigating to subcategory item:", item);
                                        window.location.href = `/category/${item}`;
                                        setHoveredCategory(null); // Close megamenu
                                      }}
                                    >
                                      {item}
                                    </a>
                                  ));
                                })()
                              ) : (
                                <div className="text-sm text-gray-500 italic">No subcategories available</div>
                              )}
                              
                              {/* View all link */}
                              {(subcategory.subcategories && subcategory.subcategories.length > 0 || 
                                subcategoryHasItems(subcategory)) && (
                                <Link 
                                  to={`/category/${subcategory._id}`} 
                                  className="block text-sm text-[#BE4A09] font-medium"
                                  onClick={() => {
                                    // Close megamenu after navigation
                                    setHoveredCategory(null);
                                  }}
                                >
                                  View all {subcategory.name}
                                </Link>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-3 text-center py-6">
                          <div className="text-gray-500">No subcategories available for this category</div>
                        </div>
                      )}
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
                          <p className="text-lg font-semibold text-gray-900">TROUVER MES PRODUITS</p>
                          <button className="bg-[#BE4A09] text-white px-6 py-2 rounded-lg hover:bg-[#A43F08] transition-colors">
                            Faire le test
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom header with shipping info, etc. */}
                <div className="">
                  <div className="max-w-7xl mx-auto">
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
                            <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
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
                  <div className="ml-2">
                    <h2 className="text-gray-800 font-semibold text-lg">
                    {selectedCategory?.name}
                  </h2>
                  </div>
                </button>
              </div>
              <div className="space-y-4 overflow-y-auto h-full pb-20 pl-6 pr-2">
                {/* Use the activeCategory data since it's successfully showing subcategories in desktop view */}
                {(() => {
                  console.log("Mobile menu subcategories view. Active category:", activeCategory?.name);
                  console.log("Selected category:", selectedCategory?.name, "with ID:", selectedCategory?._id || selectedCategory?.id);
                  console.log("Clicked category:", clickedCategory);
                  
                  // Get subcategories using all available sources
                  let subcategoriesToDisplay: any[] = [];
                  let debugSource = "none";
                  
                  // First try activeCategory (working in desktop view)
                  if (activeCategory && activeCategory.subcategories && activeCategory.subcategories.length > 0) {
                    console.log("Found subcategories in activeCategory:", activeCategory.subcategories.length);
                    subcategoriesToDisplay = activeCategory.subcategories;
                    debugSource = "activeCategory";
                  }
                  
                  // If that didn't work, try finding by selected category's ID
                  else if (selectedCategory && (selectedCategory._id || selectedCategory.id)) {
                    const categoryId = selectedCategory._id || selectedCategory.id;
                    const fullCategory = apiCategories.find(cat => cat._id === categoryId);
                    
                    if (fullCategory && fullCategory.subcategories && fullCategory.subcategories.length > 0) {
                      console.log("Found subcategories by category ID lookup:", fullCategory.subcategories.length);
                      subcategoriesToDisplay = fullCategory.subcategories;
                      debugSource = "categoryIdLookup";
                    }
                  }
                  
                  // If still no subcategories, try clicked category
                  if (subcategoriesToDisplay.length === 0 && clickedCategory) {
                    const clickedCat = apiCategories.find(cat => cat._id === clickedCategory);
                    if (clickedCat && clickedCat.subcategories && clickedCat.subcategories.length > 0) {
                      console.log("Found subcategories by clicked category lookup:", clickedCat.subcategories.length);
                      subcategoriesToDisplay = clickedCat.subcategories;
                      debugSource = "clickedCategoryLookup";
                    }
                  }
                  
                  // Last resort: check selected category's subcategories directly
                  if (subcategoriesToDisplay.length === 0 && selectedCategory && selectedCategory.subcategories && selectedCategory.subcategories.length > 0) {
                    console.log("Using subcategories directly from selectedCategory:", selectedCategory.subcategories.length);
                    subcategoriesToDisplay = selectedCategory.subcategories;
                    debugSource = "selectedCategoryDirect";
                  }
                  
                  console.log(`Using subcategories from ${debugSource} source with ${subcategoriesToDisplay.length} items`);
                  
                  // Return the subcategory buttons if we have them
                  if (subcategoriesToDisplay.length > 0) {
                    return subcategoriesToDisplay.map((subcategory) => (
                    <button
                        key={subcategory._id || subcategory.name}
                      className="flex items-center justify-between w-full py-3 px-4 text-gray-700"
                      onClick={() => handleSubcategoryClick(subcategory)}
                    >
                      <span>{subcategory.name}</span>
                        {(subcategory.subcategories && subcategory.subcategories.length > 0) || 
                         (subcategory._id && subcategory.items && subcategory.items.length > 0) ? (
                      <ChevronRight className="h-5 w-5" />
                        ) : null}
                    </button>
                    ));
                  }
                  
                  // Show a message if no subcategories found
                  return (
                    <div className="flex flex-col items-center justify-center h-48 text-center">
                      <div className="text-gray-400 mb-2">
                        <Package className="h-10 w-10 mx-auto" />
                      </div>
                      <p className="text-gray-600">No subcategories found</p>
                      <div className="text-xs text-gray-400 mt-1 mb-3 max-w-[250px]">
                        Debug info: activeCategory={activeCategory?.name || "none"}, 
                        selectedCategory={selectedCategory?.name || "none"},
                        clickedCategory={clickedCategory || "none"}
                      </div>
                      <button 
                        onClick={handleBackClick}
                        className="mt-1 px-4 py-2 text-sm bg-gray-100 rounded-md text-gray-600 hover:bg-gray-200"
                      >
                        Go Back
                      </button>
                    </div>
                  );
                })()}
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
                {/* Find the selected subcategory in the API data */}
                {(() => {
                  console.log("Rendering items view for subcategory:", selectedSubcategory?.name);
                  if (activeCategory && activeCategory.subcategories) {
                    let subcategoryFromApi = activeCategory.subcategories.find(
                      sub => sub.name === selectedSubcategory?.name || sub._id === selectedSubcategory?._id
                    );
                    
                    if (subcategoryFromApi && subcategoryFromApi.subcategories && subcategoryFromApi.subcategories.length > 0) {
                      console.log("Found in active category with", subcategoryFromApi.subcategories.length, "items");
                      return subcategoryFromApi.subcategories.map((item) => (
                        <a
                          key={item._id || item.name}
                          href={`/category/${item._id}`}
                          className="flex items-center justify-between w-full py-3 px-4 text-gray-700"
                          onClick={(e) => {
                            // Only use preventDefault if we're going to handle navigation manually
                            e.preventDefault();
                            console.log("Navigating to subcategory item:", item._id);
                            window.location.href = `/category/${item._id}`;
                            setHoveredCategory(null); // Close megamenu
                          }}
                        >
                          <span>{item.name}</span>
                          <ChevronRight className="h-5 w-5" />
                        </a>
                      ));
                    }
                    
                    // If no subcategories for this level, add a button to view products
                    if (subcategoryFromApi && (!subcategoryFromApi.subcategories || subcategoryFromApi.subcategories.length === 0)) {
                      return (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                          <p className="text-gray-600 mb-6">No further subcategories available</p>
                          <Link
                            to={`/category/${activeCategory._id}/${subcategoryFromApi._id}`}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                            onClick={handleCloseMobileMenu}
                          >
                            <Package className="mr-2 h-5 w-5" />
                            View Products in this Category
                          </Link>
                        </div>
                      );
                    }
                  }
                  
                  // If not found in active category, search all categories
                  if (selectedSubcategory?._id || selectedSubcategory?.name) {
                    console.log("Searching all categories for subcategory");
                    for (const category of apiCategories) {
                      if (category.subcategories) {
                        const sub = category.subcategories.find(s => 
                          s._id === selectedSubcategory?._id || s.name === selectedSubcategory?.name
                        );
                        
                        if (sub && sub.subcategories && sub.subcategories.length > 0) {
                          console.log("Found in category", category.name, "with", sub.subcategories.length, "items");
                          return sub.subcategories.map((item) => (
                            <a
                              key={item._id || item.name}
                              href={`/category/${item._id}`}
                              className="flex items-center justify-between w-full py-3 px-4 text-gray-700"
                              onClick={(e) => {
                                // Only use preventDefault if we're going to handle navigation manually
                                e.preventDefault();
                                console.log("Navigating to subcategory item:", item._id);
                                window.location.href = `/category/${item._id}`;
                                setHoveredCategory(null); // Close megamenu
                              }}
                            >
                              <span>{item.name}</span>
                              <ChevronRight className="h-5 w-5" />
                            </a>
                          ));
                        }
                        
                        // Add view products button if no subcategories
                        if (sub && (!sub.subcategories || sub.subcategories.length === 0)) {
                          return (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                              <p className="text-gray-600 mb-6">No further subcategories available</p>
                              <Link
                                to={`/category/${category._id}/${sub._id}`}
                                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                                onClick={handleCloseMobileMenu}
                              >
                                <Package className="mr-2 h-5 w-5" />
                                View Products in this Category
                              </Link>
                            </div>
                          );
                        }
                        
                        // Also check deeper (nested subcategories)
                        for (const nestedSub of category.subcategories) {
                          if (nestedSub.subcategories) {
                            const deepSub = nestedSub.subcategories.find(s => 
                              s._id === selectedSubcategory?._id || s.name === selectedSubcategory?.name
                            );
                            
                            if (deepSub && deepSub.subcategories && deepSub.subcategories.length > 0) {
                              console.log("Found in nested subcategory with", deepSub.subcategories.length, "items");
                              return deepSub.subcategories.map((item) => (
                                <a
                                  key={item._id || item.name}
                                  href={`/category/${item._id}`}
                                  className="flex items-center justify-between w-full py-3 px-4 text-gray-700"
                                  onClick={(e) => {
                                    // Only use preventDefault if we're going to handle navigation manually
                                    e.preventDefault();
                                    console.log("Navigating to subcategory item:", item._id);
                                    window.location.href = `/category/${item._id}`;
                                    setHoveredCategory(null); // Close megamenu
                                  }}
                                >
                                  <span>{item.name}</span>
                                  <ChevronRight className="h-5 w-5" />
                                </a>
                              ));
                            }
                            
                            // Add view products button if no subcategories at this level
                            if (deepSub && (!deepSub.subcategories || deepSub.subcategories.length === 0)) {
                              return (
                                <div className="flex flex-col items-center justify-center py-10 text-center">
                                  <p className="text-gray-600 mb-6">No further subcategories available</p>
                                  <Link
                                    to={`/category/${category._id}/${nestedSub._id}/${deepSub._id}`}
                                    className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                                    onClick={handleCloseMobileMenu}
                                  >
                                    <Package className="mr-2 h-5 w-5" />
                                    View Products in this Category
                                  </Link>
                                </div>
                              );
                            }
                          }
                        }
                      }
                    }
                  }
                  
                  // If we have regular items from the selected subcategory, show those
                  if (selectedSubcategory?.items && selectedSubcategory.items.length > 0) {
                    console.log("Using items from selected subcategory:", selectedSubcategory.items.length, "items");
                    return selectedSubcategory.items.map((item) => (
                      <a
                        key={item}
                        href={`/category/${selectedCategory?.id || ''}/${selectedSubcategory?.name || ''}/${item}`}
                        className="flex items-center justify-between w-full py-3 px-4 text-gray-700"
                        onClick={(e) => {
                          // Only use preventDefault if we're going to handle navigation manually
                          e.preventDefault();
                          console.log("Navigating to subcategory item:", item);
                          window.location.href = `/category/${selectedCategory?.id || ''}/${selectedSubcategory?.name || ''}/${item}`;
                          setHoveredCategory(null); // Close megamenu
                        }}
                      >
                        <span>{item}</span>
                        <ChevronRight className="h-5 w-5" />
                      </a>
                    ));
                  }
                  
                  // If we get here, add a view all products in this category button
                  return (
                    <div className="flex flex-col items-center justify-center h-48 text-center">
                      <div className="text-gray-400 mb-4">
                        <Package className="h-12 w-12 mx-auto" />
                      </div>
                      <p className="text-gray-600 mb-6">This category has no further subcategories</p>
                      <Link
                        to={selectedSubcategory?._id 
                          ? `/category/${selectedSubcategory._id}` 
                          : selectedCategory?._id 
                            ? `/category/${selectedCategory._id}` 
                            : '/products'
                        }
                        className="inline-flex items-center px-5 py-2.5 text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                        onClick={handleCloseMobileMenu}
                      >
                        View All Products
                      </Link>
                      <button 
                        onClick={handleBackClick}
                        className="mt-4 px-4 py-2 text-sm bg-gray-100 rounded-md text-gray-600 hover:bg-gray-200"
                      >
                        Go Back
                      </button>
                    </div>
                  );
                })()}
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