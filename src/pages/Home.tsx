import React, { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Star, ChevronLeft, ChevronRight, Package } from "lucide-react";
import HeroCarousel from "../components/ui/HeroCarousel";
import TopCategories from "../components/TopCategories";
import { API_URL } from "../config";
import { formatImageUrl } from "../lib/utils";
import { useTranslation } from "react-i18next";

// Define interfaces with optional properties to prevent type errors
interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  oemNumber?: string;
  rating?: number;
  category?: {
    _id?: string;
    name?: string;
  };
}

interface Category {
  _id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
}

const Home = () => {
  const { t } = useTranslation();
  const categoriesScrollRef = useRef<HTMLDivElement>(null);
  const featuredProductsRef = useRef<HTMLDivElement>(null);
  const popularProductsRef = useRef<HTMLDivElement>(null);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryProducts, setCategoryProducts] = useState<{[key: string]: Product[]}>({});
  const [loading, setLoading] = useState(false);
  const [featuredLoading, setFeaturedLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a map of refs for category products
  const categoryRefs = useRef<{[key: string]: React.RefObject<HTMLDivElement>}>({});

  useEffect(() => {
    const fetchPopularProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/products`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch products: ${response.status}`);
        }
        
        const data = await response.json();
        // Take the first 10 products as "popular" products
        setPopularProducts(data.slice(0, 10));
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load popular products');
      } finally {
        setLoading(false);
      }
    };

    fetchPopularProducts();
  }, []);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setFeaturedLoading(true);
        const response = await fetch(`${API_URL}/api/products?featured=true`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch featured products: ${response.status}`);
        }
        
        const data = await response.json();
        // Use featured products or fallback to first 8 products
        setFeaturedProducts(data.slice(0, 8));
      } catch (err) {
        console.error('Error fetching featured products:', err);
        // Don't set error here to avoid blocking the whole page
      } finally {
        setFeaturedLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await fetch(`${API_URL}/api/categories`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch categories: ${response.status}`);
        }
        
        let data = await response.json();
        
        // Ensure data is an array
        if (!Array.isArray(data)) {
          console.warn('Categories data is not an array:', data);
          data = [];
        }
        
        // Filter to only include top-level categories (those without a parent)
        const topLevelCategories = data
          .filter((cat: any) => !cat.parentId)
          .slice(0, 5);
        
        setCategories(topLevelCategories);
        
        // Create refs for each category
        topLevelCategories.forEach((category: Category) => {
          if (!categoryRefs.current[category._id]) {
            categoryRefs.current[category._id] = React.createRef();
          }
        });
        
        // Fetch products for each category
        try {
          const productsResponse = await fetch(`${API_URL}/api/products`);
          if (!productsResponse.ok) {
            throw new Error(`Failed to fetch products: ${productsResponse.status}`);
          }
          
          const productsData = await productsResponse.json();
          
          // Build a complete category hierarchy map
          // This will map each category ID to all its descendant category IDs (at any level)
          const categoryHierarchy: {[key: string]: string[]} = {};
          
          // Helper function to recursively find all subcategories (including nested ones)
          const findAllSubcategories = (categoryId: string): string[] => {
            // If we've already calculated this category's subcategories, return them
            if (categoryHierarchy[categoryId]) {
              return categoryHierarchy[categoryId];
            }
            
            // Find direct subcategories
            const directSubcategories = data
              .filter((cat: any) => cat.parentId === categoryId)
              .map((cat: any) => cat._id);
            
            // Initialize with direct subcategories
            const allSubcategories = [...directSubcategories];
            
            // Recursively find subcategories of subcategories
            directSubcategories.forEach((subCatId: string) => {
              const nestedSubcategories = findAllSubcategories(subCatId);
              allSubcategories.push(...nestedSubcategories);
            });
            
            // Cache the result
            categoryHierarchy[categoryId] = allSubcategories;
            return allSubcategories;
          };
          
          // Calculate all subcategories for each top-level category
          topLevelCategories.forEach((category: Category) => {
            findAllSubcategories(category._id);
          });
          
          // Group products by category, including products from all subcategories at any level
          const productsByCategory: {[key: string]: Product[]} = {};
          topLevelCategories.forEach((category: Category) => {
            // Get all subcategory IDs for this category (including nested ones)
            const allSubcategoryIds = categoryHierarchy[category._id] || [];
            
            // Include products from this category AND all its subcategories (at any level)
            productsByCategory[category._id] = productsData
              .filter((product: Product) => {
                if (!product.category || !product.category._id) return false;
                
                // Include if product belongs to this category OR any of its subcategories (at any level)
                return (
                  product.category._id === category._id || 
                  allSubcategoryIds.includes(product.category._id)
                );
              })
              .slice(0, 8); // Limit to 8 products per category
          });
          
          setCategoryProducts(productsByCategory);
        } catch (err) {
          console.error('Error fetching products for categories:', err);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories');
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const scrollLeft = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref && ref.current) {
      ref.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRight = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref && ref.current) {
      ref.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all duration-500 hover:scale-[1.02] animate-fade-in-up">
          <div className="bg-gradient-to-r from-red-50 to-orange-50 p-8 flex items-center justify-center">
            <div className="relative w-24 h-24 flex items-center justify-center rounded-full bg-white shadow-inner">
              <div className="absolute inset-0 rounded-full bg-red-500/10 animate-pulse"></div>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-red-500 drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <div className="p-8 text-center">
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 mb-3 tracking-tight">Something went wrong</h2>
            <p className="text-gray-600 mb-8 leading-relaxed">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="group relative w-full py-4 px-6 bg-gradient-to-r from-[#FFB800] to-[#FFCB45] text-gray-900 font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FFB800] overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:rotate-180 duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try Again
              </span>
              <span className="absolute inset-0 bg-white/20 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></span>
            </button>
            <p className="mt-6 text-xs text-gray-500">
              If the problem persists, please contact support.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Carousel */}
      <HeroCarousel />

      {/* Categories Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
       
        
        {/* Use our new TopCategories component */}
        <TopCategories limit={6} showRevenue={false} />
      </div>

      {/* Featured Products Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
            {t('home.featuredProducts')}
          </h2>
          <Link
            to="/products"
            className="text-[#FFB800] text-sm md:text-base hover:underline font-bold"
          >
            {t('home.viewAll')}
          </Link>
        </div>
        
        <div className="relative px-2">
          {/* Left Scroll Button */}
          <button
            className="hidden lg:flex absolute left-0 top-1/2 transform -translate-y-1/2 bg-white shadow-md rounded-full p-2 z-10 hover:bg-gray-100"
            onClick={() => scrollLeft(featuredProductsRef)}
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>

          {/* Horizontal Scroll Container */}
          <div
            className="flex gap-4 overflow-x-auto hide-scrollbar py-4"
            ref={featuredProductsRef}
            style={{
              scrollBehavior: "smooth",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {featuredLoading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, index) => (
                <div 
                  key={index}
                  className="bg-white rounded-xl shadow-md w-[48%] sm:w-auto sm:min-w-[200px] md:min-w-[240px] lg:min-w-[280px] flex-shrink-0 overflow-hidden animate-pulse"
                >
                  <div className="h-32 md:h-48 bg-gray-200"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))
            ) : featuredProducts.length > 0 ? (
              featuredProducts.map((product) => (
              <Link
                  key={product._id}
                  to={`/products/${product._id}`}
                className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 w-[48%] sm:w-auto sm:min-w-[200px] md:min-w-[240px] lg:min-w-[280px] flex-shrink-0 transform hover:-translate-y-1 overflow-hidden"
              >
                  <div className="relative h-32 md:h-48 bg-gray-100">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={formatImageUrl(product.images[0])}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/240x160';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500">
                        OEM: {product.oemNumber || 'N/A'}
                      </span>
                      {product.rating && (
                        <div className="flex items-center bg-gray-50 px-2 py-1 rounded-full">
                          <Star className="w-3.5 h-3.5 text-yellow-400 fill-current" />
                          <span className="ml-1 text-xs font-medium text-gray-600">
                            {product.rating}
                          </span>
                        </div>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2">
                      {product.title}
                    </h3>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex flex-col">
                        <span className="text-lg font-bold text-blue-600">
                          €{product.price.toFixed(2)}
                        </span>
                      </div>
                  </div>
                    <button className="mt-1 w-full bg-[#FFB800] hover:bg-[#e6a600] text-secondary text-[14px] px-2 py-2 rounded-lg transition-colors">
                      {t('common.viewDetails')}
                    </button>
                </div>
              </Link>
              ))
            ) : (
              <p className="text-gray-500">No featured products found.</p>
            )}
          </div>

          {/* Right Scroll Button */}
          <button
            className="hidden lg:flex absolute right-0 top-1/2 transform -translate-y-1/2 bg-white shadow-md rounded-full p-2 z-10 hover:bg-gray-100"
            onClick={() => scrollRight(featuredProductsRef)}
          >
            <ChevronRight className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Popular Products Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
            {t('home.popularProducts')}
            </h2>
            <Link
            to="/products"
              className="text-[#FFB800] text-sm md:text-base hover:underline font-bold"
            >
              {t('home.viewAll')}
            </Link>
            </div>

            <div className="relative px-2">
              {/* Left Scroll Button */}
              <button
              className="hidden lg:flex absolute left-0 top-1/2 transform -translate-y-1/2 bg-white shadow-md rounded-full p-2 z-10 hover:bg-gray-100"
            onClick={() => scrollLeft(popularProductsRef)}
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>

          {/* Horizontal Scroll Container */}
          <div
            className="flex gap-4 overflow-x-auto hide-scrollbar py-4"
            ref={popularProductsRef}
            style={{
              scrollBehavior: "smooth",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {loading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, index) => (
                <div 
                  key={index}
                  className="bg-white rounded-xl shadow-md w-[48%] sm:w-auto sm:min-w-[200px] md:min-w-[240px] lg:min-w-[280px] flex-shrink-0 overflow-hidden animate-pulse"
                >
                  <div className="h-32 md:h-48 bg-gray-200"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))
            ) : popularProducts.length > 0 ? (
              popularProducts.map((product) => (
                <Link
                  key={product._id}
                  to={`/products/${product._id}`}
                  className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 w-[48%] sm:w-auto sm:min-w-[200px] md:min-w-[240px] lg:min-w-[280px] flex-shrink-0 transform hover:-translate-y-1 overflow-hidden"
                >
                  <div className="relative h-32 md:h-48 bg-gray-100">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={formatImageUrl(product.images[0])}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/240x160';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500">
                        OEM: {product.oemNumber || 'N/A'}
                      </span>
                      {product.rating && (
                        <div className="flex items-center bg-gray-50 px-2 py-1 rounded-full">
                          <Star className="w-3.5 h-3.5 text-yellow-400 fill-current" />
                          <span className="ml-1 text-xs font-medium text-gray-600">
                            {product.rating}
                          </span>
                        </div>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2">
                      {product.title}
                    </h3>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex flex-col">
                        <span className="text-lg font-bold text-blue-600">
                          €{product.price.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <button className="mt-1 w-full bg-[#FFB800] hover:bg-[#e6a600] text-secondary text-[14px] px-2 py-2 rounded-lg transition-colors">
                      {t('common.viewDetails')}
                    </button>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-gray-500">No popular products found.</p>
            )}
          </div>

          {/* Right Scroll Button */}
          <button
            className="hidden lg:flex absolute right-0 top-1/2 transform -translate-y-1/2 bg-white shadow-md rounded-full p-2 z-10 hover:bg-gray-100"
            onClick={() => scrollRight(popularProductsRef)}
          >
            <ChevronRight className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Categories with Products Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-6">
          {t('home.shopByCategory')}
        </h2>
        
        {categoriesLoading ? (
          // Loading skeleton for categories
          <div className="space-y-8">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {Array.from({ length: 12 }).map((_, idx) => (
                    <div key={idx} className="bg-gray-200 h-48 rounded-lg"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <p className="text-gray-500 text-center py-8">{t('categories.noCategories')}</p>
        ) : (
          <div className="space-y-12">
            {categories
              .filter(category => {
                // Only include categories that have products
                const products = categoryProducts[category._id] || [];
                return products.length > 0;
              })
              .map((category) => {
                const products = categoryProducts[category._id] || [];
                
                return (
                  <div key={category._id} className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg md:text-xl font-bold text-gray-900">
                        {category.name}
                      </h3>
                      <Link
                        to={`/category/${category._id}`}
                        className="text-[#FFB800] text-sm hover:underline font-bold"
                      >
                        {t('home.viewAll')}
                      </Link>
                    </div>
                    
                    <div className="relative">
                      {/* Left Scroll Button */}
                      <button
                        className="hidden lg:flex absolute left-0 top-1/2 transform -translate-y-1/2 bg-white shadow-md rounded-full p-2 z-10 hover:bg-gray-100"
                        onClick={() => scrollLeft(categoryRefs.current[category._id])}
              >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
              </button>

                <div
                        className="flex gap-4 overflow-x-auto hide-scrollbar py-4"
                        ref={categoryRefs.current[category._id]}
                style={{
                  scrollBehavior: "smooth",
                  WebkitOverflowScrolling: "touch",
                }}
                >
                {products.map((product) => (
                <Link
                            key={product._id}
                            to={`/products/${product._id}`}
                className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 w-[48%] sm:w-auto sm:min-w-[200px] md:min-w-[240px] lg:min-w-[280px] flex-shrink-0 transform hover:-translate-y-1 overflow-hidden"
                >
                            <div className="relative h-32 md:h-48 bg-gray-100">
                              {product.images && product.images.length > 0 ? (
                  <img
                                  src={formatImageUrl(product.images[0])}
                  alt={product.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/240x160';
                                  }}
                  />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="h-12 w-12 text-gray-400" />
                                </div>
                              )}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-500">
                                  OEM: {product.oemNumber || 'N/A'}
                  </span>
                                {product.rating && (
                  <div className="flex items-center bg-gray-50 px-2 py-1 rounded-full">
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-current" />
                    <span className="ml-1 text-xs font-medium text-gray-600">
                    {product.rating}
                    </span>
                  </div>
                                )}
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2">
                  {product.title}
                  </h3>
                  <div className="flex items-center justify-between mt-4">
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-blue-600">
                                    €{product.price.toFixed(2)}
                    </span>
                  </div>
                  </div>
                  <button className="mt-1 w-full bg-[#FFB800] hover:bg-[#e6a600] text-secondary text-[14px] px-2 py-2 rounded-lg transition-colors">
                    {t('common.viewDetails')}
                  </button>
                </div>
                </Link>
              ))}
              </div>

              {/* Right Scroll Button */}
              <button
              className="hidden lg:flex absolute right-0 top-1/2 transform -translate-y-1/2 bg-white shadow-md rounded-full p-2 z-10 hover:bg-gray-100"
                        onClick={() => scrollRight(categoryRefs.current[category._id])}
              >
              <ChevronRight className="w-6 h-6 text-gray-600" />
              </button>
            </div>
          </div>
          );
        })}
              
            {/* Show a message if all categories have no products */}
            {categories.length > 0 && 
             categories.every(category => (categoryProducts[category._id] || []).length === 0) && (
              <p className="text-gray-500 text-center py-8">No products found in any category.</p>
            )}
          </div>
        )}
        </div>
    </div>
  );
};

// CSS for scrollbar hiding
const styles = `
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default Home;
