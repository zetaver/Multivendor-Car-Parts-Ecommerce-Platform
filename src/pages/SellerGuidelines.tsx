import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, AlertCircle, Book, Shield, Truck, DollarSign } from 'lucide-react';

const SellerGuidelines = () => {
  const guidelines = [
    {
      title: 'Product Quality Standards',
      icon: <CheckCircle className="w-6 h-6 text-green-500" />,
      items: [
        'All parts must be genuine or high-quality aftermarket',
        'Include clear photos from multiple angles',
        'Accurate product descriptions with specifications',
        'Proper packaging for safe shipping',
      ],
    },
    {
      title: 'Prohibited Items',
      icon: <AlertCircle className="w-6 h-6 text-red-500" />,
      items: [
        'Counterfeit or replica parts',
        'Used safety equipment',
        'Recalled items',
        'Parts with unclear origin',
      ],
    },
    {
      title: 'Pricing & Fees',
      icon: <DollarSign className="w-6 h-6 text-blue-500" />,
      items: [
        'Competitive market pricing',
        'Transparent fee structure',
        'Commission rates by category',
        'Payment processing fees',
      ],
    },
    {
      title: 'Shipping Requirements',
      icon: <Truck className="w-6 h-6 text-purple-500" />,
      items: [
        'Fast processing (within 48 hours)',
        'Tracking number required',
        'Proper packaging guidelines',
        'Insurance for valuable items',
      ],
    },
  ];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="bg-blue-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Book className="w-12 h-12 text-white mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-white mb-4">
              Seller Guidelines
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Everything you need to know about selling on EasyCasse
            </p>
          </div>
        </div>
      </div>

      {/* Guidelines Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {guidelines.map((section, index) => (
            <div
              key={index}
              className="bg-white rounded-lg border p-6 hover:shadow-lg transition-shadow duration-300"
            >
              <div className="flex items-center mb-4">
                {section.icon}
                <h2 className="text-xl font-semibold ml-2">{section.title}</h2>
              </div>
              <ul className="space-y-3">
                {section.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span className="text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Sections */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Detailed Guidelines
            </h2>
            
            <div className="space-y-12">
              <section>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  Account Requirements
                </h3>
                <p className="text-gray-600 mb-4">
                  To become a seller on EasyCasse, you must meet the following requirements:
                </p>
                <ul className="list-disc pl-6 text-gray-600">
                  <li>Valid business registration in France</li>
                  <li>Professional auto parts experience</li>
                  <li>Valid bank account for payments</li>
                  <li>Valid phone number and address</li>
                </ul>
              </section>

              <section>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  Performance Metrics
                </h3>
                <p className="text-gray-600 mb-4">
                  Sellers are evaluated based on the following metrics:
                </p>
                <ul className="list-disc pl-6 text-gray-600">
                  <li>Order fulfillment rate (minimum 95%)</li>
                  <li>Shipping time compliance</li>
                  <li>Customer satisfaction rating</li>
                  <li>Response time to customer inquiries</li>
                </ul>
              </section>

              <section>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  Product Listings
                </h3>
                <p className="text-gray-600 mb-4">
                  Your product listings must include:
                </p>
                <ul className="list-disc pl-6 text-gray-600">
                  <li>High-quality images (minimum 3 per product)</li>
                  <li>Accurate product descriptions</li>
                  <li>Correct categorization</li>
                  <li>Compatible vehicle information</li>
                  <li>Clear pricing and shipping information</li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Selling?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join our community of successful auto parts sellers today
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              to="/register"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50"
            >
              Create Account
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center px-6 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-blue-500"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerGuidelines;