import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, SortDesc, ChevronDown, Star, X } from 'lucide-react';
import { sampleProducts, allSampleProducts } from '../data/sampleProducts';


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

const ProductList = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [sortOption, setSortOption] = useState('');
  const [filters, setFilters] = useState({
    category: 'All Categories',
    condition: 'All Conditions',
    priceRange: 'All Prices',
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    setAllProducts(allSampleProducts);
    setFilteredProducts(allSampleProducts);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let result = [...allProducts];

    // Apply filters
    if (filters.category !== 'All Categories') {
      result = result.filter(product => product.category === filters.category);
    }

    if (filters.condition !== 'All Conditions') {
      result = result.filter(product => product.condition === filters.condition);
    }

    switch (filters.priceRange) {
      case 'Under €50':
        result = result.filter(product => product.price < 50);
        break;
      case '€50 - €100':
        result = result.filter(product => product.price >= 50 && product.price <= 100);
        break;
      case '€100 - €500':
        result = result.filter(product => product.price > 100 && product.price <= 500);
        break;
      case 'Over €500':
        result = result.filter(product => product.price > 500);
        break;
      default:
        break;
    }

    // Apply sorting
    switch (sortOption) {
      case 'price-low-high':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high-low':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'name-a-z':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'name-z-a':
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

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleViewDetails = (productId: string) => {
    navigate(`/products/${productId}`);
  };

  const handleFilterChange = (filterType: keyof typeof filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleSortChange = (option: string) => {
    setSortOption(option);
    setShowSortMenu(false);
  };

  const categories = [
    'All Categories',
    'Engine Parts',
    'Brake Systems',
    'Transmission',
    'Body Parts',
    'Electrical',
    'Suspension',
  ];

  const conditions = ['All Conditions', 'New', 'Used'];
  const priceRanges = [
    'All Prices',
    'Under €50',
    '€50 - €100',
    '€100 - €500',
    'Over €500',
  ];

  const sortOptions = [
    { value: 'price-low-high', label: 'Price: Low to High' },
    { value: 'price-high-low', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'name-a-z', label: 'Name: A to Z' },
    { value: 'name-z-a', label: 'Name: Z to A' },
  ];

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
    <div className="min-h-screen bg-gray-50 py-8 mt-6 md:mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Auto Parts</h1>
            <p className="mt-1 text-sm text-gray-500">
              {filteredProducts.length} results found
            </p>
          </div>

          <div className="mt-4 md:mt-0 flex items-center space-x-4">
            <div className="relative">
              <button
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Filter className="h-5 w-5 mr-2 text-gray-400" />
                Filters
              </button>

              {/* Desktop Filter Menu */}
              {!isMobile && showFilterMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg z-50 p-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        value={filters.category}
                        onChange={(e) => handleFilterChange('category', e.target.value)}
                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                      >
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Condition
                      </label>
                      <select
                        value={filters.condition}
                        onChange={(e) => handleFilterChange('condition', e.target.value)}
                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                      >
                        {conditions.map((condition) => (
                          <option key={condition} value={condition}>
                            {condition}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price Range
                      </label>
                      <select
                        value={filters.priceRange}
                        onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                      >
                        {priceRanges.map((range) => (
                          <option key={range} value={range}>
                            {range}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="pt-4 border-t">
                      <button
                        onClick={() => setShowFilterMenu(false)}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                      >
                        Apply Filters
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile Filter Bottom Sheet */}
              {isMobile && showFilterMenu && (
                <>
                  <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-50"
                    onClick={() => setShowFilterMenu(false)}
                  />
                  <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4 z-50 animate-slide-up">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium">Filters</h3>
                      <button
                        onClick={() => setShowFilterMenu(false)}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Category
                        </label>
                        <select
                          value={filters.category}
                          onChange={(e) => handleFilterChange('category', e.target.value)}
                          className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                        >
                          {categories.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Condition
                        </label>
                        <select
                          value={filters.condition}
                          onChange={(e) => handleFilterChange('condition', e.target.value)}
                          className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                        >
                          {conditions.map((condition) => (
                            <option key={condition} value={condition}>
                              {condition}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Price Range
                        </label>
                        <select
                          value={filters.priceRange}
                          onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                          className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                        >
                          {priceRanges.map((range) => (
                            <option key={range} value={range}>
                              {range}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t">
                      <button
                        onClick={() => setShowFilterMenu(false)}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
                      >
                        Apply Filters
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <SortDesc className="h-5 w-5 mr-2 text-gray-400" />
                Sort
                <ChevronDown className="h-4 w-4 ml-2" />
              </button>

              {showSortMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                  <div className="py-1">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleSortChange(option.value)}
                        className={`block w-full text-left px-4 py-2 text-sm ${sortOption === option.value
                            ? 'bg-gray-100 text-gray-900'
                            : 'text-gray-700 hover:bg-gray-50'
                          }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {(filters.category !== 'All Categories' ||
          filters.condition !== 'All Conditions' ||
          filters.priceRange !== 'All Prices' ||
          sortOption) && (
            <div className="mb-6 flex flex-wrap gap-2">
              {filters.category !== 'All Categories' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {filters.category}
                  <button
                    onClick={() => handleFilterChange('category', 'All Categories')}
                    className="ml-2 text-blue-600 hover:text-blue-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </span>
              )}
              {filters.condition !== 'All Conditions' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {filters.condition}
                  <button
                    onClick={() => handleFilterChange('condition', 'All Conditions')}
                    className="ml-2 text-blue-600 hover:text-blue-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </span>
              )}
              {filters.priceRange !== 'All Prices' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {filters.priceRange}
                  <button
                    onClick={() => handleFilterChange('priceRange', 'All Prices')}
                    className="ml-2 text-blue-600 hover:text-blue-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </span>
              )}
              {sortOption && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {sortOptions.find(opt => opt.value === sortOption)?.label}
                  <button
                    onClick={() => setSortOption('')}
                    className="ml-2 text-blue-600 hover:text-blue-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </span>
              )}
              <button
                onClick={() => {
                  setFilters({
                    category: 'All Categories',
                    condition: 'All Conditions',
                    priceRange: 'All Prices',
                  });
                  setSortOption('');
                }}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Clear all
              </button>
            </div>
          )}

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-300"
            >
              <div className="relative aspect-square">
                <img
                  src={product.images[0]}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
                {product.condition === 'New' && (
                  <span className="absolute top-2 left-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    New
                  </span>
                )}
                <button
                  className="absolute top-2 right-2 p-1 text-gray-600 hover:text-gray-900"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Add favorite functionality here
                  }}
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </button>
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-gray-900">{product.title}</h3>
                </div>
                <p className="text-sm text-gray-500 mb-2">{product.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <span className="font-bold text-lg">€{product.price}</span>
                    {product.price < product.price * 1.5 && (
                      <span className="text-sm text-gray-500 line-through">
                        €{(product.price * 1.5).toFixed(0)}
                      </span>
                    )}
                  </div>
                </div>
                {product.stock < 5 ? (
                  <span className="block mt-2 text-sm text-gray-500">
                    Only {product.stock} left
                  </span>
                ) : null}
                <button
                  onClick={() => handleViewDetails(product.id)}
                  className="w-full mt-3 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200 text-sm"
                >
                  {product.stock > 0 ? 'View Details' : 'Out of Stock'}
                </button>

              </div>
            </div>
          ))}
        </div>

        {/* No Results Message */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No products match your filters.</p>
            <button
              onClick={() => {
                setFilters({
                  category: 'All Categories',
                  condition: 'All Conditions',
                  priceRange: 'All Prices',
                });
                setSortOption('');
              }}
              className="mt-4 text-blue-600 hover:text-blue-700"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductList;