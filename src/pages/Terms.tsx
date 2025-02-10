import React from 'react';
import { FileText, Shield, Scale, AlertTriangle } from 'lucide-react';

const Terms = () => {
  const sections = [
    {
      title: 'Acceptance of Terms',
      content: `By accessing and using EasyCasse, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.`,
    },
    {
      title: 'User Accounts',
      content: `You must be 18 years or older to create an account. You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.`,
    },
    {
      title: 'Product Listings',
      content: `Sellers must ensure all product information is accurate and complete. Products must comply with all applicable laws and regulations. EasyCasse reserves the right to remove any listing that violates our policies.`,
    },
    {
      title: 'Payment Terms',
      content: `All payments are processed securely through our payment providers. Sellers will receive payment within the specified timeframe after successful delivery confirmation.`,
    },
    {
      title: 'Shipping and Delivery',
      content: `Sellers are responsible for shipping products within the promised timeframe. All shipments must include tracking information and appropriate packaging to ensure safe delivery.`,
    },
    {
      title: 'Returns and Refunds',
      content: `Products may be returned within 30 days of delivery if they meet our return criteria. Refunds will be processed to the original payment method within 5-7 business days after return inspection.`,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-[#1E1E2D] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FileText className="w-16 h-16 text-[#FFB800] mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-4">Terms of Service</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Please read these terms carefully before using our platform
          </p>
        </div>
      </div>

      {/* Last Updated */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-sm text-gray-500">
          Last updated: March 10, 2024
        </div>
      </div>

      {/* Terms Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-8">
            <div className="prose prose-blue max-w-none">
              <p className="text-gray-600">
                These Terms of Service ("Terms") govern your use of EasyCasse ("we," "us," or "our") 
                website and services. By using our platform, you agree to these terms.
              </p>

              {sections.map((section, index) => (
                <div key={index} className="mt-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{section.title}</h2>
                  <p className="text-gray-600">{section.content}</p>
                </div>
              ))}

              {/* Important Notices */}
              <div className="mt-12 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-yellow-600 mr-2" />
                  <h3 className="text-lg font-semibold text-yellow-800">Important Notices</h3>
                </div>
                <ul className="list-disc pl-5 space-y-2 text-yellow-700">
                  <li>We reserve the right to modify these terms at any time</li>
                  <li>Continued use of the platform constitutes acceptance of updated terms</li>
                  <li>Violations may result in account suspension or termination</li>
                  <li>Users are responsible for complying with all applicable laws</li>
                </ul>
              </div>

              {/* Contact Information */}
              <div className="mt-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
                <p className="text-gray-600">
                  If you have any questions about these Terms, please contact us at:
                </p>
                <ul className="mt-4 space-y-2 text-gray-600">
                  <li>Email: legal@easycasse.com</li>
                  <li>Address: 123 Avenue des Champs-Élysées, 75008 Paris, France</li>
                  <li>Phone: +33 1 23 45 67 89</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;