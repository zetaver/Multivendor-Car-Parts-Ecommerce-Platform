import React from 'react';
import { Link } from 'react-router-dom';

const categories = [
  {
    name: 'Engine Parts',
    image: 'https://images.unsplash.com/photo-1580274455191-1c62238fa333?auto=format&fit=crop&q=80&w=500',
    description: 'Essential components for your engine',
  },
  {
    name: 'Brake Systems',
    image: 'https://images.unsplash.com/photo-1600712242805-5f78671b24da?auto=format&fit=crop&q=80&w=500',
    description: 'Complete brake solutions for all vehicles',
  },
  {
    name: 'Transmission',
    image: 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?auto=format&fit=crop&q=80&w=500',
    description: 'Transmission parts and accessories',
  },
  {
    name: 'Body Parts',
    image: 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?auto=format&fit=crop&q=80&w=500',
    description: 'Exterior and interior body components',
  },
  {
    name: 'Electrical',
    image: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80&w=500',
    description: 'Electrical systems and components',
  },
  {
    name: 'Suspension',
    image: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=500',
    description: 'Suspension and steering parts',
  },
];

const Categories = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Browse Categories</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category, index) => (
          <Link
            key={index}
            to={`/products?category=${category.name.toLowerCase().replace(' ', '-')}`}
            className="group relative rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300"
          >
            <div className="aspect-w-16 aspect-h-9">
              <img
                src={category.image}
                alt={category.name}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6">
              <h3 className="text-xl font-semibold text-white group-hover:text-blue-200 transition-colors duration-300">
                {category.name}
              </h3>
              <p className="text-gray-200 mt-2">{category.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Categories;