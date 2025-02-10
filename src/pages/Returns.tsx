import React from 'react';
import { RefreshCw, Shield, Clock, Truck, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';

const Returns = () => {
  const returnSteps = [
    {
      icon: <Clock className="w-8 h-8 text-blue-600" />,
      title: 'Initiate Return',
      description: 'Start your return within 30 days of purchase through your account dashboard',
    },
    {
      icon: <Truck className="w-8 h-8 text-blue-600" />,
      title: 'Ship Item Back',
      description: 'Use our prepaid shipping label to return the item',
    },
    {
      icon: <CheckCircle className="w-8 h-8 text-blue-600" />,
      title: 'Quality Check',
      description: 'We inspect the returned item to ensure it meets return criteria',
    },
    {
      icon: <RefreshCw className="w-8 h-8 text-blue-600" />,
      title: 'Refund Processing',
      description: 'Refund is processed within 5-7 business days after inspection',
    },
  ];

  const returnPolicies = [
    {
      title: 'Eligible Items',
      content: 'Items must be unused, in original packaging, and returned within 30 days',
    },
    {
      title: 'Non-Returnable Items',
      content: 'Custom-made parts, electrical components, and items marked as final sale',
    },
    {
      title: 'Return Shipping',
      content: 'Free return shipping for defective items. Standard return fee applies otherwise',
    },
    {
      title: 'Refund Method',
      content: 'Refunds are processed to the original payment method used for purchase',
    },
  ];

  const faqs = [
    {
      question: 'How long do I have to return an item?',
      answer: 'You have 30 days from the date of delivery to initiate a return.',
    },
    {
      question: 'How do I track my return?',
      answer: 'You can track your return using the tracking number provided with your return label in your account dashboard.',
    },
    {
      question: 'What if I received a defective item?',
      answer: 'Contact us immediately for a free return shipping label and expedited refund process.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-blue-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <RefreshCw className="w-16 h-16 text-white mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-4">Returns & Refunds</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Easy and hassle-free returns within 30 days of purchase
          </p>
        </div>
      </div>

      {/* Return Process Steps */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
          Return Process
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {returnSteps.map((step, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="flex justify-center mb-4">{step.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Return Policies */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Return Policy
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {returnPolicies.map((policy, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4">{policy.title}</h3>
                <p className="text-gray-600">{policy.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Important Notes */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start">
            <AlertCircle className="w-6 h-6 text-yellow-600 mr-4 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                Important Return Guidelines
              </h3>
              <ul className="list-disc pl-5 space-y-2 text-yellow-700">
                <li>All items must be in original packaging with tags attached</li>
                <li>Include all accessories and documentation</li>
                <li>Clearly state the reason for return</li>
                <li>Keep your return tracking number for reference</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* FAQs */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center mb-12">
            <HelpCircle className="w-8 h-8 text-blue-600 mr-3" />
            <h2 className="text-3xl font-bold text-gray-900">Frequently Asked Questions</h2>
          </div>
          <div className="max-w-3xl mx-auto">
            <div className="space-y-8">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Need Help Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-blue-50 rounded-lg p-8 text-center">
          <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Need Help with Your Return?</h2>
          <p className="text-gray-600 mb-6">
            Our customer service team is here to assist you with any questions about returns or refunds.
          </p>
          <div className="flex justify-center space-x-4">
            <button className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
              Contact Support
            </button>
            <button className="inline-flex items-center px-6 py-3 border border-blue-600 text-base font-medium rounded-md text-blue-600 bg-transparent hover:bg-blue-50">
              View Return Status
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Returns;