import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowLeft, X, Filter, ChevronDown, Check } from 'lucide-react';
import sampleProducts from '../data/sampleProducts';

interface Filters {
  category: string;
  condition: string;
  priceRange: string;
  sortBy: string;
}

const SearchScreen = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(sampleProducts);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    category: 'all',
    condition: 'all',
    priceRange: 'all',
    sortBy: 'relevance',
  });
  const navigate = useNavigate();

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
    { label: 'All Prices', value: 'all' },
    { label: 'Under €50', value: '0-50' },
    { label: '€50 - €100', value: '50-100' },
    { label: '€100 - €200', value: '100-200' },
    { label: 'Over €200', value: '200+' },
  ];

  const sortOptions = [
    { label: 'Relevance', value: 'relevance' },
    { label: 'Price: Low to High', value: 'price-asc' },
    { label: 'Price: High to Low', value: 'price-desc' },
    { label: 'Rating', value: 'rating' },
  ];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      let filtered = sampleProducts.filter(product => 
        product.title.toLowerCase().includes(query.toLowerCase()) ||
        product.oemNumber.toLowerCase().includes(query.toLowerCase())
      );

      // Apply filters
      if (filters.category !== 'all') {
        filtered = filtered.filter(product => 
          product.category?.toLowerCase() === filters.category.toLowerCase()
        );
      }

      if (filters.condition !== 'all') {
        filtered = filtered.filter(product => 
          product.condition.toLowerCase() === filters.condition.toLowerCase()
        );
      }

      if (filters.priceRange !== 'all') {
        const [min, max] = filters.priceRange.split('-').map(Number);
        filtered = filtered.filter(product => {
          if (filters.priceRange === '200+') {
            return product.price >= 200;
          }
          return product.price >= min && product.price <= max;
        });
      }

      // Apply sorting
      filtered.sort((a, b) => {
        switch (filters.sortBy) {
          case 'price-asc':
            return a.price - b.price;
          case 'price-desc':
            return b.price - a.price;
          case 'rating':
            return b.rating - a.rating;
          default:
            return 0;
        }
      });

      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  };

  const handleProductClick = (productId: string) => {
    navigate(`/products/${productId}`);
    onClose();
  };

  const handleFilterChange = (type: keyof Filters, value: string) => {
    const newFilters = { ...filters, [type]: value };
    setFilters(newFilters);
    handleSearch(searchQuery);
  };

  const clearFilters = () => {
    setFilters({
      category: 'all',
      condition: 'all',
      priceRange: 'all',
      sortBy: 'relevance',
    });
    handleSearch(searchQuery);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Search Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <button onClick={onClose} className="text-gray-500">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search parts..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            {searchQuery && (
              <button
                onClick={() => handleSearch('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-1 px-3 py-2 rounded-lg ${
              showFilters ? 'bg-blue-50 text-blue-600' : 'text-gray-500'
            }`}
          >
            <Filter className="w-5 h-5" />
            <span className="text-sm">Filters</span>
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 pb-4 border-t border-gray-200">
            <div className="pt-4 space-y-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  {categories.map((category) => (
                    <option key={category} value={category.toLowerCase()}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Condition Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condition
                </label>
                <select
                  value={filters.condition}
                  onChange={(e) => handleFilterChange('condition', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  {conditions.map((condition) => (
                    <option key={condition} value={condition.toLowerCase()}>
                      {condition}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range
                </label>
                <select
                  value={filters.priceRange}
                  onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  {priceRanges.map((range) => (
                    <option key={range.value} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear Filters Button */}
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Active Filters */}
      {(filters.category !== 'all' || 
        filters.condition !== 'all' || 
        filters.priceRange !== 'all' ||
        filters.sortBy !== 'relevance') && (
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex flex-wrap gap-2">
          {filters.category !== 'all' && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
              {filters.category}
              <button
                onClick={() => handleFilterChange('category', 'all')}
                className="ml-2 text-blue-600 hover:text-blue-500"
              >
                <X className="w-4 h-4" />
              </button>
            </span>
          )}
          {filters.condition !== 'all' && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
              {filters.condition}
              <button
                onClick={() => handleFilterChange('condition', 'all')}
                className="ml-2 text-blue-600 hover:text-blue-500"
              >
                <X className="w-4 h-4" />
              </button>
            </span>
          )}
          {filters.priceRange !== 'all' && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
              {priceRanges.find(r => r.value === filters.priceRange)?.label}
              <button
                onClick={() => handleFilterChange('priceRange', 'all')}
                className="ml-2 text-blue-600 hover:text-blue-500"
              >
                <X className="w-4 h-4" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Search Results */}
      <div className="flex-1 overflow-y-auto">
        {searchQuery ? (
          searchResults.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {searchResults.map((product) => (
                <div
                  key={product.id}
                  className="p-4 flex items-center space-x-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleProductClick(product.id)}
                >
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">{product.title}</h3>
                    <p className="text-sm text-gray-500">OEM: {product.oemNumber}</p>
                    <p className="text-sm font-medium text-blue-600">€{product.price}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              No results found for "{searchQuery}"
            </div>
          )
        ) : (
          <div className="p-4 space-y-4">
            <h3 className="text-sm font-medium text-gray-900 px-4">Popular Searches</h3>
            <div className="flex flex-wrap gap-2 px-4">
              {['Brake Pads', 'Oil Filter', 'Headlight', 'Battery', 'Spark Plugs'].map((term) => (
                <button
                  key={term}
                  onClick={() => handleSearch(term)}
                  className="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-700 hover:bg-gray-200"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchScreen;