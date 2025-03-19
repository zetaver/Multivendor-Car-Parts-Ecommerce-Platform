import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { categories } from '../components/Navbar'; // Make sure to export categories from Navbar

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const navigate = useNavigate();

  // Add resize listener
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleClose = () => {
    navigate(-1);
  };

  const handleDesktopSearchClose = () => {
    navigate(-1);
  };

  // Desktop Search View
  if (!isMobile) {
    return (
      <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 top-[65px]"
        onClick={handleDesktopSearchClose}
      >
        <div className="max-w-7xl mx-auto px-4 pt-4 bg-white rounded md:h-[400px] md:w-[650px]">

          {/* Search Input */}
          <div className="relative flex items-center mb-8">
            <Search className="w-8 h-8 text-gray-400 hover:text-gray-600 pr-1.5" />
            <button
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >

            </button>
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
              onClick={handleDesktopSearchClose}
              className="absolute right-2 bg-[#BE4A09] top-1/2 transform -translate-y-1/2 text-white p-3 rounded  font-sans text-base"
            >
              Rechercher
            </button>
          </div>

          {/* Search Content */}
          <div className="grid grid-cols-2 gap-12 pb-10 ">

            {/* Popular Searches */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4 font-sans text-base">Recherches populaires</h3>
              <div className="space-y-2">
                {categories.slice(0, 5).map((category) => (
                  <button
                    key={category.id}
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
              <h3 className="text-sm font-medium text-gray-900 mb-4 font-sans text-base">Catégories du moment</h3>
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
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un produit, une marque..."
            className="flex-1 text-base outline-none"
            autoFocus
          />
          <button
            onClick={handleClose}
            className="ml-2 p-2 text-gray-500 rounded bg-gray-200"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="fixed inset-0 bg-white z-[70] top-[85px] bottom-[80px] right-3 left-3">
        <div className="h-full overflow-y-auto">
          <div className="p-6">
            {/* Popular Searches */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-4 font-sans">
                Recherches populaires
              </h3>
              <div className="space-y-2">
                {categories.slice(0, 5).map((category) => (
                  <button
                    key={category.id}
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
                Catégories du moment
              </h3>
              <div className="space-y-2">
                {categories.slice(0, 5).map((category) => (
                  <Link
                    key={category.id}
                    to={`/category/${category.id}`}
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

      {/* Search Button - Fixed */}
      <div className="fixed bottom-3 right-3 left-3 z-[70] bg-white p-4 border-t border-gray-100">
        <button
          onClick={(e) => handleSearch(e)}
          className="w-full bg-[#BE4A09] text-white py-3 rounded-lg font-medium hover:bg-[#A43F08] hover:border-[#A43F08] transition-colors duration-150"
        >
          Rechercher
        </button>
      </div>
    </div>
  );
};

export default SearchPage; 