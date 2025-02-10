import React from 'react';
import { Truck, Package, Clock, Shield, MapPin, Calculator } from 'lucide-react';

const Shipping = () => {
  const shippingMethods = [
    {
      name: 'Standard Shipping',
      icon: <Truck className="w-8 h-8 text-blue-600" />,
      time: '3-5 business days',
      price: 'From €4.99',
      description: 'Best value for regular deliveries across France',
    },
    {
      name: 'Express Delivery',
      icon: <Clock className="w-8 h-8 text-blue-600" />,
      time: '1-2 business days',
      price: 'From €9.99',
      description: 'Fast delivery for urgent orders',
    },
    {
      name: 'Local Pickup',
      icon: <MapPin className="w-8 h-8 text-blue-600" />,
      time: 'Same day',
      price: 'Free',
      description: 'Pick up from seller location',
    },
  ];

  const features = [
    {
      icon: <Shield className="w-6 h-6 text-blue-600" />,
      title: 'Protected Shipping',
      description: 'All shipments are insured and tracked',
    },
    {
      icon: <Package className="w-6 h-6 text-blue-600" />,
      title: 'Professional Packaging',
      description: 'Secure packaging for all auto parts',
    },
    {
      icon: <MapPin className="w-6 h-6 text-blue-600" />,
      title: 'Nationwide Coverage',
      description: 'Delivery available across France',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-blue-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Truck className="w-16 h-16 text-white mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-4">
            Shipping Information
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Fast, reliable shipping options for all your auto parts needs
          </p>
        </div>
      </div>

      {/* Shipping Methods */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Shipping Methods
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {shippingMethods.map((method, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300"
            >
              <div className="flex items-center mb-4">
                {method.icon}
                <h3 className="text-xl font-semibold ml-3">{method.name}</h3>
              </div>
              <div className="space-y-2">
                <p className="text-gray-600">{method.description}</p>
                <p className="font-semibold text-blue-600">{method.price}</p>
                <p className="text-sm text-gray-500">Delivery time: {method.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Shipping Calculator */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center mb-6">
            <Calculator className="w-8 h-8 text-blue-600 mr-3" />
            <h2 className="text-2xl font-bold">Shipping Calculator</h2>
          </div>
          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From (Postal Code)
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter sender postal code"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To (Postal Code)
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter recipient postal code"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Package Weight (kg)
              </label>
              <input
                type="number"
                className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter package weight"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Calculate Shipping
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Shipping;