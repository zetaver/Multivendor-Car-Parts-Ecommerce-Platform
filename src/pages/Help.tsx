import React from 'react';
import { Link } from 'react-router-dom';
import {
  HelpCircle,
  Search,
  FileText,
  MessageCircle,
  Phone,
  Mail,
  Truck,
  RefreshCw,
  User,
  CreditCard
} from 'lucide-react';

const Help = () => {
  const commonQuestions = [
    {
      question: 'How do I track my order?',
      answer: 'You can track your order by logging into your account and visiting the Orders section. Alternatively, use the tracking number provided in your shipping confirmation email.',
      link: '/track-order',
    },
    {
      question: 'What is your return policy?',
      answer: 'We offer a 30-day return policy for most items. Items must be unused and in their original packaging.',
      link: '/returns',
    },
    {
      question: 'How do I contact seller support?',
      answer: 'Sellers can reach our dedicated support team through the seller dashboard or by emailing seller.support@easycasse.com',
      link: '/seller-support',
    },
  ];

  const categories = [
    {
      title: 'Shipping & Delivery',
      icon: <Truck className="w-6 h-6" />,
      link: '/shipping',
    },
    {
      title: 'Returns & Refunds',
      icon: <RefreshCw className="w-6 h-6" />,
      link: '/returns',
    },
    {
      title: 'Account & Orders',
      icon: <User className="w-6 h-6" />,
      link: '/account',
    },
    {
      title: 'Payment & Pricing',
      icon: <CreditCard className="w-6 h-6" />,
      link: '/payment',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-blue-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <HelpCircle className="w-16 h-16 text-white mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-4">
            How can we help you?
          </h1>
          <div className="max-w-xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search for help..."
                className="w-full pl-10 pr-4 py-3 rounded-lg border-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Help Categories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <Link
              key={index}
              to={category.link}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
            >
              <div className="flex items-center text-blue-600 mb-3">
                {category.icon}
                <h3 className="text-lg font-semibold ml-2">{category.title}</h3>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Common Questions */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Frequently Asked Questions
          </h2>
          <div className="grid gap-6">
            {commonQuestions.map((item, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors duration-300"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {item.question}
                </h3>
                <p className="text-gray-600 mb-4">{item.answer}</p>
                <Link
                  to={item.link}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Learn more →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact Options */}
      <div className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Still Need Help?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <Phone className="w-8 h-8 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Call Us</h3>
              <p className="text-gray-600">Available Mon-Fri, 9am-6pm</p>
              <a
                href="tel:+33123456789"
                className="mt-4 inline-block text-blue-600 hover:text-blue-700"
              >
                +33 1 23 45 67 89
              </a>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <Mail className="w-8 h-8 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Email Support</h3>
              <p className="text-gray-600">Get a response within 24 hours</p>
              <a
                href="mailto:support@easycasse.com"
                className="mt-4 inline-block text-blue-600 hover:text-blue-700"
              >
                support@easycasse.com
              </a>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <MessageCircle className="w-8 h-8 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Live Chat</h3>
              <p className="text-gray-600">Chat with our support team</p>
              <button className="mt-4 text-blue-600 hover:text-blue-700">
                Start Chat
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;