import React from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronRight } from 'lucide-react';

const popularBrands = [
  'Toyota', 'Honda', 'BMW', 'Mercedes', 'Volkswagen', 'Audi'
];

const HomeBanner = () => {
  return (
    <div className="bg-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Left Side - Filters */}
          <div className="p-8 bg-white">
            <h2 className="text-2xl font-bold mb-6">Find Your Parts</h2>
            
            <div className="space-y-6">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search by Part Name or Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. Brake Pads, Oil Filter..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                </div>
              </div>

              {/* Vehicle Selection */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand
                  </label>
                  <select className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="">Select Brand</option>
                    {popularBrands.map(brand => (
                      <option key={brand} value={brand.toLowerCase()}>{brand}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Model
                  </label>
                  <select className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="">Select Model</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year
                  </label>
                  <select className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="">Select Year</option>
                    {Array.from({ length: 30 }, (_, i) => 2024 - i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                Find Parts
              </button>
            </div>
          </div>

          {/* Right Side - Content */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8 flex flex-col justify-center">
            <h1 className="text-4xl font-bold mb-4">
              Find the Right Parts for Your Vehicle
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Access thousands of quality auto parts from trusted sellers across France
            </p>
            <div className="space-y-4">
              <Link
                to="/products"
                className="inline-flex items-center bg-white text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Browse All Parts
                <ChevronRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                to="/sell"
                className="inline-flex items-center bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors"
              >
                Start Selling
                <ChevronRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeBanner;