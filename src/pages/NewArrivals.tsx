import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Star } from 'lucide-react';

const NewArrivals = () => {
  const products = [
    {
      id: 1,
      name: 'High Performance Air Filter',
      price: 49.99,
      image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&q=80&w=500',
      rating: 4.5,
      arrivalDate: '2024-03-01',
    },
    // Add more products as needed
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">New Arrivals</h1>
        <div className="flex items-center text-gray-500">
          <Clock className="w-5 h-5 mr-2" />
          <span>Updated daily</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <Link
            key={product.id}
            to={`/products/${product.id}`}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
          >
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-48 object-cover"
            />
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
                Added: {new Date(product.arrivalDate).toLocaleDateString()}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default NewArrivals;