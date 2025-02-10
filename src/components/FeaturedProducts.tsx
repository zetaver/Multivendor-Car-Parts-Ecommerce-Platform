import React from 'react';
import { Link } from 'react-router-dom';

interface Product {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  image: string;
  brand: string;
  isNew?: boolean;
}

interface FeaturedProductsProps {
  title: string;
  products: Product[];
}

const FeaturedProducts = ({ title, products }: FeaturedProductsProps) => {
  return (
    <div className="py-4">
      <div className="flex justify-between items-center px-4 mb-4">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <Link to="/see-all" className="text-sm text-gray-600">
          See all
        </Link>
      </div>
      
      <div className="overflow-x-auto hide-scrollbar">
        <div className="flex gap-4 px-4 min-w-min">
          {products.map((product) => (
            <div 
              key={product.id}
              className="flex-shrink-0 w-40 bg-white rounded-lg overflow-hidden"
            >
              <Link to={`/product/${product.id}`}>
                <div className="relative aspect-square">
                  <img 
                    src={product.image} 
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                  {product.isNew && (
                    <span className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                      New
                    </span>
                  )}
                </div>
                <div className="p-2">
                  <h3 className="font-medium text-sm text-gray-900">{product.brand}</h3>
                  <p className="text-sm text-gray-600 truncate">{product.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-bold text-gray-900">{product.price} €</span>
                    {product.originalPrice && (
                      <span className="text-sm text-gray-400 line-through">
                        {product.originalPrice} €
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturedProducts; 