import React, { useEffect, useState, useRef } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
  Filter,
  SortDesc,
  ChevronDown,
  X,
  ChevronLeft,
  Search,
  Grid,
  ChevronRight,
  Check,
  ChevronUp,
  Heart,
} from "lucide-react";
import { sampleProducts, allSampleProducts } from "../data/sampleProducts";
import axios from "axios";
import { API_URL } from "../config";

// Add the formatImageUrl function
const formatImageUrl = (imageUrl: string | undefined | null): string => {
  // If the URL is null, undefined, or empty, return a placeholder image
  if (!imageUrl || imageUrl.trim() === '') {
    return 'https://via.placeholder.com/64';
  }
  
  // Check if the URL already includes http:// or https://
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // Check if the URL starts with a slash
  if (!imageUrl.startsWith('/')) {
    imageUrl = '/' + imageUrl;
  }
  

  return `${API_URL}${imageUrl}`;
};

// Update the Product interface
interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  condition: string;
  oemNumber: string;
  images: string[];
  rating: number;
  stock: number;
  category?: string;
}

// Add an interface for API products
interface ApiProduct {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: {
    _id: string;
    name: string;
    description: string;
    parentId: string | null;
    imageUrl: string;
    createdAt: string;
    updatedAt: string;
    slug: string;
    __v: number;
  };
  oemNumber: string;
  compatibility: Array<{
    make: string;
    model: string;
    year: number;
    _id: string;
  }>;
  images: string[];
  status: string;
}

// Add a Category interface similar to ProductAdd.tsx
interface Category {
  _id: string;
  name: string;
  description?: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  parentId?: string;
  level?: number;
  isExpanded?: boolean;
  subcategories?: Category[];
  imageUrl?: string;
  isNew?: boolean; // Add this for NEW badge
}

interface ProductListProps {
  onDialogVisibilityChange?: (isVisible: boolean) => void;
}

// Add a WishlistItem interface
interface WishlistItem {
  _id: string;
  product: {
    _id: string;
    title: string;
    price: number;
    oemNumber: string;
    images: string[];
  } | null;
  priceAtAdd: number;
  addedAt: string;
}

// Add a Wishlist interface
interface Wishlist {
  _id: string;
  user: string;
  products: WishlistItem[];
  createdAt: string;
  updatedAt: string;
}

// Add this wishlist interface matching the API response structure
interface WishlistResponse {
  success: boolean;
  data: {
    _id: string;
    user: string;
    products: Array<string>;
    createdAt: string;
    updatedAt: string;
    __v: number;
  };
}

// Add a component for the wishlist count indicator 
const WishlistIndicator = ({ count }: { count: number }) => {
  return (
    <Link to="/profile?tab=wishlist" className="relative">
      <div className="p-2 shadow-md bg-white border border-gray-100 rounded-full flex items-center justify-center">
        <Heart className={`h-5 w-5 ${count > 0 ? 'text-red-500 fill-red-500' : 'text-gray-400'}`} />
        {count > 0 && (
          <div className="absolute -top-1 -right-1 bg-emerald-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold">
            {count > 99 ? '99+' : count}
          </div>
        )}
      </div>
    </Link>
  );
};

const ProductList = ({ onDialogVisibilityChange }: ProductListProps): JSX.Element => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [sortOption, setSortOption] = useState("");
  const [filters, setFilters] = useState({
    category: "All Categories",
    condition: "All Conditions",
    priceRange: "All Prices",
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<null | {
    id: string;
    name: string;
  }>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<null | {
    id: string;
    name: string;
  }>(null);
  const [selectedItemView, setSelectedItemView] = useState<null | {
    id: string;
    name: string;
  }>(null);
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [showGenreSelect, setShowGenreSelect] = useState(false);
  const [showTailleSelect, setShowTailleSelect] = useState(false);
  const [showMarqueSelect, setShowMarqueSelect] = useState(false);
  const [showCouleursSelect, setShowCouleursSelect] = useState(false);
  const [showEtatSelect, setShowEtatSelect] = useState(false);
  const [showVendeurSelect, setShowVendeurSelect] = useState(false);
  const [showUniversSelect, setShowUniversSelect] = useState(false);
  const [selectedUnivers, setSelectedUnivers] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedTailles, setSelectedTailles] = useState<string[]>([]);
  const [selectedMarques, setSelectedMarques] = useState<string[]>([]);
  const [selectedCouleurs, setSelectedCouleurs] = useState<string[]>([]);
  const [selectedEtats, setSelectedEtats] = useState<string[]>([]);
  const [selectedVendeurs, setSelectedVendeurs] = useState<string[]>([]);
  const [showFilterGenreSelect, setShowFilterGenreSelect] = useState(false);
  const [showFilterTailleSelect, setShowFilterTailleSelect] = useState(false);
  const [showFilterMarqueSelect, setShowFilterMarqueSelect] = useState(false);
  const [showFilterCouleurSelect, setShowFilterCouleurSelect] = useState(false);
  const [showPrixSelect, setShowPrixSelect] = useState(false);
  const [minPrice, setMinPrice] = useState<string>('2');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [showSortBySelect, setShowSortBySelect] = useState(false);
  const [selectedSort, setSelectedSort] = useState('recent');
  const [showProductListingScreen, setShowProductListingScreen] = useState(
    location.state?.showProductListingScreen || false
  );
  // Add a state variable to control tab visibility
  const [showTabs, setShowTabs] = useState(false);
  
  // Add state for categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesError, setCategoriesError] = useState('');

  // Add these new state variables for category navigation
  const [navigationHistory, setNavigationHistory] = useState<Category[][]>([]);
  const [currentCategories, setCurrentCategories] = useState<Category[]>([]);
  // Add a new state to track the subcategories of the selected category
  const [currentSubcategories, setCurrentSubcategories] = useState<Category[]>([]);

  // Add these state variables near the other state declarations
  const [showSearchModal, setShowSearchModal] = useState(false);
  const searchTimeout = React.useRef<NodeJS.Timeout | null>(null);

  // Add state for actual products from API
  const [apiProducts, setApiProducts] = useState<ApiProduct[]>([]);
  const [productsError, setProductsError] = useState('');

  // Add state for wishlist
  const [wishlistData, setWishlistData] = useState<WishlistResponse | null>(null);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const [wishlistError, setWishlistError] = useState('');

  // Add new state for wishlist count
  const [wishlistCount, setWishlistCount] = useState<number>(0);

  // Add a function to fetch just the wishlist count (more efficient for UI elements that only need the count)
  const fetchWishlistCount = async () => {
    // Skip if user is not authenticated
    if (!localStorage.getItem('accessToken')) {
      setWishlistCount(0);
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/wishlist/count`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch wishlist count: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Wishlist count data:", data);
      
      if (data.success) {
        setWishlistCount(data.count);
      }
    } catch (error) {
      console.error('Error fetching wishlist count:', error);
      // Don't change count on error
    }
  };

  // Add the fetchCategories function
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/api/categories`);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      console.log("Fetched Categories:", data);
      
      // Add isNew property to some categories for demo purposes
      const categoriesWithNew = data.map((cat: Category) => {
        if (cat.name.includes('VÉLO') || cat.name.includes('VOL')) {
          return { ...cat, isNew: true };
        }
        return cat;
      });
      
      setCategories(categoriesWithNew);
      setCurrentCategories(categoriesWithNew); // Set current categories here
    } catch (err) {
      setCategoriesError("Failed to fetch categories");
      console.error("Error fetching categories:", err);
    }
  };

  // Add function to fetch actual products
  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/api/products/`);
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      const data = await response.json();
      console.log("Fetched Products:", data);
      setApiProducts(data);
    } catch (err) {
      setProductsError("Failed to fetch products");
      console.error("Error fetching products:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // First, add a categorySearch function near the fetchCategories function
  const searchCategories = async (query: string) => {
    try {
      setIsLoading(true);
      console.log("Searching for:", query);
      
      const response = await fetch(`${API_URL}/api/categories/search?query=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      
      const data = await response.json();
      console.log("Search Results:", data);
      
      if (data.results && Array.isArray(data.results)) {
        // Add isNew property to some categories for demo purposes
        const categoriesWithNew = data.results.map((cat: Category) => {
          if (cat.name.includes('VÉLO') || cat.name.includes('VOL')) {
            return { ...cat, isNew: true };
          }
          return cat;
        });
        
        setCategories(categoriesWithNew);
        setCurrentCategories(categoriesWithNew);
      } else {
        setCategories([]);
        setCurrentCategories([]);
      }
    } catch (err) {
      setCategoriesError("Failed to search categories");
      console.error("Error searching categories:", err);
      setCategories([]);
      setCurrentCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setAllProducts(allSampleProducts);
    setFilteredProducts(allSampleProducts);
    
    // Fetch products from API
    fetchProducts();
    
    // Fetch categories when component mounts
    fetchCategories();
  }, []);

  useEffect(() => {
    let result = [...allProducts];

    // Apply filters
    if (filters.category !== "All Categories") {
      result = result.filter(
        (product) => product.category === filters.category
      );
    }

    if (filters.condition !== "All Conditions") {
      result = result.filter(
        (product) => product.condition === filters.condition
      );
    }

    switch (filters.priceRange) {
      case "Under €50":
        result = result.filter((product) => product.price < 50);
        break;
      case "€50 - €100":
        result = result.filter(
          (product) => product.price >= 50 && product.price <= 100
        );
        break;
      case "€100 - €500":
        result = result.filter(
          (product) => product.price > 100 && product.price <= 500
        );
        break;
      case "Over €500":
        result = result.filter((product) => product.price > 500);
        break;
      default:
        break;
    }

    // Apply sorting
    switch (sortOption) {
      case "price-low-high":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-high-low":
        result.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "name-a-z":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "name-z-a":
        result.sort((a, b) => b.title.localeCompare(a.title));
        break;
      default:
        break;
    }

    setFilteredProducts(result);
  }, [filters, allProducts, sortOption]);

  // Add resize listener
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (location.state?.showProductListingScreen) {
      setSelectedCategory(null);
      setSelectedSubcategory(null);
      setSelectedItemView({ id: 'search', name: 'Search Results' });
    }
  }, [location.state]);

  const handleViewDetails = (productId: string) => {
    window.scrollTo(0, 0);
    navigate(`/products/${productId}`);
  };

  const handleFilterChange = (
    filterType: keyof typeof filters,
    value: string
  ) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const handleSortChange = (option: string) => {
    setSortOption(option);
    setShowSortMenu(false);
  };

  const categoryOptions = [
    "All Categories",
    "Engine Parts",
    "Brake Systems",
    "Transmission",
    "Body Parts",
    "Electrical",
    "Suspension",
  ];

  const conditions = ["All Conditions", "New", "Used"];
  const priceRanges = [
    "All Prices",
    "Under €50",
    "€50 - €100",
    "€100 - €500",
    "Over €500",
  ];

  const sortOptions = [
    { value: "price-low-high", label: "Price: Low to High" },
    { value: "price-high-low", label: "Price: High to Low" },
    { value: "rating", label: "Highest Rated" },
    { value: "name-a-z", label: "Name: A to Z" },
    { value: "name-z-a", label: "Name: Z to A" },
  ];
  const tabs = ["Sports", "Marques", "Genres"];
  const [activeTab, setActiveTab] = React.useState("Sports");

  // First, update the sportsCategories array with proper image paths
  const sportsCategories = [
    {
      id: "ski",
      name: "SKI | SNOW",
      image: "/images/sports/1.webp", // Add your image paths
    },
    {
      id: "escalade",
      name: "ESCALADE | ALPINISME",
      image: "/images/sports/38.webp",
    },
    {
      id: "rando",
      name: "RANDO | BIVOUAC",
      image: "/images/sports/68.webp",
    },
    {
      id: "trail",
      name: "TRAIL | RUNNING",
      image: "/images/sports/97.webp",
    },
    {
      id: "velos",
      name: "VÉLOS | VTT",
      image: "/images/sports/217.webp",
      isNew: true,
    },
    {
      id: "vol",
      name: "VOL | PARAPENTE",
      image: "/images/sports/280.webp",
      isNew: true,
    },
    {
      id: "vol",
      name: "VOL | PARAPENTE",
      image: "/images/sports/310.webp",
      isNew: true,
    },
  ];

  // Add this array for genres categories
  const genresCategories = [
    {
      id: "hommes",
      name: "HOMMES",
      image: "/images/genres/116.webp",
    },
    {
      id: "femmes",
      name: "FEMMES",
      image: "/images/genres/152.webp",
    },
    {
      id: "enfants",
      name: "ENFANTS",
      image: "/images/genres/188.webp",
    },
  ];

  // Add brands data
  const brands = [
    "ARCTERYX",
    "ARVA",
    "ASICS",
    "BLACK CROWS",
    "BLACK DIAMOND",
    "BROOKS",
    "DYNAFIT",
    "FIVE TEN",
    "GARMIN",
    "HAGLOFS",
    "HOKA ONE ONE",
    "ICEBREAKER",
  ];

  // Add state for Marques screen
  const [showMarques, setShowMarques] = useState(false);

  // Update the tab click handler
  const handleTabClick = (tab: string) => {
    if (tab === "Marques") {
      setShowMarques(true);
    } else {
      setActiveTab(tab);
    }
  };

  // Add handler for category click
  const handleCategoryClick = (category: { id: string; name: string }) => {
    setSelectedCategory(category);
    
    // Find the full category object from our categories array
    const fullCategory = findCategoryById(categories, category.id);
    
    if (fullCategory && fullCategory.subcategories && fullCategory.subcategories.length > 0) {
      console.log("Found subcategories:", fullCategory.subcategories);
      setCurrentSubcategories(fullCategory.subcategories);
      setSelectedItemView(null);
      setShowProductListingScreen(false); // Ensure the product screen is hidden
    } else {
      console.log("No subcategories found for category:", category);
      setCurrentSubcategories([]);
      setSelectedItemView(category);
      // Show product listing screen since this is a leaf category
      setShowProductListingScreen(true);
    }
  };

  // Helper function to find a category by ID
  const findCategoryById = (cats: Category[], id: string): Category | null => {
    for (const cat of cats) {
      if (cat._id === id) {
        return cat;
      }
      if (cat.subcategories && cat.subcategories.length > 0) {
        const found = findCategoryById(cat.subcategories, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Add this new function to handle subcategory clicks
  const handleSubcategoryClick = (subcategory: Category) => {
    if (subcategory.subcategories && subcategory.subcategories.length > 0) {
      // If this subcategory has further subcategories
      console.log("Setting subcategories:", subcategory.subcategories);
      setCurrentSubcategories(subcategory.subcategories);
      setSelectedCategory({ id: subcategory._id, name: subcategory.name });
      setSelectedItemView(null);
      setShowProductListingScreen(false); // Ensure product screen is hidden
    } else {
      // If no further subcategories, treat as leaf category
      setSelectedCategory({ id: subcategory._id, name: subcategory.name });
      setSelectedItemView({ id: subcategory._id, name: subcategory.name });
      // Show product listing screen
      setShowProductListingScreen(true); // This was missing!
    }
  };

  // Add handler for item click
  const handleItemClick = (item: { id: string; name: string }) => {
    setSelectedItemView(item);
  };

  // Add filter options data
  const filterOptions = [
    {
      id: "classer",
      name: "Classer par",
      value: "Les plus récents",
      hasChevron: true,
    },
    {
      id: "univers",
      name: "Univers",
      hasChevron: true,
    },
    {
      id: "marques",
      name: "Marques",
      hasChevron: true,
    },
    {
      id: "couleurs",
      name: "Couleurs",
      hasChevron: true,
    },
    {
      id: "etat",
      name: "État",
      hasChevron: true,
    },
    {
      id: "genre",
      name: "Genre",
      hasChevron: true,
    },
    {
      id: "taille",
      name: "Taille",
      hasChevron: true,
    },
    {
      id: "vendeur",
      name: "Vendeur",
      hasChevron: true,
    },
    {
      id: "prix",
      name: "Prix",
      hasChevron: true,
    },
  ];

  // Add genre options data
  const genreOptions = [
    {
      id: "homme",
      name: "Homme",
      count: "+100",
      image: "/images/filter/genres/F.webp",
    },
    {
      id: "femme",
      name: "Femme",
      count: "+100",
      image: "/images/filter/genres/J.webp",
    },
    {
      id: "unisex",
      name: "Unisex",
      count: "+100",
      image: "/images/filter/genres/K.webp",
    },
    {
      id: "junior",
      name: "Junior",
      count: "+100",
      image: "/images/filter/genres/M.webp",
    },
    {
      id: "enfant",
      name: "Enfant",
      count: "+100",
      image: "/images/filter/genres/U.webp",
    },
  ];

  // Add taille options data
  const tailleOptions = [
    {
      id: "xxs",
      name: "XXS",
      count: "16",
    },
    {
      id: "xs",
      name: "XS",
      count: "+100",
    },
    {
      id: "s",
      name: "S",
      count: "+100",
    },
    {
      id: "m",
      name: "M",
      count: "+100",
    },
    {
      id: "l",
      name: "L",
      count: "+100",
    },
    {
      id: "xl",
      name: "XL",
      count: "+100",
    },
    {
      id: "xxl",
      name: "XXL",
      count: "55",
    },
    {
      id: "xxxl",
      name: "XXXL",
      count: "9",
    },
    {
      id: "4ans",
      name: "4 ANS",
      count: "24",
    },
  ];

  // Update marque options data with correct brands
  const marqueOptions = [
    "DYNAFIT",
    "FIVE TEN",
    "GARMIN",
    "HAGLOFS",
    "HOKA ONE ONE",
    "ICEBREAKER",
    "MAVIC",
  ];

  // Add color options data
  const colorOptions = [
    {
      id: "noir",
      name: "Noir",
      count: "+100",
      color: "#000000",
    },
    {
      id: "blanc",
      name: "Blanc",
      count: "+100",
      color: "#FFFFFF",
    },
    {
      id: "gris",
      name: "Gris",
      count: "+100",
      color: "#808080",
    },
    {
      id: "marron",
      name: "Marron",
      count: "+100",
      color: "#8B4513",
    },
    {
      id: "beige",
      name: "Beige",
      count: "+100",
      color: "#F5F5DC",
    },
    {
      id: "orange",
      name: "Orange",
      count: "+100",
      color: "#FFA500",
    },
    {
      id: "jaune",
      name: "Jaune",
      count: "+100",
      color: "#FFD700",
    },
    {
      id: "vert",
      name: "Vert",
      count: "+100",
      color: "#008000",
    },
  ];

  // Add etat options data
  const etatOptions = [
    {
      id: "neuf-avec",
      name: "Neuf avec étiquette",
      description:
        "Article neuf, en parfait état d'utilisation, jamais utilisé, avec étiquette ou emballage d'origine.",
    },
    {
      id: "neuf-sans",
      name: "Neuf sans étiquette",
      description:
        "Article neuf, jamais utilisé, sans aucun défaut, sans étiquette ou emballage d'origine.",
    },
    {
      id: "tres-bon",
      name: "Très bon état",
      description:
        "Article très peu utilisé, propre, en parfait état de fonctionnement, pouvant présenter quelques rares imperfections ou défauts esthétiques.",
    },
    {
      id: "bon",
      name: "Bon état",
      description:
        "Article d'occasion, utilisé quelques fois, propre, comportant quelques imperfections ou signes d'usure.",
    },
    {
      id: "correct",
      name: "État correct",
      description:
        "Article d'occasion utilisé plusieurs fois, mais fonctionnel.",
    },
  ];

  // Add vendeur options data
  const vendeurOptions = [
    {
      id: "particulier",
      name: "Particulier",
    },
    {
      id: "professionnel",
      name: "Professionnel",
    },
  ];

  // Add univers options data with images
  const universOptions = [
    {
      id: "vestes",
      name: "Vestes",
      image: "/images/filter/univers/3.webp",
    },
    {
      id: "doudounes",
      name: "Doudounes",
      image: "/images/filter/univers/4.webp",
    },
    {
      id: "polaires",
      name: "Polaires & Softshell",
      image: "/images/filter/univers/5.webp",
    },
    {
      id: "premieres",
      name: "Premières couches",
      image: "/images/filter/univers/6.webp",
    },
    {
      id: "pantalons",
      name: "Pantalons",
      image: "/images/filter/univers/7.webp",
    },
    {
      id: "sous",
      name: "Sous-Vêtements",
      image: "/images/filter/univers/8.webp",
    },
  ];

  // Add these helper functions
  const toggleSelection = (
    id: string,
    selectedItems: string[],
    setSelectedItems: (items: string[]) => void
  ) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter((item) => item !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  // Add a function to handle filter updates
  const applyFilters = () => {
    // Here you can handle what happens when filters are applied
    console.log({
      univers: selectedUnivers,
      genres: selectedGenres,
      tailles: selectedTailles,
      marques: selectedMarques,
      couleurs: selectedCouleurs,
      etats: selectedEtats,
      vendeurs: selectedVendeurs,
    });

    setShowFilterDialog(false);
  };

  // Add a reset function
  const resetFilters = () => {
    setSelectedUnivers([]);
    setSelectedGenres([]);
    setSelectedTailles([]);
    setSelectedMarques([]);
    setSelectedCouleurs([]);
    setSelectedEtats([]);
    setSelectedVendeurs([]);
  };

  // Add sort options data
  const sortByOptions = [
    {
      id: 'recent',
      name: 'Les plus récents'
    },
    {
      id: 'ascending',
      name: 'Prix croissant'
    },
    {
      id: 'descending',
      name: 'Prix décroissant'
    }
  ];

  // Add effect to notify parent of dialog state changes
  React.useEffect(() => {
    const isAnyDialogOpen = showFilterDialog || 
      showGenreSelect || 
      showTailleSelect || 
      showMarqueSelect || 
      showCouleursSelect || 
      showEtatSelect || 
      showVendeurSelect || 
      showUniversSelect || 
      showPrixSelect || 
      showSortBySelect;

    onDialogVisibilityChange?.(!isAnyDialogOpen);
  }, [
    showFilterDialog,
    showGenreSelect,
    showTailleSelect,
    showMarqueSelect,
    showCouleursSelect,
    showEtatSelect,
    showVendeurSelect,
    showUniversSelect,
    showPrixSelect,
    showSortBySelect,
    onDialogVisibilityChange
  ]);

  // Add this at the beginning of your component, before the return statement
  console.log("Current state:", {
    selectedItemView,
    showProductListingScreen,
    selectedCategory,
    selectedSubcategory,
    currentSubcategories: currentSubcategories.length
  });


  
  // Add useEffect to fetch wishlist on component mount
  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchWishlist();
    fetchWishlistCount(); // Add this line
  }, []);

  // Replace the fetchWishlist function with this updated version
  const fetchWishlist = async () => {
    // Skip if user is not authenticated
    if (!localStorage.getItem('accessToken')) {
      return;
    }
    
    try {
      setIsWishlistLoading(true);
      setWishlistError('');
      
      const response = await fetch(`${API_URL}/api/wishlist`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch wishlist: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Wishlist data:", data);
      
      // Check for proper data structure
      if (!data || !data.success || !data.data) {
        throw new Error('Invalid wishlist data format');
      }
      
      // Store the complete wishlist data
      setWishlistData(data);
      
      // Extract product IDs from wishlist data structure
      // The API returns products as an array of strings (product IDs) or objects
      const extractedIds = Array.isArray(data.data.products) 
        ? data.data.products.map((item: any) => {
            if (typeof item === 'string') return item;
            return item._id ? item._id : null;
          }).filter(Boolean)
        : [];
      
      console.log("Extracted wishlist IDs:", extractedIds);
      setWishlistIds(extractedIds);
      
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      setWishlistError(error instanceof Error ? error.message : 'Unknown error');
      setWishlistIds([]);
    } finally {
      setIsWishlistLoading(false);
    }
  };

  // Replace the toggleWishlistItem function with this updated version
  const toggleWishlistItem = async (productId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!localStorage.getItem('accessToken')) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    
    try {
      setIsAddingToWishlist(true);
      
      // Check if product is already in wishlist
      const isInWishlist = wishlistIds.includes(productId);
      console.log(`${isInWishlist ? 'Removing from' : 'Adding to'} wishlist:`, productId);
      
      // Update endpoint and method based on the actual API structure
      const endpoint = isInWishlist 
        ? `${API_URL}/api/wishlist/remove/${productId}`
        : `${API_URL}/api/wishlist/add`;
      
      // For adding item to wishlist, the request body should match what's expected by the API
      const body = !isInWishlist ? JSON.stringify({ productId }) : undefined;
      
      console.log(`Making ${isInWishlist ? 'DELETE' : 'POST'} request to ${endpoint}`, body);
      
      const response = await fetch(endpoint, {
        method: isInWishlist ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        ...(body && { body })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${isInWishlist ? 'remove from' : 'add to'} wishlist: ${response.status}`);
      }
      
      // Update local state optimistically
      if (isInWishlist) {
        setWishlistIds(prev => prev.filter(id => id !== productId));
        setWishlistCount(prev => Math.max(0, prev - 1)); // Decrement count
      } else {
        setWishlistIds(prev => [...prev, productId]);
        setWishlistCount(prev => prev + 1); // Increment count
      }
      
      // Refresh the wishlist to ensure data is in sync
      await fetchWishlist();
      
      // Also update the count
      await fetchWishlistCount();
      
    } catch (error) {
      console.error('Error updating wishlist:', error);
      // Revert optimistic update on error
      await fetchWishlist();
      await fetchWishlistCount();
    } finally {
      setIsAddingToWishlist(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="text-center py-10">
            <p className="text-gray-500">Loading products...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {showProductListingScreen ? (
        // Product Listing Screen section
        <div className="md:pt-[160px] pt-[0px] pb-[60px] md:pb-0">
          <div className="max-w-7xl mx-auto">
            {/* Fixed Header */}
            <div className=" top-[0px] md:top-[112px] bg-white z-10 ">
              <div className="flex flex-col flex-shrink-0 md:mx-24">
                <div className="flex items-center px-2 py-3 border-b border-gray-100 md:hidden">
                  <button
                    onClick={() => {
                      setShowProductListingScreen(false);
                      setSelectedItemView(null);
                      setSelectedSubcategory(null);
                    }}
                    className="p-2 shadow-md bg-white border border-gray-100 rounded-full"
                  >
                    <ChevronLeft className="h-5 w-5 text-gray-900" />
                  </button>
                  <div className="flex-1 mx-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <div className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-100">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-900">Chercher</span>
                          <span className="text-xs text-gray-500">
                            Vêtements, chaussures ...
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Breadcrumb - Only visible on web */}
                <div className="hidden md:flex items-center space-x-2">
                  <Link to="/" className="text-gray-500 text-sm hover:text-gray-700">
                    Accueil2
                  </Link>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <Link to="/ski-snow" className="text-gray-500 text-sm hover:text-gray-700">
                    Ski | Snow
                  </Link>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <Link to="/vetements" className="text-gray-500 text-sm hover:text-gray-700">
                    Vêtements
                  </Link>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <span className="text-emerald-500 text-sm font-medium">
                    Vestes
                  </span>
                </div>

                {/* Title and Description - Only visible on web */}
                <div className="hidden md:block ">
                  <h1 className="text-2xl font-bold text-gray-900">
                    Vestes De Ski
                  </h1>
                  <p className="text-gray-500 text-sm mt-1">
                    Vestes de ski d'occasion : annonces vérifiées, achat simple et sécurisé.
                  </p>
                </div>
                {/* Filter Categories */}
                <div className="px-0 pt-2 md:pt-0 overflow-x-auto scrollbar-none flex-shrink-0">
                  <div className="flex gap-2 py-2 min-w-max">
                    <button
                      onClick={() => setShowFilterDialog(true)}
                      className="flex items-center px-3 py-1.5 rounded-full bg-black text-white text-[13px] shadow-sm min-w-[110px]"
                    >
                      <Filter className="h-3.5 w-3.5 mr-1" />
                      Filtrer par
                    </button>
                    <button
                      onClick={() => setShowGenreSelect(true)}
                      className={`px-3 py-1.5 rounded-full text-[13px] min-w-[70px] whitespace-nowrap ${selectedGenres.length > 0
                        ? "bg-emerald-50 text-emerald-500 border border-emerald-500"
                        : "bg-gray-50 text-gray-900"
                        }`}
                    >
                      Genre
                      {selectedGenres.length > 0 && ` (${selectedGenres.length})`}
                    </button>
                    <button
                      onClick={() => setShowTailleSelect(true)}
                      className={`px-3 py-1.5 rounded-full text-[13px] min-w-[70px] whitespace-nowrap ${selectedTailles.length > 0
                        ? "bg-emerald-50 text-emerald-500 border border-emerald-500"
                        : "bg-gray-50 text-gray-900"
                        }`}
                    >
                      Taille
                      {selectedTailles.length > 0 && ` (${selectedTailles.length})`}
                    </button>
                    <button
                      onClick={() => setShowMarqueSelect(true)}
                      className={`px-3 py-1.5 rounded-full text-[13px] min-w-[70px] whitespace-nowrap ${selectedMarques.length > 0
                        ? "bg-emerald-50 text-emerald-500 border border-emerald-500"
                        : "bg-gray-50 text-gray-900"
                        }`}
                    >
                      Marque
                      {selectedMarques.length > 0 && ` (${selectedMarques.length})`}
                    </button>
                    <button
                      onClick={() => setShowCouleursSelect(true)}
                      className={`px-3 py-1.5 rounded-full text-[13px] min-w-[70px] whitespace-nowrap ${selectedCouleurs.length > 0
                        ? "bg-emerald-50 text-emerald-500 border border-emerald-500"
                        : "bg-gray-50 text-gray-900"
                        }`}
                    >
                      Couleur
                      {selectedCouleurs.length > 0 && ` (${selectedCouleurs.length})`}
                    </button>
                    <button
                      onClick={() => setShowEtatSelect(true)}
                      className={`px-3 py-1.5 rounded-full text-[13px] min-w-[70px] whitespace-nowrap ${selectedEtats.length > 0
                        ? "bg-emerald-50 text-emerald-500 border border-emerald-500"
                        : "bg-gray-50 text-gray-900"
                        }`}
                    >
                      État
                      {selectedEtats.length > 0 && ` (${selectedEtats.length})`}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Grid - Updated to use API data */}
            <div className="md:mx-20">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 px-4 py-4">
                {isLoading ? (
                  <div className="col-span-full text-center py-8">
                    <p>Loading products...</p>
                  </div>
                ) : productsError ? (
                  <div className="col-span-full text-center py-8 text-red-500">
                    {productsError}
                  </div>
                ) : apiProducts.length === 0 ? (
                  <div className="col-span-full text-center py-8">
                    <p>No products found</p>
                  </div>
                ) : (
                  apiProducts.map((product) => (
                    <div
                      key={product._id}
                      className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="relative aspect-square">
                        <img
                          src={formatImageUrl(product.images[0])}
                          alt={product.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300';
                          }}
                        />
                        <button
                          onClick={(e) => toggleWishlistItem(product._id, e)}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-sm"
                          disabled={isWishlistLoading || isAddingToWishlist}
                        >
                          <Heart 
                            className={`w-5 h-5 ${wishlistIds.includes(product._id) 
                              ? 'text-red-500 fill-red-500' 
                              : 'text-gray-400'}`} 
                          />
                        </button>
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium text-sm mb-2 line-clamp-2">
                          {product.title}
                        </h3>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">€{product.price.toFixed(2)}</span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            {product.status === "approved" ? "Approved" : product.status}
                          </span>
                        </div>
                        <button
                          onClick={() => navigate(`/products/${product._id}`)}
                          className="w-full mt-3 py-2 text-sm text-secondary border border-secondary rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Original category/subcategory views
        <>
          {!selectedCategory ? (
            <>
              {/* Fixed Header */}
              <div className="fixed md:top-[140px] top-0 left-0 right-0 bg-white md:z-40 border-b border-gray-100">
                {/* Search Bar Container */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:w-1/2 md:mx-24">
                  <div className="relative">
                    <div 
                      className="flex items-center w-full px-4 py-2 bg-white rounded-full shadow-sm border border-gray-100"
                      onClick={() => setShowSearchModal(true)} // Add this line for mobile interaction
                    >
                      <Search className="h-5 w-5 text-black flex-shrink-0" />
                      <div className="ml-3 flex-1">
                        <div className="text-[15px] text-black">Seek</div>
                        <div className="text-[13px] text-gray-400">Clothes, shoes...</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Only show tabs if showTabs is true */}
                {showTabs && (
                  <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="border-b border-gray-100">
                      <div className="grid grid-cols-3">
                        {tabs.map((tab) => (
                          <button
                            key={tab}
                            onClick={() => handleTabClick(tab)}
                            className={`py-3 text-[16px] font-bold transition-colors relative
                              ${tab === activeTab
                                ? "text-gray-900 font-bold border-b-2 border-gray-900 -mb-[2px]"
                                : "text-gray-900"
                              }`}
                          >
                            {tab}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Adjust the padding for the content area since we're hiding the tabs */}
              <div className={`md:pt-[${showTabs ? '198px' : '150px'}] pt-[100px] pb-6`}>
                <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 md:mx-0">
                  {/* Always show Sports Categories regardless of activeTab when tabs are hidden */}
                  {(!showTabs || activeTab === "Sports") && (
                    <div className="space-y-4">
                      {isLoading ? (
                        <div className="text-center py-8">Loading categories...</div>
                      ) : categoriesError ? (
                        <div className="text-center py-8 text-red-500">{categoriesError}</div>
                      ) : (
                        categories.map((category) => (
                          <button
                            key={category._id}
                            onClick={() => handleCategoryClick({
                              id: category._id,
                              name: category.name
                            })}
                            className="flex items-center w-full px-4 py-4 hover:bg-gray-50 rounded-xl transition-colors"
                          >
                            <div className="w-12 h-12 flex-shrink-0">
                              <img
                                src={formatImageUrl(category.imageUrl)}
                                alt={category.name}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/48';
                                }}
                              />
                            </div>
                            <span className="flex-1 text-[15px] text-gray-900 font-medium text-left ml-4">
                              {category.name}
                            </span>
                            {category.isNew && (
                              <span className="mr-3 px-2 py-0.5 text-xs font-medium text-white bg-emerald-400 rounded-full">
                                NEW
                              </span>
                            )}
                            
                            {/* Only show the chevron icon if the category has subcategories */}
                            {category.subcategories && category.subcategories.length > 0 ? (
                              <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mr-2" />
                            ) : (
                              <div className="w-5 mr-2"></div> 
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}

                  {/* Only show Genres when tabs are visible and activeTab is "Genres" */}
                  {showTabs && activeTab === "Genres" && (
                    <div className="bg-white">
                      {genresCategories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => handleCategoryClick(category)}
                          className="flex items-center w-full px-4 py-2.5 border-b border-gray-100"
                        >
                          <div className="w-12 h-12 flex-shrink-0">
                            <img
                              src={category.image}
                              alt={category.name}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <span className="flex-1 text-[15px] text-gray-900 font-medium text-left ml-3">
                            {category.name}
                          </span>
                          <svg
                            className="w-5 h-5 text-gray-400 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : !selectedSubcategory && !selectedItemView ? (
            /* Category Detail Screen - Only show when no subcategory and no item is selected */
            <div className="md:pt-20 pt-0 pb-[60px] md:pb-0">
              <div className="max-w-full mx-auto">
                {/* Fixed Header */}
                <div className="fixed md:top-[145px] top-[0px] left-0 right-0 bg-white z-50 border-b border-gray-100">
                  <div className="px-4 py-3 flex items-center justify-between">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className="w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-gray-100 transition shadow-md"
                    >
                      <ChevronLeft size={20} className="text-black" />
                    </button>
                    <h2 className="text-lg font-semibold text-center text-gray-900">
                      {selectedCategory.name}
                    </h2>
                    <div className="w-10"></div> {/* Empty div for spacing */}
                  </div>
                </div>

                {/* Subcategories list */}
                <div className="pt-16 px-4">
                  {isLoading ? (
                    <div className="text-center py-8">Loading subcategories...</div>
                  ) : (
                    <div className="space-y-4">
                      {currentSubcategories.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          No subcategories found for {selectedCategory?.name}
                        </div>
                      ) : (
                        <>
                          {/* <div className="text-sm text-gray-500 mb-2">
                            Found {currentSubcategories.length} subcategories
                          </div> */}
                          {currentSubcategories.map((subcategory) => (
                            <button
                              key={subcategory._id}
                              onClick={() => handleSubcategoryClick(subcategory)}
                              className="flex items-center w-full px-4 py-4 hover:bg-gray-50 rounded-xl transition-colors"
                            >
                              <div className="w-12 h-12 flex-shrink-0">
                                <img
                                  src={formatImageUrl(subcategory.imageUrl)}
                                  alt={subcategory.name}
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/48';
                                  }}
                                />
                              </div>
                              <span className="flex-1 text-[15px] text-gray-900 font-medium text-left ml-4">
                                {subcategory.name}
                              </span>
                              {subcategory.isNew && (
                                <span className="mr-3 px-2 py-0.5 text-xs font-medium text-white bg-emerald-400 rounded-full">
                                  NEW
                                </span>
                              )}
                              
                              {/* Only show the chevron icon if the subcategory has further subcategories */}
                              {subcategory.subcategories && subcategory.subcategories.length > 0 ? (
                                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mr-2" />
                              ) : (
                                <div className="w-5 mr-2"></div>
                              )}
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {/* Subcategory Detail Screen - Only show when subcategory is selected and no item is selected */}
          {selectedSubcategory && !selectedItemView && (
            <div className="md:pt-20 pt-0 pb-[60px] md:pb-0">
              <div className="max-w-full mx-auto">
                {/* Fixed Header */}
                <div className="sticky top-[0px] md:top-[140px] bg-white z-10">
                  <div className="flex items-center px-2 py-3 border-b border-gray-100 md:mx-24 md:border-b-0">
                    <button
                      onClick={() => setSelectedSubcategory(null)}
                      className="p-2 shadow-md bg-white border border-gray-100 rounded-full"
                    >
                      <ChevronLeft className="h-5 w-5 text-gray-900" />
                    </button>
                    <div className="flex-1 mx-2">
                      <div className="relative md:w-1/2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <div className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-gray-100">
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-900">Chercher</span>
                            <span className="text-xs text-gray-500">
                              Vêtements, chaussures ...
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
        </>
      )}

      {/* Filter Dialog */}
      {showFilterDialog && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center"
            onClick={() => setShowFilterDialog(false)}
          />

          {/* Dialog */}
          <div className="fixed md:fixed inset-x-0 bottom-0 md:inset-0 z-50 bg-white md:m-auto md:w-[500px] md:max-h-[600px] rounded-t-3xl md:rounded-xl animate-slide-up flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="px-5 py-4 flex items-center justify-between flex-shrink-0">
              <h2 className="text-[17px] font-medium">Filtres</h2>
              <button
                onClick={() => setShowFilterDialog(false)}
                className="p-1 -mr-1 bg-white rounded-full shadow-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Classer par */}
              <div
                className="px-5 py-3.5 bg-gray-50 flex items-center justify-between border-b border-gray-100 mx-5 mb-5 rounded-xl"
                onClick={() => setShowSortBySelect(true)}
              >
                <span className="text-[15px] text-gray-900">Classer par</span>
                <div className="flex items-center">
                  <span className="text-[15px] text-emerald-500 mr-2">
                    {sortByOptions.find(opt => opt.id === selectedSort)?.name}
                  </span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>

              {/* Other Options */}
              <div className="px-5">
                {[
                  "Univers",
                  "Marques",
                  "Couleurs",
                  "État",
                  "Genre",
                  "Taille",
                  "Vendeur",
                  "Prix",
                ].map((option) => (
                  <div
                    key={option}
                    onClick={() => {
                      if (option === "Genre") setShowGenreSelect(true);
                      if (option === "Taille") setShowTailleSelect(true);
                      if (option === "Marques") setShowMarqueSelect(true);
                      if (option === "Couleurs") setShowCouleursSelect(true);
                      if (option === "État") setShowEtatSelect(true);
                      if (option === "Vendeur") setShowVendeurSelect(true);
                      if (option === "Univers") setShowUniversSelect(true);
                      if (option === "Prix") setShowPrixSelect(true);
                    }}
                    className="py-3.5 border-t border-gray-100 flex items-center justify-between"
                  >
                    <span className="text-[15px] text-gray-900">
                      {option}
                    </span>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                ))}
              </div>
            </div>

            {/* Add buttons at the bottom */}
            <div className="flex-shrink-0 px-5 py-4 border-t border-gray-100">
              <div className="flex gap-4">
                <button
                  onClick={resetFilters}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-900 font-medium"
                >
                  Réinitialiser
                </button>
                <button
                  onClick={applyFilters}
                  className="flex-1 py-3 rounded-xl bg-black text-white font-medium"
                >
                  Appliquer
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Genre Selection Screen */}
      {showGenreSelect && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center md:pb-10">
          <div className="fixed md:relative inset-0 md:inset-auto bg-white z-50 md:top-[25px] top-[0px] md:bottom-[80px] bottom-[0px] md:w-[500px] w-[100vw] md:animate-slide-up animate-slide-left md:rounded-xl rounded-none flex flex-col h-full">
            {/* Header */}
            <div className="flex-shrink-0 px-4 py-4 flex items-center border-b border-gray-100 relative">
              <button onClick={() => setShowGenreSelect(false)} className="p-2">
                <ChevronLeft className="h-5 w-5 text-gray-900" />
              </button>
              <h2 className="text-[17px] font-medium absolute left-1/2 transform -translate-x-1/2">
                Genre
              </h2>
            </div>

            {/* Genre Options - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-4">
                {genreOptions.map((genre) => (
                  <div
                    key={genre.id}
                    className="flex items-center py-4 border-b border-gray-100 last:border-b-0"
                    onClick={() =>
                      toggleSelection(genre.id, selectedGenres, setSelectedGenres)
                    }
                  >
                    <div className="w-11 h-11 rounded-lg overflow-hidden bg-gray-50">
                      <img
                        src={genre.image}
                        alt={genre.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 ml-3">
                      <div className="flex items-center">
                        <span className="text-[15px] text-gray-900 font-medium">
                          {genre.name}
                        </span>
                        <span className="text-[13px] text-gray-500 ml-1">
                          {genre.count}
                        </span>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-sm border ${selectedGenres.includes(genre.id)
                        ? "bg-emerald-500 border-emerald-500"
                        : "border-gray-200"
                        } flex items-center justify-center`}
                    >
                      {selectedGenres.includes(genre.id) && (
                        <Check className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Validate Button - Fixed at bottom */}
            <div className="flex-shrink-0 px-4 py-4 border-t border-gray-100 md:mb-0 mb-20">
              <button
                onClick={() => setShowGenreSelect(false)}
                className="w-full py-3 bg-emerald-500 text-white font-medium rounded-xl"
              >
                Valider
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Taille Selection Screen */}
      {showTailleSelect && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center md:pb-10">
          <div className="fixed md:relative inset-0 md:inset-auto bg-white z-50 md:top-[25px] top-[0px] md:bottom-[80px] bottom-[0px] md:w-[500px] w-[100vw] md:animate-slide-up animate-slide-left md:rounded-xl rounded-none flex flex-col h-full">
            {/* Header */}
            <div className="flex-shrink-0 px-4 py-4 flex items-center border-b border-gray-100 relative">
              <button onClick={() => setShowTailleSelect(false)} className="p-2">
                <ChevronLeft className="h-5 w-5 text-gray-900" />
              </button>
              <h2 className="text-[17px] font-medium absolute left-1/2 transform -translate-x-1/2">
                Taille
              </h2>
            </div>

            {/* Taille Options - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              {tailleOptions.map((taille) => (
                <div
                  key={taille.id}
                  className="flex items-center py-4 border-b border-gray-100 last:border-b-0 mx-4"
                  onClick={() => toggleSelection(taille.id, selectedTailles, setSelectedTailles)}
                >
                  <div className="flex-1 px-4">
                    <div className="flex items-center">
                      <span className="text-[20px] text-gray-900">
                        {taille.name}
                      </span>
                      <span className="text-[13px] text-gray-500 ml-1">
                        ({taille.count})
                      </span>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-sm border ${selectedTailles.includes(taille.id)
                      ? "bg-emerald-500 border-emerald-500"
                      : "border-gray-200"
                      } flex items-center justify-center`}
                  >
                    {selectedTailles.includes(taille.id) && (
                      <Check className="w-4 h-4 text-white" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Validate Button */}
            <div className="flex-shrink-0 px-4 py-4 border-t border-gray-100 md:mb-0 mb-20">
              <button
                onClick={() => setShowTailleSelect(false)}
                className="w-full py-3 bg-emerald-500 text-white font-medium rounded-xl"
              >
                Valider
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Marque Selection Screen */}
      {showMarqueSelect && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center md:pb-10">
          <div className="fixed md:relative inset-0 md:inset-auto bg-white z-50 md:top-[25px] top-[0px] md:bottom-[80px] bottom-[0px] md:w-[500px] w-[100vw] md:animate-slide-up animate-slide-left md:rounded-xl rounded-none flex flex-col h-full">
            {/* Header */}
            <div className="flex-shrink-0 px-4 py-4 flex items-center border-b border-gray-100 relative">
              <button onClick={() => setShowMarqueSelect(false)} className="p-2">
                <ChevronLeft className="h-5 w-5 text-gray-900" />
              </button>
              <h2 className="text-[17px] font-medium absolute left-1/2 transform -translate-x-1/2">
                Marque
              </h2>
            </div>

            {/* Marque Options - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-4">
                {marqueOptions.map((marque) => (
                  <div
                    key={marque}
                    className="flex items-center py-3.5 border-b border-gray-100 last:border-b-0"
                    onClick={() =>
                      toggleSelection(marque, selectedMarques, setSelectedMarques)
                    }
                  >
                    <span className="flex-1 text-[15px] font-medium text-gray-900">
                      {marque}
                    </span>
                    <div
                      className={`w-5 h-5 rounded-sm border ${selectedMarques.includes(marque)
                        ? "bg-emerald-500 border-emerald-500"
                        : "border-gray-200"
                        } flex items-center justify-center`}
                    >
                      {selectedMarques.includes(marque) && (
                        <Check className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Validate Button - Fixed at bottom */}
            <div className="flex-shrink-0 px-4 py-4 border-t border-gray-100 md:mb-0 mb-20">
              <button
                onClick={() => setShowMarqueSelect(false)}
                className="w-full py-3 bg-emerald-500 text-white font-medium rounded-xl"
              >
                Valider
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Couleurs Selection Screen */}
      {showCouleursSelect && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center md:pb-10">
          <div className="fixed md:relative inset-0 md:inset-auto bg-white z-50 md:top-[25px] top-[0px] md:bottom-[80px] bottom-[0px] md:w-[500px] w-[100vw] md:animate-slide-up animate-slide-left md:rounded-xl rounded-none flex flex-col h-full">
            {/* Header */}
            <div className="flex-shrink-0 px-4 py-4 flex items-center border-b border-gray-100 relative">
              <button
                onClick={() => setShowCouleursSelect(false)}
                className="p-2 -ml-2"
              >
                <ChevronLeft className="h-5 w-5 text-gray-900" />
              </button>
              <h2 className="text-[17px] font-medium absolute left-1/2 transform -translate-x-1/2">
                Couleurs
              </h2>
            </div>

            {/* Color Options */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-4">
                {colorOptions.map((color) => (
                  <div
                    key={color.id}
                    className="flex items-center py-4 border-b border-gray-100 last:border-b-0"
                    onClick={() =>
                      toggleSelection(
                        color.id,
                        selectedCouleurs,
                        setSelectedCouleurs
                      )
                    }
                  >
                    <div className="flex items-center flex-1">
                      <div
                        className="w-6 h-6 rounded-full border border-gray-200 mr-3"
                        style={{
                          backgroundColor: color.color,
                          boxShadow:
                            color.id === "blanc"
                              ? "inset 0 0 0 1px #E5E7EB"
                              : "none",
                        }}
                      />
                      <span className="text-[15px] text-gray-900">
                        {color.name}
                      </span>
                      <span className="text-[13px] text-gray-500 ml-1">
                        ({color.count})
                      </span>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-sm border ${selectedCouleurs.includes(color.id)
                        ? "bg-emerald-500 border-emerald-500"
                        : "border-gray-200"
                        } flex items-center justify-center`}
                    >
                      {selectedCouleurs.includes(color.id) && (
                        <Check className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Validate Button */}
            <div className="flex-shrink-0 px-4 py-4 border-t border-gray-100 md:mb-0 mb-0">
              <button
                onClick={() => setShowCouleursSelect(false)}
                className="w-full py-3 bg-emerald-500 text-white font-medium rounded-xl"
              >
                Valider
              </button>
            </div></div>
        </div>
      )}

      {/* État Selection Screen */}
      {showEtatSelect && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center md:pb-10">
          <div className="fixed md:relative inset-0 md:inset-auto bg-white z-50 md:top-[25px] top-[0px] md:bottom-[80px] bottom-[0px] md:w-[500px] w-[100vw] md:animate-slide-up animate-slide-left md:rounded-xl rounded-none flex flex-col h-full">
            {/* Header */}
            <div className="px-4 py-4 flex items-center border-b border-gray-100 relative">
              <button onClick={() => setShowEtatSelect(false)} className="p-2">
                <ChevronLeft className="h-5 w-5 text-gray-900" />
              </button>
              <h2 className="text-[17px] font-medium absolute left-1/2 transform -translate-x-1/2">
                État
              </h2>
            </div>

            {/* État Options */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-4">
                {etatOptions.map((etat) => (
                  <div
                    key={etat.id}
                    className="flex items-center py-4 border-b border-gray-100 last:border-b-0"
                    onClick={() =>
                      toggleSelection(etat.id, selectedEtats, setSelectedEtats)
                    }
                  >
                    <div className="flex-1">
                      <div className="text-[15px] text-gray-900">{etat.name}</div>
                      <div className="text-[13px] text-gray-500 mt-1 leading-tight">
                        {etat.description}
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-sm border ${selectedEtats.includes(etat.id)
                        ? "bg-emerald-500 border-emerald-500"
                        : "border-gray-200"
                        } flex items-center justify-center`}
                    >
                      {selectedEtats.includes(etat.id) && (
                        <Check className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Validate Button */}
            <div className="flex-shrink-0 px-4 py-4 border-t border-gray-100 md:mb-0 mb-0">
              <button
                onClick={() => setShowCouleursSelect(false)}
                className="w-full py-3 bg-emerald-500 text-white font-medium rounded-xl"
              >
                Valider
              </button>
            </div></div>
        </div>
      )}

      {/* Vendeur Selection Screen */}
      {showVendeurSelect && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center md:pb-10">
          <div className="fixed md:relative inset-0 md:inset-auto bg-white z-50 md:top-[25px] top-[0px] md:bottom-[80px] bottom-[0px] md:w-[500px] w-[100vw] md:animate-slide-up animate-slide-left md:rounded-xl rounded-none flex flex-col h-full">
            {/* Header */}
            <div className="px-4 py-4 flex items-center border-b border-gray-100 relative">
              <button
                onClick={() => setShowVendeurSelect(false)}
                className="p-2"
              >
                <ChevronLeft className="h-5 w-5 text-gray-900" />
              </button>
              <h2 className="text-[17px] font-medium absolute left-1/2 transform -translate-x-1/2">
                Vendeur
              </h2>
            </div>

            {/* Vendeur Options */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-4">
                {vendeurOptions.map((vendeur) => (
                  <div
                    key={vendeur.id}
                    className="flex items-center py-4 border-b border-gray-100 last:border-b-0"
                    onClick={() =>
                      toggleSelection(
                        vendeur.id,
                        selectedVendeurs,
                        setSelectedVendeurs
                      )
                    }
                  >
                    <span className="flex-1 text-[15px] text-gray-900">
                      {vendeur.name}
                    </span>
                    <div
                      className={`w-5 h-5 rounded-sm border ${selectedVendeurs.includes(vendeur.id)
                        ? "bg-emerald-500 border-emerald-500"
                        : "border-gray-200"
                        } flex items-center justify-center`}
                    >
                      {selectedVendeurs.includes(vendeur.id) && (
                        <Check className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Validate Button */}
            <div className="flex-shrink-0 px-4 py-4 border-t border-gray-100 md:mb-0 mb-20">
              <button
                onClick={() => setShowTailleSelect(false)}
                className="w-full py-3 bg-emerald-500 text-white font-medium rounded-xl"
              >
                Valider
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Univers Selection Screen */}
      {showUniversSelect && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center md:pb-10">
          <div className="fixed md:relative inset-0 md:inset-auto bg-white z-50 md:top-[25px] top-[0px] md:bottom-[80px] bottom-[0px] md:w-[500px] w-[100vw] md:animate-slide-up animate-slide-left md:rounded-xl rounded-none flex flex-col h-full">
            {/* Header */}
            <div className="px-4 py-4 flex items-center border-b border-gray-100 relative">
              <button
                onClick={() => setShowUniversSelect(false)}
                className="p-2"
              >
                <ChevronLeft className="h-5 w-5 text-gray-900" />
              </button>
              <h2 className="text-[17px] font-medium absolute left-1/2 transform -translate-x-1/2">
                Univers
              </h2>
            </div>

            {/* Univers Options */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-4">
                {universOptions.map((univers) => (
                  <div
                    key={univers.id}
                    className="flex items-center py-4 border-b border-gray-100 last:border-b-0 px-4"
                    onClick={() =>
                      toggleSelection(
                        univers.id,
                        selectedUnivers,
                        setSelectedUnivers
                      )
                    }
                  >
                    <div className="w-11 h-11 rounded-lg overflow-hidden bg-gray-50">
                      <img
                        src={univers.image}
                        alt={univers.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="flex-1 text-[15px] text-gray-900 ml-3">
                      {univers.name}
                    </span>
                    <div
                      className={`w-5 h-5 rounded-sm border ${selectedUnivers.includes(univers.id)
                        ? "bg-emerald-500 border-emerald-500"
                        : "border-gray-200"
                        } flex items-center justify-center`}
                    >
                      {selectedUnivers.includes(univers.id) && (
                        <Check className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Validate Button */}
            <div className="flex-shrink-0 px-4 py-4 border-t border-gray-100 md:mb-0 mb-20">
              <button
                onClick={() => setShowTailleSelect(false)}
                className="w-full py-3 bg-emerald-500 text-white font-medium rounded-xl"
              >
                Valider
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prix Selection Screen */}
      {showPrixSelect && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center md:pb-10">
          <div className="fixed md:relative inset-0 md:inset-auto bg-white z-50 md:top-[25px] top-[0px] md:bottom-[80px] bottom-[0px] md:w-[500px] w-[100vw] md:animate-slide-up animate-slide-left md:rounded-xl rounded-none flex flex-col h-full">
            {/* Header */}
            <div className="px-4 py-4 flex items-center border-b border-gray-100 relative">
              <button
                onClick={() => setShowPrixSelect(false)}
                className="p-2"
              >
                <ChevronLeft className="h-5 w-5 text-gray-900" />
              </button>
              <h2 className="text-[17px] font-medium absolute left-1/2 transform -translate-x-1/2">
                Prix
              </h2>
            </div>

            {/* Prix Options */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-4 pt-4">
                <div className="flex gap-4">
                  {/* Min Price */}
                  <div className="flex-1">
                    <label className="block text-[13px] text-gray-900 mb-2">
                      Prix minimum
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[15px] focus:outline-none focus:border-gray-400"
                        placeholder="2"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col">
                        <button
                          onClick={() => setMinPrice(String(Number(minPrice) + 1))}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setMinPrice(String(Math.max(0, Number(minPrice) - 1)))}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Max Price */}
                  <div className="flex-1">
                    <label className="block text-[13px] text-gray-900 mb-2">
                      Prix maximum
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[15px] focus:outline-none focus:border-gray-400"
                        placeholder="Prix maximum"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col">
                        <button
                          onClick={() => setMaxPrice(String(Number(maxPrice) + 1))}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setMaxPrice(String(Math.max(0, Number(maxPrice) - 1)))}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Validate Button */}
            <div className="flex-shrink-0 px-4 py-4 border-t border-gray-100 md:mb-0 mb-20">
              <button
                onClick={() => setShowTailleSelect(false)}
                className="w-full py-3 bg-emerald-500 text-white font-medium rounded-xl"
              >
                Valider
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sort By Selection Screen */}
      {showSortBySelect && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center md:pb-10">
          <div className="fixed md:relative inset-0 md:inset-auto bg-white z-50 md:top-[25px] top-[0px] md:bottom-[80px] bottom-[0px] md:w-[500px] w-[100vw] md:animate-slide-up animate-slide-left md:rounded-xl rounded-none flex flex-col h-full">
            {/* Header */}
            <div className="px-4 py-4 flex items-center border-b border-gray-100 relative">
              <button
                onClick={() => setShowSortBySelect(false)}
                className="p-2 absolute right-2  bg-white rounded-full shadow-lg"
              >
                <X className="h-5 w-5 text-gray-900" />
              </button>
              <h2 className="text-[17px] font-medium text-center flex-1">
                Classer par
              </h2>
            </div>

            {/* Sort Options */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-4">
                {sortByOptions.map((option) => (
                  <div
                    key={option.id}
                    className="flex items-center py-4 border-b border-gray-100 last:border-b-0"
                    onClick={() => {
                      setSelectedSort(option.id);
                      setShowSortBySelect(false);
                    }}
                  >
                    <span className="flex-1 text-[15px] text-gray-900">
                      {option.name}
                    </span>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedSort === option.id
                      ? 'border-emerald-500'
                      : 'border-gray-200'
                      }`}>
                      {selectedSort === option.id && (
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {/* Validate Button */}
              <div className="flex-shrink-0 px-4 py-4 border-t border-gray-100 md:mb-0 mb-20">
                <button
                  onClick={() => setShowTailleSelect(false)}
                  className="w-full py-3 bg-emerald-500 text-white font-medium rounded-xl"
                >
                  Valider
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    
    </div>
  );
};

export default ProductList;
