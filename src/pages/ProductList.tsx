import React, { useEffect, useState, useRef } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
  ChevronLeft,
  AlertCircle,
  ShoppingBag,
  Search,
  ChevronRight,
  Heart,
  PlusCircle,
  Trash2,
  Edit,
  ChevronDown,
  X,
  RefreshCw,
  Filter
} from "lucide-react";
import { API_URL } from "../config";
import { useTranslation } from 'react-i18next';
const formatImageUrl = (imageUrl: string | undefined | null): string => {
  if (!imageUrl || imageUrl.trim() === '') {
    return 'https://via.placeholder.com/64';
  }

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
  isNew?: boolean;
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
  const { t } = useTranslation();
  
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
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
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
  const [showProductListingScreen, setShowProductListingScreen] = useState(
    location.state?.showProductListingScreen || false
  );

  // Add state for categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesError, setCategoriesError] = useState('');

  const [currentSubcategories, setCurrentSubcategories] = useState<Category[]>([]);

  // Add state for actual products from API
  const [apiProducts, setApiProducts] = useState<ApiProduct[]>([]);
  const [productsError, setProductsError] = useState('');

  // Add state for wishlist
  const [wishlistData, setWishlistData] = useState<WishlistResponse | null>(null);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const [wishlistError, setWishlistError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [wishlistCount, setWishlistCount] = useState<number>(0);

  // Add this near other state declarations
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Category[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Add this with the other refs and state declarations
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Add state for category products
  const [categoryProducts, setCategoryProducts] = useState<ApiProduct[]>([]);
  const [isCategoryProductsLoading, setIsCategoryProductsLoading] = useState(false);
  const [categoryProductsError, setCategoryProductsError] = useState('');

  // Add state for product search results
  const [productSearchResults, setProductSearchResults] = useState<ApiProduct[]>([]);
  const [isProductSearchLoading, setIsProductSearchLoading] = useState(false);
  const [productSearchError, setProductSearchError] = useState('');

  // Add these state variables to your component
  const [showFilters, setShowFilters] = useState(false);
  const [brands, setBrands] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [versions, setVersions] = useState<any[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [isFilterLoading, setIsFilterLoading] = useState(false);

  // Add state to store category hierarchy information
  const [categoryHierarchy, setCategoryHierarchy] = useState<any[]>([]);

  // Add this function to handle navigation back to search page
  const navigateToSearch = () => {
    if (searchQuery) {
      // Encode the search query and navigate to search page
      navigate(`/search?search=${encodeURIComponent(searchQuery)}`);
      
      // Also save the search query to localStorage for persistence
      const savedSearches = localStorage.getItem('recentSearches');
      let searches: string[] = [];
      
      if (savedSearches) {
        try {
          searches = JSON.parse(savedSearches);
        } catch (e) {
          console.error('Error parsing saved searches:', e);
        }
      }
      
      // Add the current search at the beginning and remove duplicates
      searches = [searchQuery, ...searches.filter(s => s !== searchQuery)].slice(0, 5);
      
      // Save back to localStorage
      localStorage.setItem('recentSearches', JSON.stringify(searches));
    } else {
      navigate('/search');
    }
  };

  // Update the URL parameter handling useEffect
  useEffect(() => {
    // Check for categoryId parameter from the Categories page
    const searchParams = new URLSearchParams(location.search);
    const pathParts = location.pathname.split('/category/')[1]?.split('/') || [];
    const categoryId = searchParams.get('categoryId') || pathParts[0];
    const itemId = pathParts[1]; // Extract item ID from URL if present
    
    console.log("Path parsing:", { pathname: location.pathname, pathParts, categoryId, itemId });

    // Check for search parameter
    const searchParam = searchParams.get('search');
    if (searchParam) {
      console.log("Found search parameter:", searchParam);
      setSearchQuery(searchParam);
      setIsSearching(true);
      setShowProductListingScreen(true);
      setSelectedItemView({ id: 'search', name: `Search: "${searchParam}"` });
      
      // Trigger the search immediately
      searchCategories(searchParam);
      return; // Exit early as search takes precedence
    }

    // Check for filter parameters in the URL
    const brandParam = searchParams.get('brandId');
    const modelParam = searchParams.get('modelId');
    const versionParam = searchParams.get('versionId');
    const minPriceParam = searchParams.get('minPrice');
    const maxPriceParam = searchParams.get('maxPrice');

    let shouldApplyFilters = false;

    // If we have a categoryId from the URL, fetch products for that category
    if (categoryId) {
      console.log("Found categoryId in URL:", categoryId);

      // Find the category details to set the selected category
      const findCategory = async () => {
        // Try to find the category in our existing categories list
        const category = findCategoryById(categories, categoryId);

        if (category) {
          setSelectedCategory({ id: category._id, name: category.name });
          
          // If we have an itemId, we're looking at a specific subcategory item
          if (itemId) {
            console.log("Found itemId in URL:", itemId);
            setSelectedItemView({ 
              id: categoryId + '/' + itemId, 
              name: itemId // Use the item name as the view name
            });
          } else {
            setSelectedItemView({ id: category._id, name: category.name });
          }

          // Check if the category has subcategories
          if (category.subcategories && category.subcategories.length > 0) {
            setCurrentSubcategories(category.subcategories);
          }
        } else {
          // If not found, we might need to fetch the category details
          try {
            const response = await fetch(`${API_URL}/api/categories/${categoryId}`);
            if (response.ok) {
              const categoryData = await response.json();
              setSelectedCategory({ id: categoryData._id, name: categoryData.name });
              
              // If we have an itemId, we're looking at a specific subcategory item
              if (itemId) {
                console.log("Found itemId in URL:", itemId);
                setSelectedItemView({ 
                  id: categoryId + '/' + itemId, 
                  name: itemId // Use the item name as the view name
                });
              } else {
                setSelectedItemView({ id: categoryData._id, name: categoryData.name });
              }

              // Set subcategories if available
              if (categoryData.subcategories && categoryData.subcategories.length > 0) {
                setCurrentSubcategories(categoryData.subcategories);
              }
            }
          } catch (error) {
            console.error("Error fetching category details:", error);
          }
        }
      };

      // Find and set the category, then fetch its products
      findCategory().then(() => {
        if (itemId) {
          // If we have an itemId, we should filter products by both category and item
          console.log("Fetching products for category and item:", categoryId, itemId);
          // You could add a more specific API endpoint for this, but for now we'll fetch by category
          // and filter in the frontend
          fetchProductsByCategory(categoryId, itemId);
        } else {
          fetchProductsByCategory(categoryId);
        }
        setShowProductListingScreen(true);
      });
    }

    // If we have any filter parameters, set them and show the product listing
    if (brandParam || modelParam || versionParam || minPriceParam || maxPriceParam) {
      console.log("Found filter parameters in URL:", {
        brandParam, modelParam, versionParam, minPriceParam, maxPriceParam
      });

      // Set filter states
      if (brandParam) {
        setSelectedBrand(brandParam);
        shouldApplyFilters = true;
      }

      if (modelParam) {
        setSelectedModel(modelParam);
        shouldApplyFilters = true;
      }

      if (versionParam) {
        setSelectedVersion(versionParam);
        shouldApplyFilters = true;
      }

      if (minPriceParam) {
        setMinPrice(minPriceParam);
        shouldApplyFilters = true;
      }

      if (maxPriceParam) {
        setMaxPrice(maxPriceParam);
        shouldApplyFilters = true;
      }

      // Set search results view
      setShowProductListingScreen(true);
      setSelectedItemView({ id: 'search', name: 'Search Results' });
    }

    // Also check for showProductListingScreen in state
    if (location.state && 'showProductListingScreen' in location.state) {
      setShowProductListingScreen(true);
      if (!selectedItemView) {
        setSelectedItemView({ id: 'search', name: 'Search Results' });
      }
    }

    // Apply filters after a short delay to ensure states are updated
    if (shouldApplyFilters) {
      const timer = setTimeout(() => {
        console.log("Auto-applying filters from URL parameters");
        applyFilters();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [location.search, location.pathname, location.state, categories]);

  // Add a function to fetch just the wishlist count
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

      const categoriesWithNew = data.map((cat: Category) => {
        if (cat.name.includes('VÉLO') || cat.name.includes('VOL')) {
          return { ...cat, isNew: true };
        }
        return cat;
      });

      setCategories(categoriesWithNew);
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

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (location.state?.showProductListingScreen) {
      setSelectedCategory(null);
      setSelectedSubcategory(null);
      setSelectedItemView({ id: 'search', name: 'Search Results' });
    }
  }, [location.state]);

  // Update fetchProductsByCategory to handle item filtering
  const fetchProductsByCategory = async (categoryId: string, itemId?: string) => {
    try {
      setIsCategoryProductsLoading(true);
      setCategoryProductsError('');

      const response = await fetch(`${API_URL}/api/products/category/${categoryId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }

      const data = await response.json();
      console.log("Category products data:", data);

      if (data.success) {
        let filteredProducts: ApiProduct[] = data.products;
        
        // If itemId is provided, filter products by that item name
        if (itemId && filteredProducts.length > 0) {
          console.log("Filtering products by item:", decodeURIComponent(itemId));
          const decodedItemId = decodeURIComponent(itemId);
          
          // Filter products that match the item in compatibility
          filteredProducts = filteredProducts.filter((product) => {
            // Check if product has compatibility data
            if (product.compatibility && product.compatibility.length > 0) {
              // Check if any compatibility entry includes this item
              return product.compatibility.some((comp) => {
                return comp.make === decodedItemId || 
                       comp.model === decodedItemId || 
                       comp.year?.toString() === decodedItemId;
              });
            }
            // If filtering by title or description as fallback
            return product.title.toLowerCase().includes(decodedItemId.toLowerCase()) || 
                   (product.description && product.description.toLowerCase().includes(decodedItemId.toLowerCase()));
          });
          
          console.log(`Filtered to ${filteredProducts.length} products matching "${decodedItemId}"`);
        }
        
        // Set the filtered products
        setCategoryProducts(filteredProducts);

        // Update the selected category and item view with the proper name
        if (data.category) {
          setSelectedCategory({ id: data.category._id, name: data.category.name });
          
          if (itemId) {
            // If we have an itemId, use that for the view name
            setSelectedItemView({ 
              id: data.category._id + '/' + itemId, 
              name: decodeURIComponent(itemId) // Use the decoded item name
            });
          } else {
            setSelectedItemView({ id: data.category._id, name: data.category.name });
          }

          // Store the category hierarchy if available
          if (data.category.hierarchy) {
            setCategoryHierarchy(data.category.hierarchy);
          }

          // If there are subcategories, update the currentSubcategories
          if (data.subcategories && data.subcategories.length > 0) {
            setCurrentSubcategories(data.subcategories);
          }
        }

        // Ensure we're showing the product listing screen
        setShowProductListingScreen(true);
      } else {
        setCategoryProductsError(data.message || 'Failed to load products');
        setCategoryProducts([]);
      }
    } catch (error) {
      console.error('Error fetching category products:', error);
      setCategoryProductsError(error instanceof Error ? error.message : 'Failed to load products');
      setCategoryProducts([]);
    } finally {
      setIsCategoryProductsLoading(false);
    }
  };

  // Update handleCategoryClick to fetch products when a category is selected
  const handleCategoryClick = (category: { id: string; name: string }) => {
    setSelectedCategory(category);
    const fullCategory = findCategoryById(categories, category.id);

    if (fullCategory && fullCategory.subcategories && fullCategory.subcategories.length > 0) {
      console.log("Found subcategories:", fullCategory.subcategories);
      setCurrentSubcategories(fullCategory.subcategories);
      setSelectedItemView(null);
      setShowProductListingScreen(false);
    } else {
      console.log("No subcategories found for category:", category);
      setCurrentSubcategories([]);
      setSelectedItemView(category);
      setShowProductListingScreen(true);
      fetchProductsByCategory(category.id); // Fetch products for this category
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

  // Update handleSubcategoryClick to fetch products when a subcategory is selected
  const handleSubcategoryClick = (subcategory: Category) => {
    if (subcategory.subcategories && subcategory.subcategories.length > 0) {
      console.log("Setting subcategories:", subcategory.subcategories);
      setCurrentSubcategories(subcategory.subcategories);
      setSelectedCategory({ id: subcategory._id, name: subcategory.name });
      setSelectedItemView(null);
      setShowProductListingScreen(false);
    } else {
      setSelectedCategory({ id: subcategory._id, name: subcategory.name });
      setSelectedItemView({ id: subcategory._id, name: subcategory.name });
      setShowProductListingScreen(true);
      fetchProductsByCategory(subcategory._id); // Fetch products for this subcategory
    }
  };

  console.log("Current state:", {
    selectedItemView,
    showProductListingScreen,
    selectedCategory,
    selectedSubcategory,
    currentSubcategories: currentSubcategories.length
  });

  // Close search input when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearching(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  // Add useEffect to fetch wishlist on component mount
  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchWishlist();
    fetchWishlistCount();
  }, []);

  // Replace the fetchWishlist function with this updated version
  const fetchWishlist = async () => {

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

      if (!data || !data.success || !data.data) {
        throw new Error('Invalid wishlist data format');
      }

      setWishlistData(data);

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

  const toggleWishlistItem = async (productId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!localStorage.getItem('accessToken')) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    try {
      setIsAddingToWishlist(true);
      const isInWishlist = wishlistIds.includes(productId);
      console.log(`${isInWishlist ? 'Removing from' : 'Adding to'} wishlist:`, productId);

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


      if (isInWishlist) {
        setWishlistIds(prev => prev.filter(id => id !== productId));
        setWishlistCount(prev => Math.max(0, prev - 1));
      } else {
        setWishlistIds(prev => [...prev, productId]);
        setWishlistCount(prev => prev + 1);
      }

      await fetchWishlist();


      await fetchWishlistCount();

    } catch (error) {
      console.error('Error updating wishlist:', error);

      await fetchWishlist();
      await fetchWishlistCount();
    } finally {
      setIsAddingToWishlist(false);
    }
  };

  // Update the searchCategories function to also search products
  const searchCategories = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setProductSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      setIsSearchLoading(true);
      setIsProductSearchLoading(true);
      setSearchError('');
      setProductSearchError('');
      
      console.log("Searching for products and categories with query:", query);

      // Search products - prioritize this since it's the main focus
      const productResponse = await fetch(`${API_URL}/api/products/search?query=${encodeURIComponent(query)}`);
      if (!productResponse.ok) {
        throw new Error(`Product search failed: ${productResponse.status}`);
      }
      const productData = await productResponse.json();
      console.log(`Found ${productData.length || 0} products matching "${query}"`);
      setProductSearchResults(productData);
      
      // After successful product search, ensure we're showing the product listing screen
      setShowProductListingScreen(true);
      
      // If we have a selectedItemView that's not a search view, update it
      if (!selectedItemView || selectedItemView.id !== 'search') {
        setSelectedItemView({ id: 'search', name: `Search: "${query}"` });
      }

      // Search categories as well for a complete search experience
      const categoryResponse = await fetch(`${API_URL}/api/categories/search?query=${encodeURIComponent(query)}`);
      if (!categoryResponse.ok) {
        throw new Error(`Category search failed: ${categoryResponse.status}`);
      }
      const categoryData = await categoryResponse.json();
      if (categoryData && categoryData.results) {
        console.log(`Found ${categoryData.results.length || 0} categories matching "${query}"`);
        setSearchResults(categoryData.results);
      } else {
        setSearchResults([]);
      }
      
    } catch (error) {
      console.error('Error searching:', error);
      setSearchError(error instanceof Error ? error.message : 'Search failed');
      setProductSearchError(error instanceof Error ? error.message : 'Search failed');
      setSearchResults([]);
      setProductSearchResults([]);
    } finally {
      setIsSearchLoading(false);
      setIsProductSearchLoading(false);
    }
  };

  // Add this function to build category path
  const buildCategoryPath = (categories: Category[], targetId: string): Category[] => {
    const findPathRecursive = (cats: Category[], id: string, path: Category[] = []): Category[] | null => {
      for (const cat of cats) {
        if (cat._id === id) {
          return [...path, cat];
        }

        if (cat.subcategories && cat.subcategories.length > 0) {
          const newPath = findPathRecursive(cat.subcategories, id, [...path, cat]);
          if (newPath) return newPath;
        }
      }
      return null;
    };

    return findPathRecursive(categories, targetId, []) || [];
  };

  // Update the renderBreadcrumb function to use the category hierarchy
  const renderBreadcrumb = () => {
    if (!selectedCategory) {
      return (
        <Link to="/categories" className="text-gray-500 text-sm hover:text-gray-700">
          {t('productList.breadcrumb.all')}
        </Link>
      );
    }

    // If we have a hierarchy from the API, use that for a more accurate breadcrumb
    if (categoryHierarchy && categoryHierarchy.length > 0) {
      return (
        <>
          <Link to="/categories" className="text-gray-500 text-sm hover:text-gray-700">
            {t('productList.breadcrumb.all')}
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-400" />

          {categoryHierarchy.map((cat, index) => {
            const isLast = index === categoryHierarchy.length - 1;
            return (
              <React.Fragment key={cat._id}>
                {!isLast ? (
                  <>
                    <Link
                      to={`/category/${cat._id}`}
                      className="text-gray-500 text-sm hover:text-gray-700"
                    >
                      {cat.name}
                    </Link>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </>
                ) : (
                  <span className="text-emerald-500 text-sm font-medium">
                    {cat.name}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </>
      );
    }

    // Fallback to the previous implementation if we don't have a hierarchy
    const targetId = selectedItemView ? selectedItemView.id : selectedCategory.id;
    const categoryPath = buildCategoryPath(categories, targetId);

    return (
      <>
        <Link to="/categories" className="text-gray-500 text-sm hover:text-gray-700">
          {t('productList.breadcrumb.all')}
        </Link>
        <ChevronRight className="w-4 h-4 text-gray-400" />

        {categoryPath.map((cat, index) => {
          const isLast = index === categoryPath.length - 1;
          return (
            <React.Fragment key={cat._id}>
              {!isLast ? (
                <>
                  <Link
                    to={`/category/${cat._id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleCategoryClick({
                        id: cat._id,
                        name: cat.name
                      });
                    }}
                    className="text-gray-500 text-sm hover:text-gray-700"
                  >
                    {cat.name}
                  </Link>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </>
              ) : (
                <span className="text-emerald-500 text-sm font-medium">
                  {cat.name}
                </span>
              )}
            </React.Fragment>
          );
        })}
      </>
    );
  };

  // Add these functions to fetch filter options
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await fetch(`${API_URL}/api/brands`);
        const data = await response.json();
        setBrands(data.brands || []);
      } catch (error) {
        console.error('Error fetching brands:', error);
      }
    };

    fetchBrands();
  }, []);

  useEffect(() => {
    const fetchModels = async () => {
      if (!selectedBrand) {
        setModels([]);
        return;
      }

      try {
        // Find the brand by name instead of ID
        const brand = brands.find(b => b.name === selectedBrand);
        if (brand && brand.models) {
          setModels(brand.models);
          console.log(`Found ${brand.models.length} models for brand ${selectedBrand}`);
        } else {
          console.log(`No models found for brand ${selectedBrand}`);
        }
      } catch (error) {
        console.error('Error fetching models:', error);
      }
    };

    fetchModels();
  }, [selectedBrand, brands]);

  useEffect(() => {
    const fetchVersions = async () => {
      if (!selectedModel) {
        setVersions([]);
        return;
      }

      try {
        const brand = brands.find(b => b.name === selectedBrand);
        if (brand) {
          const model = brand.models.find((m: any) => m.name === selectedModel);
          if (model && model.versions) {
            setVersions(model.versions);
            console.log(`Found ${model.versions.length} versions for model ${model.name}`);
          } else {
            console.log(`No versions found for model name ${selectedModel}`);
          }
        }
      } catch (error) {
        console.error('Error fetching versions:', error);
      }
    };

    fetchVersions();
  }, [selectedModel, selectedBrand, brands]);

  // Add function to apply filters
  const applyFilters = async () => {
    setIsFilterLoading(true);
    console.log("Applying filters with current state:", {
      brand: selectedBrand,
      model: selectedModel,
      version: selectedVersion,
      category: selectedCategory?.id,
      minPrice,
      maxPrice
    });

    // Build the API URL for fetching data
    let apiUrl = `${API_URL}/api/products/filter?`;

    // Build the browser URL for updating the address bar
    let browserUrl = '/products?';

    if (selectedBrand) {
      apiUrl += `brandId=${encodeURIComponent(selectedBrand)}&`;
      browserUrl += `brandId=${encodeURIComponent(selectedBrand)}&`;
      console.log(`Filtering by brand name: ${selectedBrand}`);
    }

    if (selectedModel) {
      apiUrl += `modelId=${encodeURIComponent(selectedModel)}&`;
      browserUrl += `modelId=${encodeURIComponent(selectedModel)}&`;
      console.log(`Filtering by model name: ${selectedModel}`);
    }

    if (selectedVersion) {
      apiUrl += `versionId=${encodeURIComponent(selectedVersion)}&`;
      browserUrl += `versionId=${encodeURIComponent(selectedVersion)}&`;
      console.log(`Filtering by version/year: ${selectedVersion}`);
    }

    if (selectedCategory) {
      apiUrl += `category=${selectedCategory.id}&`;
      browserUrl += `category=${encodeURIComponent(selectedCategory.id)}&`;
    }

    if (minPrice) {
      apiUrl += `minPrice=${minPrice}&`;
      browserUrl += `minPrice=${encodeURIComponent(minPrice)}&`;
    }

    if (maxPrice) {
      apiUrl += `maxPrice=${maxPrice}&`;
      browserUrl += `maxPrice=${encodeURIComponent(maxPrice)}&`;
    }

    // Remove trailing '&' if present
    if (apiUrl.endsWith('&')) apiUrl = apiUrl.slice(0, -1);
    if (browserUrl.endsWith('&')) browserUrl = browserUrl.slice(0, -1);

    console.log("Filter API URL:", apiUrl);

    // Update the browser URL without reloading the page
    window.history.replaceState(null, '', browserUrl);

    try {
      // Make sure we always show the product listing screen
      setShowProductListingScreen(true);

      // Set the selected item view to "Search Results" if it's not already set
      if (!selectedItemView || selectedItemView.id !== 'search') {
        setSelectedItemView({ id: 'search', name: 'Search Results' });
      }

      console.log("Making API request to:", apiUrl);
      const response = await fetch(apiUrl);
      const data = await response.json();
      console.log("Filter API response:", data);

      if (data.success) {
        console.log(`Setting ${data.data.length} products in category products`);
        setCategoryProducts(data.data);
      } else {
        console.error("API returned success: false", data);
        setCategoryProducts([]);
      }
    } catch (error) {
      console.error('Error applying filters:', error);
      setCategoryProducts([]);
    } finally {
      setIsFilterLoading(false);
      setShowFilters(false);
    }
  };

  // Add function to reset filters
  const resetFilters = () => {
    setSelectedBrand(null);
    setSelectedModel(null);
    setSelectedVersion(null);
    setMinPrice('');
    setMaxPrice('');

    // Reset to original products
    if (selectedCategory) {
      fetchProductsByCategory(selectedCategory.id);
    } else {
      setCategoryProducts([]);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="text-center py-10">
            <p className="text-gray-500">{t('productList.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {showProductListingScreen ? (
        // Product Listing Screen section
        <div className="md:pt-[90px] pt-[0px] pb-[60px] md:pb-0">
          <div className="max-w-7xl mx-auto">
            {/* Fixed Header */}
            <div className=" top-[0px] md:top-[90px] bg-white z-10 ">
              <div className="flex flex-col flex-shrink-0 md:mx-24">
                <div className="flex items-center px-2 py-3 border-b border-gray-100 md:hidden">
                  <button
                    onClick={() => {
                      if (selectedSubcategory) {
                        // Go back to subcategory list
                        setSelectedSubcategory(null);
                        setSelectedItemView(null);
                      } else if (selectedCategory) {
                        // Go back to main category list
                        setSelectedCategory(null);
                        setCurrentSubcategories([]);
                      }
                      setShowProductListingScreen(false);
                    }}
                    className="p-2 shadow-md bg-white border border-gray-100 rounded-full"
                  >
                    <ChevronLeft className="h-5 w-5 text-gray-900" />
                  </button>
                  <div className="flex-1 mx-2">
                    <div className="relative" ref={searchRef}>
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <div
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-100 cursor-text"
                        onClick={() => setIsSearching(true)}
                      >
                        {isSearching ? (
                          <input
                            type="text"
                            placeholder={t('productList.searchPlaceholder')}
                            className="w-full outline-none bg-transparent text-gray-900 text-sm"
                            autoFocus
                            value={searchQuery}
                            onChange={(e) => {
                              setSearchQuery(e.target.value);
                              // Debounce the search to avoid too many API calls
                              if (searchTimeoutRef.current) {
                                clearTimeout(searchTimeoutRef.current);
                              }
                              searchTimeoutRef.current = setTimeout(() => {
                                searchCategories(e.target.value);
                              }, 500);
                            }}
                          />
                        ) : (
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-900">{t('common.search')}</span>
                            <span className="text-xs text-gray-500">{t('common.searchPlaceholder')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Breadcrumb - Only visible on web */}
                <div className="hidden md:flex items-center space-x-2 mt-4 mr-10">
                  <button
                    onClick={() => {
                      if (selectedSubcategory) {
                        // Go back to subcategory list
                        setSelectedSubcategory(null);
                        setSelectedItemView(null);
                      } else if (selectedCategory) {
                        // Go back to main category list
                        setSelectedCategory(null);
                        setCurrentSubcategories([]);
                      }
                      setShowProductListingScreen(false);
                    }}
                    className="p-2 shadow-md bg-white border border-gray-100 rounded-full mr-4"
                  >
                    <ChevronLeft className="h-5 w-5 text-gray-900" />
                  </button>
                  {renderBreadcrumb()}
                </div>

                {/* Title and Description - Only visible on web */}
                <div className="hidden md:block mt-4 mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {selectedItemView ?
                      selectedItemView.name === "Search Results" && (selectedBrand || selectedModel || selectedVersion) ?
                        `${t('productList.filters.title')}${selectedBrand ? ` - ${selectedBrand}` : ''}${selectedModel ? ` ${selectedModel}` : ''}${selectedVersion ? ` (${selectedVersion})` : ''}`
                        : selectedItemView.name
                      : t('productList.title')}
                  </h1>
                  <p className="text-gray-500 text-sm mt-1">
                    {categoryProducts.length > 0
                      ? t('productList.results', { count: categoryProducts.length }) + (selectedBrand ? ` ${t('productList.filters.matching')} ${selectedBrand}` : '')
                      : selectedItemView
                        ? t('productList.noResultsMessage')
                        : t('productList.title')}
                  </p>
                </div>
                {/* Filter Button */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center px-4 py-2 bg-gray-100 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-200 mt-4 md:mt-0"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  {t('productList.filters.title')}
                </button>

                {/* Filter Panel */}
                {showFilters && (
                  <div className="bg-white rounded-lg shadow-lg p-6 mt-4">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="font-medium text-lg text-gray-800">{t('productList.filters.title')}</h3>
                      <button onClick={() => setShowFilters(false)} className="text-gray-500 hover:text-gray-700">
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    {/* Brand Filter */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <span className="mr-2">🔍</span> {t('productList.filters.brands')}
                      </label>
                      <select
                        value={selectedBrand || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          setSelectedBrand(value || null);
                          setSelectedModel(null);
                          setSelectedVersion(null);
                        }}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">{t('productList.selectCategory')}</option>
                        {brands.map((brand) => (
                          <option key={brand.id} value={brand.name}>
                            {brand.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Model Filter - Show only if brand is selected */}
                    {selectedBrand && (
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                          <span className="mr-2">🚗</span> {t('productAdd.model')}
                        </label>
                        <select
                          value={selectedModel || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            setSelectedModel(value || null);
                            setSelectedVersion(null);
                          }}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">{t('productAdd.selectModel')}</option>
                          {models.map((model) => (
                            <option key={model.id} value={model.name}>
                              {model.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Version Filter - Show only if model is selected */}
                    {selectedModel && (
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                          <span className="mr-2">📅</span> {t('productAdd.year')}
                        </label>
                        <select
                          value={selectedVersion || ''}
                          onChange={(e) => {
                            setSelectedVersion(e.target.value || null);
                          }}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">{t('productAdd.selectYear')}</option>
                          {versions.map((version) => (
                            <option key={version.id} value={version.name}>
                              {version.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Price Range */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <span className="mr-2">💰</span> {t('productList.filters.price')}
                      </label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="number"
                          placeholder={t('productList.priceRange.min')}
                          value={minPrice}
                          onChange={(e) => setMinPrice(e.target.value)}
                          className="w-1/2 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-gray-500">-</span>
                        <input
                          type="number"
                          placeholder={t('productList.priceRange.max')}
                          value={maxPrice}
                          onChange={(e) => setMaxPrice(e.target.value)}
                          className="w-1/2 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Filter Actions */}
                    <div className="flex justify-end space-x-3 mt-6">
                      <button
                        onClick={resetFilters}
                        className="px-5 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                      >
                        {t('productList.priceRange.reset')}
                      </button>
                      <button
                        onClick={applyFilters}
                        disabled={isFilterLoading}
                        className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        {isFilterLoading ? t('common.loading') : t('productList.filters.apply')}
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Product Grid - Updated to use category products when available */}
            <div className="md:mx-20">
              {/* Search Results Section */}
              {searchQuery && productSearchResults.length > 0 ? (
                <div className="px-4 py-4">
                  <h3 className="text-lg font-semibold mb-4">
                    {t('productList.results', { count: productSearchResults.length })} "{searchQuery}"
                    {isProductSearchLoading && <span className="ml-2 text-sm text-gray-500">{t('common.loading')}</span>}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    {productSearchResults.map((product) => (
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
                              {product.category?.name || t('common.category')}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              // Navigate to product detail with search query preserved
                              navigate(`/products/${product._id}?search=${encodeURIComponent(searchQuery)}`);
                            }}
                            className="w-full mt-3 py-2 text-sm text-secondary border border-secondary rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            {t('productList.viewDetails')}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : searchQuery && isProductSearchLoading ? (
                <div className="col-span-full text-center py-8">
                  <p>{t('productList.loading')} "{searchQuery}"...</p>
                </div>
              ) : searchQuery ? (
                <div className="col-span-full text-center py-8">
                  <p>{t('productList.noResults')} "{searchQuery}"</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 px-4 py-4">
                  {/* Show loading indicator or error message */}
                  {isSearching && searchQuery ? (
                    <div className="col-span-full text-center py-8">
                      <p>No products found for "{searchQuery}"</p>
                    </div>
                  ) : isCategoryProductsLoading || isLoading ? (
                    <div className="col-span-full text-center py-8">
                      <p>Loading products...</p>
                    </div>
                  ) : categoryProductsError || productsError ? (
                    <div className="col-span-full text-center py-8 text-red-500">
                      {categoryProductsError || productsError}
                    </div>
                  ) : (selectedItemView && categoryProducts.length > 0) ? (
                    // Show products for the selected category
                    categoryProducts.map((product) => (
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
                            onClick={() => {
                              // Navigate to product detail with search query preserved
                              navigate(`/products/${product._id}?search=${encodeURIComponent(searchQuery)}`);
                            }}
                            className="w-full mt-3 py-2 text-sm text-secondary border border-secondary rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            {t('productList.viewDetails')}
                          </button>
                        </div>
                      </div>
                    ))
                  ) : selectedItemView ? (
                    // No products found for this category
                    <div className="col-span-full flex flex-col items-center justify-center py-16 px-4 text-center">
                      <div className="bg-gray-100 rounded-full p-6 mb-6">
                        <ShoppingBag
                          className="text-gray-500"
                          size={64}
                          strokeWidth={1.5}
                        />
                      </div>
                      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                        {t('productList.noResults')}
                      </h2>

                      <p className="text-gray-600 mb-2">
                        {t('productList.noResultsMessage')}
                      </p>

                      <p className="text-gray-500 mb-6 max-w-md">
                        {t('productList.suggestions.clearFilters')}
                      </p>

                      <button
                        onClick={() => window.location.href = "/categories"}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                      >
                        <RefreshCw size={16} />
                        {t('productList.filters.clear')}
                      </button>

                    </div>
                  ) : (
                    // Show all products when no category is selected
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
                            onClick={() => {
                              // Navigate to product detail with search query preserved
                              navigate(`/products/${product._id}?search=${encodeURIComponent(searchQuery)}`);
                            }}
                            className="w-full mt-3 py-2 text-sm text-secondary border border-secondary rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            {t('productList.viewDetails')}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          {!selectedCategory ? (
            <>
              {/* Fixed Header */}
              <div className="fixed md:top-[140px] top-0 left-0 right-0 bg-white md:z-40 border-b border-gray-100">
                {/* Search Bar Container */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:w-1/2 md:mx-24">
                  <div ref={searchRef} className="relative">
                    <div
                      className="flex items-center w-full px-4 py-2 bg-white rounded-full shadow-sm border border-gray-100"
                      onClick={() => navigateToSearch()}
                    >
                      <Search className="h-5 w-5 text-black flex-shrink-0" />
                      <div className="ml-3 flex-1">
                        <div className="text-[15px] text-black">Seek</div>
                        <div className="text-[13px] text-gray-400">Clothes, shoes...</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className={`md:pt-[150px] pt-[105px] pb-6`}>
                <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 md:mx-0">
                  <div className="space-y-4">
                    {isLoading || isSearchLoading ? (
                      <div className="text-center py-8">Loading...</div>
                    ) : searchError || categoriesError ? (
                      <div className="text-center py-8 text-red-500">{searchError || categoriesError}</div>
                    ) : searchQuery && (searchResults.length > 0 || productSearchResults.length > 0) ? (
                      <>
                        <div className="text-sm text-gray-500 mb-4 px-4">
                          Found {searchResults.length + productSearchResults.length} results for "{searchQuery}"
                        </div>

                        {/* Categories Section */}
                        {searchResults.length > 0 && (
                          <>
                            <div className="text-sm font-medium text-gray-700 mb-2 px-4">Categories</div>
                            {searchResults.map((category) => (
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
                                {category.subcategories && category.subcategories.length > 0 ? (
                                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mr-2" />
                                ) : (
                                  <div className="w-5 mr-2"></div>
                                )}
                              </button>
                            ))}
                          </>
                        )}

                        {/* Products Section */}
                        {productSearchResults.length > 0 && (
                          <>
                            <div className="text-sm font-medium text-gray-700 mb-2 px-4">Products</div>
                            {productSearchResults.map((product) => (
                              <button
                                key={product._id}
                                onClick={() => {
                                  // Navigate to product detail with search query preserved
                                  navigate(`/products/${product._id}?search=${encodeURIComponent(searchQuery)}`);
                                }}
                                className="flex items-center w-full px-4 py-4 hover:bg-gray-50 rounded-xl transition-colors"
                              >
                                <div className="w-12 h-12 flex-shrink-0">
                                  <img
                                    src={formatImageUrl(product.images[0])}
                                    alt={product.title}
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/48';
                                    }}
                                  />
                                </div>
                                <div className="flex-1 text-left ml-4">
                                  <div className="text-[15px] text-gray-900 font-medium line-clamp-1">
                                    {product.title}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    €{product.price.toFixed(2)}
                                  </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mr-2" />
                              </button>
                            ))}
                          </>
                        )}
                      </>
                    ) : searchQuery ? (
                      <div className="text-center py-8 text-gray-500">
                        No results found for "{searchQuery}"
                      </div>
                    ) : (
                      // Show regular categories when not searching
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
                </div>
              </div>
            </>
          ) : !selectedSubcategory && !selectedItemView ? (

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
                        <div 
                          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-gray-100 cursor-pointer"
                          onClick={() => navigateToSearch()}
                        >
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
                        <div 
                          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-gray-100 cursor-pointer"
                          onClick={() => navigateToSearch()}
                        >
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
    </div>
  );
};

export default ProductList;
