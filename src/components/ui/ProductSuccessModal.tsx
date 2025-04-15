import React from 'react';
import { CheckCircle, ShoppingBag, X } from 'lucide-react';
import {Link, useNavigate } from 'react-router-dom';

interface ProductSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProductSuccessModal: React.FC<ProductSuccessModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Product Published</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="flex flex-col items-center mb-6">
          <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
          <p className="text-center text-gray-600">
            Your product has been successfully published and is now visible to potential buyers.
          </p>
        </div>
        
        <div className="flex flex-col space-y-3">
          <button 
            onClick={() => {
              onClose();
              navigate('/');
            }}
            className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition"
          >
            Go to Homepage
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

export default ProductSuccessModal; 