import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { API_URL } from '../config';
import { formatImageUrl } from '../lib/utils';
import { ChevronRight, Grid, Loader, Search, Filter, ArrowUpRight, Tag } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Category {
  _id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  subcategories?: Category[];
}

const Categories = () => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/categories`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch categories: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Filter to only include top-level categories (those without a parent)
        const topLevelCategories = Array.isArray(data) 
          ? data.filter((cat: Category) => !cat.parentId)
          : [];
        
        setCategories(topLevelCategories);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Generate a gradient color based on index
  const getGradient = (index: number) => {
    const gradients = [
      'from-blue-500 to-indigo-600',
      'from-emerald-500 to-teal-600',
      'from-orange-500 to-amber-600',
      'from-rose-500 to-pink-600',
      'from-violet-500 to-purple-600',
      'from-cyan-500 to-sky-600',
      'from-lime-500 to-green-600',
      'from-red-500 to-rose-600',
    ];
    return gradients[index % gradients.length];
  };

  // Filter categories based on search term
  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div className="h-10 bg-gray-200 rounded-lg w-64 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded-lg w-48 animate-pulse"></div>
        </div>
        <div className="h-12 bg-gray-200 rounded-full w-full max-w-md mb-8 animate-pulse"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="rounded-2xl bg-white shadow-sm overflow-hidden animate-pulse">
              <div className="h-56 bg-gray-200"></div>
              <div className="p-5 space-y-3">
                <div className="h-6 bg-gray-200 rounded-full w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded-full w-1/2"></div>
                <div className="h-10 bg-gray-200 rounded-full w-1/3 mt-4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 p-8 rounded-2xl shadow-sm border border-red-100">
          <h2 className="text-2xl font-bold text-red-600 mb-3">Error Loading Categories</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-full hover:shadow-lg transition-all duration-300 flex items-center"
          >
            <Loader className="w-4 h-4 mr-2 animate-spin" />
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
          <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
            <Grid className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">No Categories Found</h3>
          <p className="text-gray-500 max-w-md mx-auto">There are no categories available at the moment. Please check back later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header with animated gradient background */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 rounded-2xl p-8 mb-12 shadow-lg">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[length:20px_20px]"></div>
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse opacity-30 blur-3xl"></div>
        
        <div className="relative">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
              <Grid className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">{t('categories.title')}</h1>
          </div>
          <p className="text-blue-100 max-w-2xl mb-6">
            {t('categories.subtitle')}
          </p>
          
          {/* Search bar */}
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-white/70" />
            </div>
            <input
              type="text"
              placeholder={t('categories.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
            />
          </div>
        </div>
      </div>
      
      {/* Filter buttons */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button 
          onClick={() => setActiveFilter('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            activeFilter === 'all' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {t('categories.filters.all')}
        </button>
        <button 
          onClick={() => setActiveFilter('popular')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            activeFilter === 'popular' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {t('categories.filters.popular')}
        </button>
        <button 
          onClick={() => setActiveFilter('new')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            activeFilter === 'new' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {t('categories.filters.newArrivals')}
        </button>
      </div>
      
      {/* Results count */}
      <p className="text-gray-500 mb-6">
        {t('categories.showing')} {filteredCategories.length} {filteredCategories.length === 1 
          ? t('categories.category') 
          : t('categories.categories')}
        {searchTerm && ` ${t('categories.for')} "${searchTerm}"`}
      </p>
      
      {/* Categories grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredCategories.map((category, index) => (
          <Link
            key={category._id}
            to={`/category/${category._id}`}
            className="group relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 bg-white"
            onMouseEnter={() => setHoveredCategory(category._id)}
            onMouseLeave={() => setHoveredCategory(null)}
            style={{
              transform: hoveredCategory === category._id ? 'translateY(-8px)' : 'translateY(0)',
              transition: 'transform 0.3s ease-out'
            }}
          >
            <div className={`aspect-w-16 aspect-h-9 bg-gradient-to-r ${getGradient(index)}`}>
              {category.imageUrl ? (
                <img
                  src={formatImageUrl(category.imageUrl)}
                  alt={category.name}
                  className="w-full h-56 object-cover transition-all duration-700 ease-in-out"
                  style={{
                    transform: hoveredCategory === category._id ? 'scale(1.05)' : 'scale(1)'
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/500';
                  }}
                />
              ) : (
                <div className="w-full h-56 flex items-center justify-center">
                  <span className="text-6xl font-bold text-white opacity-80">{category.name.charAt(0)}</span>
                </div>
              )}
              
              {/* Category tag */}
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">
                <div className="flex items-center space-x-1">
                  <Tag className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-xs font-medium text-gray-800">{t('categories.categoryTag')}</span>
                </div>
              </div>
            </div>
            
            {/* Content overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-all duration-300"></div>
            
            {/* Text content */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h3 className="text-xl font-bold text-white group-hover:text-blue-200 transition-colors duration-300">
                {category.name}
              </h3>
              <p className="text-gray-300 mt-2 line-clamp-2 group-hover:text-white transition-colors">
                {category.description || t('categories.defaultDescription', { categoryName: category.name })}
              </p>
              
              {/* Action button */}
              <div className="mt-6 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out">
                <span className="inline-flex items-center px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full text-sm font-medium text-gray-900 hover:bg-white transition-colors">
                  {t('categories.browseCategory')}
                  <ArrowUpRight className="ml-2 w-4 h-4" />
                </span>
              </div>
            </div>
            
            {/* Hover effect overlay */}
            <div 
              className="absolute inset-0 border-4 border-transparent group-hover:border-white/20 rounded-2xl transition-all duration-300"
              style={{
                boxShadow: hoveredCategory === category._id ? '0 0 0 4px rgba(255,255,255,0.1)' : 'none'
              }}
            ></div>
          </Link>
        ))}
      </div>
      
      {/* Empty state for filtered results */}
      {filteredCategories.length === 0 && searchTerm && (
        <div className="text-center py-12 bg-gray-50 rounded-xl mt-8">
          <Search className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            {t('categories.noMatching')}
          </h3>
          <p className="mt-2 text-gray-500">
            {t('categories.couldntFind')} "{searchTerm}".
          </p>
          <button 
            onClick={() => setSearchTerm('')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
          >
            {t('categories.clearSearch')}
          </button>
        </div>
      )}
    </div>
  );
};

export default Categories;