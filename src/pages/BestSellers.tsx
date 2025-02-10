import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Award, TrendingUp } from 'lucide-react';

const BestSellers = () => {
  const products = [
    {
      id: 1,
      name: 'Premium Brake Pads',
      price: 79.99,
      image: 'https://images.unsplash.com/photo-1486754735734-325b5831c3ad?auto=format&fit=crop&q=80&w=500',
      rating: 4.8,
      sales: 1234,
    },
    // Add more products as needed
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <Award className="w-8 h-8 text-blue-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">Best Sellers</h1>
        </div>
        <div className="flex items-center text-gray-500">
          <TrendingUp className="w-5 h-5 mr-2" />
          <span>Top rated products</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <Link
            key={product.id}
            to={`/products/${product.id}`}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
          >
            <div className="relative">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-48 object-cover"
              />
              <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded-full text-sm">
                Best Seller
              </div>
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-blue-600">€{product.price}</span>
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="ml-1 text-gray-600">{product.rating}</span>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                {product.sales.toLocaleString()} units sold
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default BestSellers;