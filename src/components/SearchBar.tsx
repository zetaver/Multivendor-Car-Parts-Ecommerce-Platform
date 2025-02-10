import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="px-4 py-3 bg-white">
      <form onSubmit={handleSubmit}>
        <div className="relative flex items-center w-full bg-white border border-gray-200 rounded-full shadow-sm">
          <div className="flex items-center pl-4">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <div className="flex flex-col flex-1 px-2">
            <label className="text-sm font-medium text-gray-900 pt-1">
              Search
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Clothing, shoes..."
              className="w-full pb-1 text-sm text-gray-600 placeholder-gray-400 bg-transparent border-none focus:outline-none focus:ring-0"
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default SearchBar; 