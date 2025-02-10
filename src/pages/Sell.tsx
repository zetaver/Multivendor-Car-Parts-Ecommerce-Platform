import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, TrendingUp, Shield, Truck, DollarSign, Users } from 'lucide-react';

const Sell = () => {
  const benefits = [
    {
      icon: <Users className="w-8 h-8 text-blue-600" />,
      title: 'Access to Millions',
      description: 'Reach millions of potential buyers across France',
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-blue-600" />,
      title: 'Growth Potential',
      description: 'Expand your business with our platform',
    },
    {
      icon: <Shield className="w-8 h-8 text-blue-600" />,
      title: 'Secure Payments',
      description: 'Safe and reliable payment processing',
    },
    {
      icon: <Truck className="w-8 h-8 text-blue-600" />,
      title: 'Shipping Solutions',
      description: 'Integrated shipping and logistics support',
    },
  ];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative bg-blue-600 py-24">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&q=80&w=1920"
            alt="Auto parts background"
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-white sm:text-5xl md:text-6xl">
              Start Selling Auto Parts Today
            </h1>
            <p className="mt-3 max-w-md mx-auto text-xl text-blue-100 sm:text-2xl md:mt-5 md:max-w-3xl">
              Join thousands of successful sellers on France's leading auto parts marketplace
            </p>
            <div className="mt-10 flex justify-center">
              <Link
                to="/register"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50"
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                Start Selling
              </Link>
              <Link
                to="/seller-guidelines"
                className="ml-4 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-500 hover:bg-blue-400"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Why Sell with Us?
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Everything you need to succeed in the auto parts market
            </p>
          </div>

          <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-shadow duration-300"
              >
                <div className="flex justify-center mb-4">{benefit.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">Ready to boost your sales?</span>
            <span className="block text-blue-200">Join our seller community today.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sell;