import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { API_URL } from '../config';

// Define the Category interface
interface Category {
  _id: string;
  name: string;
  imageUrl?: string;
  parentId?: string;
}

// Define SearchSuggestions interface
interface SearchSuggestionsProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
  visible: boolean;
}

// SearchSuggestions component
const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({ suggestions, onSuggestionClick, visible }) => {
  if (!visible || suggestions.length === 0) return null;
  
  return (
    <div className=" bg-white shadow-lg rounded-b-lg border border-gray-200 mt-1 h-full overflow-y-auto 
    fixed inset-0 z-[70] top-[85px] bottom-[80px] right-3 left-3 md:h-[400px] md:w-[650px] md:top-[135px] md:max-w-7xl md:mx-auto md:px-4 pt-4">
      <div className="p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-2">
        Search suggestions
        </h3>
        <div className="space-y-2">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={(e) => {
                // Add active state styling
                const target = e.currentTarget;
                target.classList.add('bg-gray-100');
                
                // Call the click handler
                onSuggestionClick(suggestion);
              }}
              className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded active:bg-gray-200 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const suggestionsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log('Search Query:', searchQuery);
    console.log('Show Suggestions:', showSuggestions);
    console.log('Recent Searches:', recentSearches);
    console.log('Categories:', categories);
  }, [searchQuery, showSuggestions, recentSearches, categories]);

  // Check for search query in URL when component mounts
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const searchFromUrl = searchParams.get('search');
    
    if (searchFromUrl) {
      const decodedSearch = decodeURIComponent(searchFromUrl);
      setSearchQuery(decodedSearch);
      
      // If we have a search query from URL, fetch suggestions for it
      if (decodedSearch.trim().length >= 2) {
        fetchSuggestions(decodedSearch);
      }
      
      // Also save to localStorage for persistence
      updateRecentSearches(decodedSearch);
    } else {
      // If no search in URL, try to use the most recent search from localStorage
      const savedSearches = localStorage.getItem('recentSearches');
      if (savedSearches) {
        try {
          const parsedSearches = JSON.parse(savedSearches);
          if (Array.isArray(parsedSearches) && parsedSearches.length > 0) {
            // Get the most recent search (first item in the array)
            const mostRecentSearch = parsedSearches[0];
            setSearchQuery(mostRecentSearch);
            
            // Fetch suggestions for the most recent search
            if (mostRecentSearch.trim().length >= 2) {
              fetchSuggestions(mostRecentSearch);
            }
          }
        } catch (e) {
          console.error('Error parsing recent searches:', e);
        }
      }
    }
  }, [location.search]);

  // Fetch top-level categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
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
          .filter((cat: Category) => !cat.parentId)
          .slice(0, 5);
        
        setCategories(topLevelCategories);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
    
    // Load recent searches from localStorage
    const savedSearches = localStorage.getItem('recentSearches');
    if (savedSearches) {
      try {
        const parsedSearches = JSON.parse(savedSearches);
        if (Array.isArray(parsedSearches)) {
          setRecentSearches(parsedSearches.slice(0, 5));
        }
      } catch (e) {
        console.error('Error parsing recent searches:', e);
      }
    }
  }, []);

  // Function to fetch suggestions
  const fetchSuggestions = async (query: string) => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/products/suggestions?query=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch suggestions: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        setSuggestions(data.data);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Use a debounce effect to fetch suggestions as the user types
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        fetchSuggestions(searchQuery);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Function to handle suggestion selection
  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    // Don't trigger search yet - just update the input field
    // User will need to click the search button
    setShowSuggestions(false);
  };

  // Function to handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search results page
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Update recent searches in localStorage
  const updateRecentSearches = (query: string) => {
    if (!query.trim()) return;
    
    // Get existing searches
    const savedSearches = localStorage.getItem('recentSearches');
    let searches: string[] = [];
    
    if (savedSearches) {
      try {
        searches = JSON.parse(savedSearches);
      } catch (e) {
        console.error('Error parsing saved searches:', e);
      }
    }
    
    // Add the new search at the beginning and remove duplicates
    searches = [query, ...searches.filter(s => s !== query)].slice(0, 5);
    
    // Save back to localStorage
    localStorage.setItem('recentSearches', JSON.stringify(searches));
    
    // Update state
    setRecentSearches(searches);
  };

  // Format image URL properly
  const formatImageUrl = (imageUrl: string | undefined | null): string => {
    // If the URL is null, undefined, or empty, return a placeholder image
    if (!imageUrl || imageUrl.trim() === '') {
      return 'https://via.placeholder.com/32';
    }
    
    // Check if the URL already includes http:// or https://
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    
    // If it's a relative path starting with /api/media, add the base URL
    if (imageUrl.startsWith('/api/media/')) {
      return `${API_URL}${imageUrl}`;
    }
    
    // For just filenames, assume they're in the media directory
    return `${API_URL}/api/media/${imageUrl}`;
  };

  // Add resize listener
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleClearRecentSearch = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    const updatedSearches = [...recentSearches];
    updatedSearches.splice(index, 1);
    setRecentSearches(updatedSearches);
    localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
  };

  const handleClearAllRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const handleClose = () => {
    navigate(-1);
  };

  const handleDesktopSearchClose = () => {
    navigate(-1);
  };

  // Handle document clicks to hide suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Render loading or error state
  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  // Desktop Search View
  if (!isMobile) {
    return (
      <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 top-[65px]"
        onClick={handleDesktopSearchClose}
      >
        <div className="max-w-7xl mx-auto px-4 pt-4 bg-white rounded md:h-[400px] md:w-[650px]" onClick={(e) => e.stopPropagation()}>

          {/* Search Input */}
          <div className="relative flex items-center mb-8">
            <Search className="w-8 h-8 text-gray-400 hover:text-gray-600 pr-1.5" />
            <div className="relative w-full">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for a product, a brand..."
                className="w-full pl-4 pr-10 py-3 bg-white text-black placeholder-gray-500 focus:outline-none font-sans text-base"
                autoFocus
                onFocus={() => {
                  if (searchQuery.trim().length >= 2) {
                    setShowSuggestions(true);
                  }
                }}
              />
              <SearchSuggestions 
                suggestions={suggestions} 
                onSuggestionClick={handleSuggestionClick} 
                visible={showSuggestions}
              />
            </div>
            <button
              type="submit"
              onClick={handleSearch}
              className="absolute right-2 bg-[#BE4A09] top-1/2 transform -translate-y-1/2 text-white p-3 rounded font-sans text-base"
            >
              To research
            </button>
          </div>

          {/* Search Content */}
          {!showSuggestions && (
            <div className="grid grid-cols-2 gap-12 pb-10">
              {/* Recent Searches & Popular Searches */}
              <div>
                {recentSearches.length > 0 && (
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-medium text-gray-900 font-sans text-base">My recent research</h3>
                      <button 
                        onClick={handleClearAllRecentSearches}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="space-y-2">
                      {recentSearches.map((search, index) => (
                        <div 
                          key={index} 
                          className="flex justify-between items-center px-2 py-1 hover:bg-gray-100 rounded cursor-pointer"
                          onClick={() => handleSuggestionClick(search)}
                        >
                          <span className="text-sm text-gray-700 font-sans">{search}</span>
                          <button 
                            onClick={(e) => handleClearRecentSearch(e, index)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <h3 className="text-sm font-medium text-gray-900 mb-4 font-sans text-base">Popular searches</h3>
                <div className="space-y-2">
                  {loading ? (
                    <div className="animate-pulse">
                      {[...Array(5)].map((_, index) => (
                        <div key={index} className="h-6 bg-gray-200 rounded mb-2"></div>
                      ))}
                    </div>
                  ) : categories.slice(0, 5).map((category) => (
                    <button
                      key={category._id}
                      onClick={() => {
                        setSearchQuery(category.name);
                        handleDesktopSearchClose();
                      }}
                      className="block w-full text-left px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded font-sans text-base"
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-4 font-sans text-base">Current categories</h3>
                <div className="space-y-2">
                  {loading ? (
                    <div className="animate-pulse">
                      {[...Array(5)].map((_, index) => (
                        <div key={index} className="flex items-center">
                          <div className="w-4 h-4 bg-gray-200 rounded-full mr-2"></div>
                          <div className="h-6 bg-gray-200 rounded w-full"></div>
                        </div>
                      ))}
                    </div>
                  ) : categories.slice(0, 5).map((category) => (
                    <button
                      key={category._id}
                      onClick={() => {
                        window.location.href = `/category/${category._id}`;
                      }}
                      className="flex items-center space-x-2 px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded"
                    >
                      <img 
                        src={formatImageUrl(category.imageUrl)} 
                        alt={category.name} 
                        className="w-4 h-4"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/32';
                        }}
                      />
                      <span className="font-sans text-base">{category.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
    );
  }

  // Mobile Search View
  return (
    <div>
      {/* Search Header - Fixed */}
      <div className="fixed inset-0 bg-white z-[70] top-3 bottom-3 right-3 left-3 h-[63px]">
        <div className="flex justify-center items-center mb-4 mt-2 ml-2 mr-2">
          <Search className="w-5 h-5 text-gray-400 mr-2" />
          <div className="relative flex-1">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a product, a brand..."
              className="w-full text-base outline-none"
              autoFocus
              onFocus={() => {
                if (searchQuery.trim().length >= 2) {
                  setShowSuggestions(true);
                }
              }}
            />
            <SearchSuggestions 
              suggestions={suggestions} 
              onSuggestionClick={handleSuggestionClick} 
              visible={showSuggestions}
            />
          </div>
          <button
            onClick={handleClose}
            className="ml-2 p-2 text-gray-500 rounded bg-gray-200"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Scrollable Content Area */}
      {!showSuggestions && (
        <div className="fixed inset-0 bg-white z-[70] top-[85px] bottom-[80px] right-3 left-3">
          <div className="h-full overflow-y-auto">
            <div className="p-6">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-gray-900 font-sans">My recent research</h3>
                    <button 
                      onClick={handleClearAllRecentSearches}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="space-y-2">
                    {recentSearches.map((search, index) => (
                      <div 
                        key={index} 
                        className="flex justify-between items-center px-2 py-1 hover:bg-gray-100 rounded cursor-pointer"
                        onClick={() => handleSuggestionClick(search)}
                      >
                        <span className="text-sm text-gray-700 font-sans">{search}</span>
                        <button 
                          onClick={(e) => handleClearRecentSearch(e, index)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Searches */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-4 font-sans">
                Popular searches
                </h3>
                <div className="space-y-2">
                  {loading ? (
                    <div className="animate-pulse">
                      {[...Array(5)].map((_, index) => (
                        <div key={index} className="h-6 bg-gray-200 rounded mb-2"></div>
                      ))}
                    </div>
                  ) : categories.slice(0, 5).map((category) => (
                    <button
                      key={category._id}
                      onClick={() => {
                        setSearchQuery(category.name);
                        handleSearch(new Event('submit') as any);
                      }}
                      className="block w-full text-left px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded font-sans"
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div className="pt-10 bg-white">
                <h3 className="text-sm font-bold text-gray-900 mb-4 font-sans">
                Current categories
                </h3>
                <div className="space-y-2">
                  {loading ? (
                    <div className="animate-pulse">
                      {[...Array(5)].map((_, index) => (
                        <div key={index} className="flex items-center">
                          <div className="w-4 h-4 bg-gray-200 rounded-full mr-2"></div>
                          <div className="h-6 bg-gray-200 rounded w-full"></div>
                        </div>
                      ))}
                    </div>
                  ) : categories.slice(0, 5).map((category) => (
                    <button
                      key={category._id}
                      onClick={() => {
                        window.location.href = `/category/${category._id}`;
                      }}
                      className="flex items-center space-x-2 px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded"
                    >
                      <img 
                        src={formatImageUrl(category.imageUrl)} 
                        alt={category.name} 
                        className="w-4 h-4"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/32';
                        }}
                      />
                      <span className="font-sans text-base">{category.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Button - Fixed */}
      <div className="fixed bottom-3 right-3 left-3 z-[70] bg-white p-4 border-t border-gray-100">
        <button
          onClick={handleSearch}
          className="w-full bg-[#BE4A09] text-white py-3 rounded-lg font-medium hover:bg-[#A43F08] hover:border-[#A43F08] transition-colors duration-150"
        >
          To research
        </button>
      </div>
    </div>
  );
};

export default SearchPage; 