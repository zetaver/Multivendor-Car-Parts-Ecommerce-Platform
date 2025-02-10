import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowLeft } from 'lucide-react';

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50">
      {/* Search Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          
          <form onSubmit={handleSubmit} className="flex-1">
            <div className="relative flex items-center w-full bg-gray-100 rounded-full px-4 py-2.5">
              <Search className="w-5 h-5 text-gray-400 mr-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search"
                className="w-full bg-transparent border-none focus:outline-none text-base text-gray-900 placeholder-gray-500"
                autoFocus
              />
            </div>
          </form>
        </div>
      </div>

      {/* Recent Searches */}
      <div className="p-4">
        <h3 className="text-sm font-medium text-gray-500 mb-2">Recent Searches</h3>
        {/* Add your recent searches list here */}
      </div>
    </div>
  );
};

export default SearchPage; 