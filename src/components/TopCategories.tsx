import React, { useState, useEffect, useRef } from 'react';
import { API_URL } from '../config';
import { Link } from 'react-router-dom';
import { formatImageUrl } from '../lib/utils';
import { ChevronLeft, ChevronRight, TrendingUp, Award } from 'lucide-react';
import { useTranslation } from 'react-i18next';



interface TopCategory {
  _id: string;
  name: string;
  description: string;
  imageUrl?: string;
  salesCount: number;
  orderCount: number;
  totalRevenue: number;
}

interface TopCategoriesProps {
  limit?: number;
  showRevenue?: boolean;
}

const TopCategories: React.FC<TopCategoriesProps> = ({
  limit = 5,
  showRevenue = false
}) => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<TopCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTopCategories = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/categories/top?limit=${limit}&sortBy=orders`);

        if (!response.ok) {
          throw new Error(`Failed to fetch top categories: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          setCategories(data.data);
        } else {
          throw new Error(data.message || 'Failed to fetch top categories');
        }
      } catch (err) {
        console.error('Error fetching top categories:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTopCategories();
  }, [limit]);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="p-4 overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 bg-gray-200 rounded w-40 animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
        </div>
        <div className="flex space-x-6 overflow-x-auto pb-4 scrollbar-hide">
          {[...Array(limit)].map((_, index) => (
            <div key={index} className="flex-shrink-0 w-64 rounded-xl bg-white shadow-sm overflow-hidden animate-pulse">
              <div className="h-32 bg-gray-200 rounded-t-xl"></div>
              <div className="p-4 space-y-3">
                <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500 bg-red-50 rounded-lg">
        <p>{t('topCategories.errorLoading', { error })}</p>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="p-4 text-gray-500">
        <p>{t('topCategories.noCategories')}</p>
      </div>
    );
  }

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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
            {t('topCategories.title')}
          </h2>
        </div>
        <Link 
          to="/categories" 
          className="flex items-center text-blue-600 hover:text-blue-800 transition-colors text-sm font-medium"
        >
          {t('topCategories.viewAll')}
          <ChevronRight className="w-4 h-4 ml-1" />
        </Link>
      </div>

      <div className="relative">
        {/* Left scroll button */}
        <button 
          onClick={scrollLeft}
          className="absolute -left-4 top-1/2 transform -translate-y-1/2 z-10 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-all duration-300 border border-gray-100"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>

        <div 
          ref={scrollContainerRef}
          className="flex space-x-6 overflow-x-auto pb-6 pt-2 px-1 scrollbar-hide scroll-smooth"
        >
          {categories.map((category, index) => (
            <Link
              key={category._id}
              to={`/category/${category._id}`}
              className="flex-shrink-0 w-64 rounded-xl bg-white shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group transform hover:-translate-y-1"
            >
              <div className={`h-32 bg-gradient-to-r ${getGradient(index)} relative overflow-hidden`}>
                {category.imageUrl ? (
                  <img
                    src={formatImageUrl(category.imageUrl)}
                    alt={category.name}
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/256';
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-white">
                    <span className="text-3xl font-bold">{category.name.charAt(0)}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent group-hover:from-black/40 transition-all duration-300"></div>
                
                {/* Category name overlay at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                  <h4 className="font-bold text-lg drop-shadow-md">{category.name}</h4>
                </div>
              </div>
              
              <div className="p-4 space-y-2">
                <p className="text-sm text-gray-600 line-clamp-2 group-hover:text-gray-900 transition-colors">
                  {category.description || t('topCategories.defaultDescription', { categoryName: category.name })}
                </p>
                
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center space-x-1">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      {category.orderCount} {category.orderCount === 1 
                        ? t('topCategories.orderCount.singular') 
                        : t('topCategories.orderCount.plural')}
                    </span>
                  </div>
                  
                  {showRevenue && (
                    <span className="text-sm font-medium text-gray-600">
                      ${category.totalRevenue.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Hover overlay button */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/0 group-hover:bg-black/20">
                <span className="px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full text-sm font-medium text-gray-900 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  {t('topCategories.browseCategory')}
                </span>
              </div>
            </Link>
          ))}
        </div>
        
        {/* Right scroll button */}
        <button 
          onClick={scrollRight}
          className="absolute -right-4 top-1/2 transform -translate-y-1/2 z-10 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-all duration-300 border border-gray-100"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5 text-gray-700" />
        </button>
      </div>
    </div>
  );
};

export default TopCategories;