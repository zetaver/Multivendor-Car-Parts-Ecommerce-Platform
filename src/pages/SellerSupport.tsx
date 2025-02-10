import React from 'react';
import { MessageCircle, Phone, Mail, FileText, HelpCircle, Video } from 'lucide-react';

const SellerSupport = () => {
  const supportChannels = [
    {
      icon: <Phone className="w-8 h-8 text-blue-600" />,
      title: 'Phone Support',
      description: 'Speak directly with our seller support team',
      action: 'Call Now',
      link: 'tel:+33123456789',
      availability: 'Mon-Fri, 9:00-18:00',
    },
    {
      icon: <MessageCircle className="w-8 h-8 text-blue-600" />,
      title: 'Live Chat',
      description: 'Get instant help from our support agents',
      action: 'Start Chat',
      link: '#',
      availability: '24/7',
    },
    {
      icon: <Mail className="w-8 h-8 text-blue-600" />,
      title: 'Email Support',
      description: 'Send us your detailed inquiries',
      action: 'Send Email',
      link: 'mailto:seller.support@easycasse.com',
      availability: 'Response within 24h',
    },
  ];

  const commonIssues = [
    {
      title: 'Account Management',
      items: [
        'Reset password',
        'Update business information',
        'Manage payment settings',
        'Change contact details',
      ],
    },
    {
      title: 'Listing Issues',
      items: [
        'Create new listings',
        'Update product information',
        'Manage inventory',
        'Pricing guidelines',
      ],
    },
    {
      title: 'Order Processing',
      items: [
        'Process orders',
        'Print shipping labels',
        'Handle returns',
        'Resolve disputes',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-blue-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <HelpCircle className="w-16 h-16 text-white mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-4">
            Seller Support Center
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            We're here to help you succeed on EasyCasse
          </p>
        </div>
      </div>

      {/* Support Channels */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {supportChannels.map((channel, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300"
            >
              <div className="flex items-center mb-4">
                {channel.icon}
                <h3 className="text-xl font-semibold ml-3">{channel.title}</h3>
              </div>
              <p className="text-gray-600 mb-4">{channel.description}</p>
              <p className="text-sm text-gray-500 mb-4">
                Available: {channel.availability}
              </p>
              <a
                href={channel.link}
                className="inline-flex items-center justify-center w-full px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                {channel.action}
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Common Issues */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Common Issues
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {commonIssues.map((section, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4">{section.title}</h3>
                <ul className="space-y-3">
                  {section.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-center text-gray-600">
                      <FileText className="w-5 h-5 text-blue-600 mr-2" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Video Tutorials */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center mb-6">
            <Video className="w-8 h-8 text-blue-600 mr-3" />
            <h2 className="text-2xl font-bold">Video Tutorials</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg">
              {/* Embed video player here */}
              <div className="flex items-center justify-center">
                <p className="text-gray-500">Getting Started Tutorial</p>
              </div>
            </div>
            <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg">
              {/* Embed video player here */}
              <div className="flex items-center justify-center">
                <p className="text-gray-500">Advanced Selling Tips</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerSupport;