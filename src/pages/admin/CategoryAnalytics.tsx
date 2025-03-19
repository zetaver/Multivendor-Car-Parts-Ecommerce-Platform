import React, { useState, useEffect } from 'react';
import { API_URL } from '../../config';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatImageUrl } from '../../lib/utils';
import { Package } from 'lucide-react';

interface TopCategory {
  _id: string;
  name: string;
  description: string;
  imageUrl?: string;
  salesCount: number;
  orderCount: number;
  totalRevenue: number;
}

interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  oemNumber?: string;
  category: {
    _id: string;
    name: string;
  };
}

interface PieChartDataItem {
  name: string;
  value: number;
  color: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

const CategoryAnalytics: React.FC = () => {
  const [categories, setCategories] = useState<TopCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const [sortBy, setSortBy] = useState<'sales' | 'orders'>('orders');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopCategories = async () => {
      try {
        setLoading(true);
        // In a real implementation, you would pass the timeRange to the API
        const response = await fetch(`${API_URL}/api/categories/top?limit=10&sortBy=${sortBy}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch category analytics: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          setCategories(data.data);
        } else {
          throw new Error(data.message || 'Failed to fetch category analytics');
        }
      } catch (err) {
        console.error('Error fetching category analytics:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTopCategories();
  }, [timeRange, sortBy]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${API_URL}/api/products`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch products: ${response.status}`);
        }
        
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        console.error('Error fetching products:', err);
      }
    };

    fetchProducts();
  }, []);

  // Get products for a specific category
  const getCategoryProducts = (categoryId: string) => {
    return products.filter(product => product.category && product.category._id === categoryId);
  };

  // Toggle category expansion
  const toggleCategoryExpansion = (categoryId: string) => {
    if (expandedCategory === categoryId) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(categoryId);
    }
  };

  // Prepare data for the pie chart
  const pieData: PieChartDataItem[] = categories.map((category, index) => ({
    name: category.name,
    value: sortBy === 'orders' ? category.orderCount : category.salesCount,
    color: COLORS[index % COLORS.length]
  }));

  // Prepare data for the bar chart
  const barData = [...categories].sort((a, b) => {
    const valueA = sortBy === 'orders' ? a.orderCount : a.salesCount;
    const valueB = sortBy === 'orders' ? b.orderCount : b.salesCount;
    return valueA - valueB;
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Category Analytics</h1>
        
        <div className="flex space-x-2">
          <div className="mr-4">
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'sales' | 'orders')}
              className="px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="sales">Sort by Sales</option>
              <option value="orders">Sort by Orders</option>
            </select>
          </div>
          <button 
            onClick={() => setTimeRange('week')}
            className={`px-4 py-2 rounded-md ${
              timeRange === 'week' 
                ? 'bg-emerald-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            This Week
          </button>
          <button 
            onClick={() => setTimeRange('month')}
            className={`px-4 py-2 rounded-md ${
              timeRange === 'month' 
                ? 'bg-emerald-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            This Month
          </button>
          <button 
            onClick={() => setTimeRange('year')}
            className={`px-4 py-2 rounded-md ${
              timeRange === 'year' 
                ? 'bg-emerald-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            This Year
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-yellow-50 text-yellow-700 p-4 rounded-lg mb-6">
          No data available. There may not be any completed orders yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribution Pie Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {sortBy === 'orders' ? 'Order Distribution by Category' : 'Sales Distribution by Category'}
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [
                      `${value} ${sortBy === 'orders' ? 'orders' : 'sales'}`, 
                      sortBy === 'orders' ? 'Order Count' : 'Sales Count'
                    ]} 
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Category Comparison Bar Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {sortBy === 'orders' ? 'Category Order Comparison' : 'Category Sales Comparison'}
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={80}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value: number) => [
                      `${value} ${sortBy === 'orders' ? 'orders' : 'sales'}`, 
                      sortBy === 'orders' ? 'Order Count' : 'Sales Count'
                    ]} 
                  />
                  <Legend />
                  <Bar 
                    dataKey={sortBy === 'orders' ? 'orderCount' : 'salesCount'} 
                    name={sortBy === 'orders' ? 'Order Count' : 'Sales Count'} 
                    fill="#0088FE" 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Detailed Category Data Table */}
          <div className="bg-white p-6 rounded-lg shadow-sm lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Detailed Category Data</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Count
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sales Count
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      % of Total {sortBy === 'orders' ? 'Orders' : 'Sales'}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categories.map((category) => {
                    const totalValue = categories.reduce((sum, cat) => 
                      sum + (sortBy === 'orders' ? cat.orderCount : cat.salesCount), 0);
                    const value = sortBy === 'orders' ? category.orderCount : category.salesCount;
                    const percentage = (value / totalValue) * 100;
                    const categoryProducts = getCategoryProducts(category._id);
                    const isExpanded = expandedCategory === category._id;
                    
                    return (
                      <React.Fragment key={category._id}>
                        <tr 
                          className={`cursor-pointer hover:bg-gray-50 ${isExpanded ? 'bg-gray-50' : ''}`}
                          onClick={() => toggleCategoryExpansion(category._id)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {category.imageUrl ? (
                                <img 
                                  src={formatImageUrl(category.imageUrl)} 
                                  alt={category.name} 
                                  className="h-16 w-16 object-cover rounded-lg mr-4"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64';
                                  }}
                                />
                              ) : (
                                <div className="h-16 w-16 bg-gray-200 rounded-lg mr-4 flex items-center justify-center text-gray-500">
                                  No Image
                                </div>
                              )}
                              <div>
                                <div className="text-sm font-medium text-gray-900">{category.name}</div>
                                <div className="text-sm text-gray-500 truncate max-w-xs">{category.description}</div>
                                <div className="text-xs text-blue-600 mt-1">
                                  {categoryProducts.length} products • Click to {isExpanded ? 'hide' : 'show'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {category.orderCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {category.salesCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${category.totalRevenue.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {percentage.toFixed(1)}%
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                              <div 
                                className="bg-emerald-600 h-2.5 rounded-full" 
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </td>
                        </tr>
                        
                        {/* Products for this category */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={5} className="px-6 py-4">
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="text-sm font-medium text-gray-900 mb-3">Products in {category.name}</h3>
                                
                                {categoryProducts.length === 0 ? (
                                  <p className="text-sm text-gray-500">No products found for this category.</p>
                                ) : (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {categoryProducts.map(product => (
                                      <div key={product._id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                                        <div className="h-32 bg-gray-100 relative">
                                          {product.images && product.images.length > 0 ? (
                                            <img 
                                              src={formatImageUrl(product.images[0])} 
                                              alt={product.title}
                                              className="w-full h-full object-cover"
                                              onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/128';
                                              }}
                                            />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                              <Package className="h-12 w-12 text-gray-400" />
                                            </div>
                                          )}
                                        </div>
                                        <div className="p-3">
                                          <h4 className="text-sm font-medium text-gray-900 truncate">{product.title}</h4>
                                          <p className="text-xs text-gray-500 mt-1 truncate">{product.description}</p>
                                          <div className="flex justify-between items-center mt-2">
                                            <span className="text-sm font-bold text-emerald-600">${product.price.toFixed(2)}</span>
                                            {product.oemNumber && (
                                              <span className="text-xs text-gray-500">OEM: {product.oemNumber}</span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryAnalytics; 