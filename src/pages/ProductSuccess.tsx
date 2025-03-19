import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, Home, ShoppingBag } from 'lucide-react';

const ProductSuccess: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8 text-center">
        <div className="flex justify-center mb-6">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Product Published Successfully!
        </h1>
        
        <p className="text-gray-600 mb-8">
          Your product has been successfully published and is now visible to potential buyers.
        </p>
        
        <div className="flex flex-col space-y-3">
          <button 
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-center space-x-2 bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 transition"
          >
            <Home className="h-5 w-5" />
            <span>Go to Homepage</span>
          </button>
          
          <button 
            onClick={() => navigate('/profile?tab=wardrobe')}
            className="w-full flex items-center justify-center space-x-2 bg-white text-gray-800 border border-gray-300 py-3 px-4 rounded-lg hover:bg-gray-100 transition"
          >
            <ShoppingBag className="h-5 w-5" />
            <span>View My Products</span>
          </button>
          <Link 
          to="/profile?tab=wardrobe"
          >
            <button className="w-full flex items-center justify-center space-x-2 bg-white text-gray-800 border border-gray-300 py-3 px-4 rounded-lg hover:bg-gray-100 transition">
              <ShoppingBag className="h-5 w-5" />
              <span>View My Products</span>
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductSuccess; 