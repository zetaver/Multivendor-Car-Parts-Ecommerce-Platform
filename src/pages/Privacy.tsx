import React from 'react';
import { Lock, Shield, Eye, Database, Bell, Settings } from 'lucide-react';

const Privacy = () => {
  const sections = [
    {
      icon: <Database className="w-6 h-6 text-[#FFB800]" />,
      title: 'Information We Collect',
      content: [
        'Personal identification information (Name, email address, phone number)',
        'Shipping and billing addresses',
        'Payment information (processed securely through our payment providers)',
        'Device and browser information',
        'Usage data and preferences',
      ],
    },
    {
      icon: <Eye className="w-6 h-6 text-[#FFB800]" />,
      title: 'How We Use Your Information',
      content: [
        'Process your orders and transactions',
        'Provide customer support and respond to inquiries',
        'Send important updates about your account',
        'Improve our services and user experience',
        'Prevent fraud and maintain security',
      ],
    },
    {
      icon: <Shield className="w-6 h-6 text-[#FFB800]" />,
      title: 'Data Protection',
      content: [
        'Encryption of sensitive data',
        'Regular security audits and updates',
        'Strict access controls for employee data access',
        'Compliance with GDPR and other privacy regulations',
        'Regular backup and disaster recovery procedures',
      ],
    },
    {
      icon: <Bell className="w-6 h-6 text-[#FFB800]" />,
      title: 'Your Privacy Rights',
      content: [
        'Right to access your personal data',
        'Right to correct or update your information',
        'Right to delete your account and data',
        'Right to opt-out of marketing communications',
        'Right to data portability',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-[#1E1E2D] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Lock className="w-16 h-16 text-[#FFB800] mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-4">Privacy Policy</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            We are committed to protecting your privacy and personal information
          </p>
        </div>
      </div>

      {/* Last Updated */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-sm text-gray-500">
          Last updated: March 10, 2024
        </div>
      </div>

      {/* Privacy Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-8">
            <div className="prose prose-blue max-w-none">
              <p className="text-gray-600">
                This Privacy Policy describes how EasyCasse ("we," "us," or "our") collects, uses, 
                and protects your personal information when you use our website and services.
              </p>

              {sections.map((section, index) => (
                <div key={index} className="mt-12">
                  <div className="flex items-center mb-4">
                    {section.icon}
                    <h2 className="text-2xl font-bold text-[#1E1E2D] ml-3">{section.title}</h2>
                  </div>
                  <ul className="space-y-3">
                    {section.content.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start">
                        <span className="text-[#FFB800] mr-2">•</span>
                        <span className="text-gray-600">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {/* Cookie Policy */}
              <div className="mt-12 bg-gray-50 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <Settings className="w-6 h-6 text-[#FFB800] mr-2" />
                  <h2 className="text-2xl font-bold text-[#1E1E2D]">Cookie Policy</h2>
                </div>
                <p className="text-gray-600 mb-4">
                  We use cookies and similar tracking technologies to improve your browsing experience, 
                  analyze site traffic, and understand where our visitors are coming from.
                </p>
                <div className="space-y-3">
                  <p className="text-gray-600">We use the following types of cookies:</p>
                  <ul className="list-disc pl-5 space-y-2 text-gray-600">
                    <li>Essential cookies for site functionality</li>
                    <li>Analytics cookies to understand user behavior</li>
                    <li>Preference cookies to remember your settings</li>
                    <li>Marketing cookies for targeted advertising</li>
                  </ul>
                </div>
              </div>

              {/* Contact Information */}
              <div className="mt-12">
                <h2 className="text-2xl font-bold text-[#1E1E2D] mb-4">Contact Us</h2>
                <p className="text-gray-600">
                  If you have any questions about this Privacy Policy or our data practices, please contact our Data Protection Officer:
                </p>
                <ul className="mt-4 space-y-2 text-gray-600">
                  <li>Email: privacy@easycasse.com</li>
                  <li>Address: 123 Avenue des Champs-Élysées, 75008 Paris, France</li>
                  <li>Phone: +33 1 23 45 67 89</li>
                </ul>
              </div>

              {/* Updates to Privacy Policy */}
              <div className="mt-12 bg-[#1E1E2D] rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Updates to This Policy
                </h3>
                <p className="text-gray-300">
                  We may update this Privacy Policy from time to time. We will notify you of any changes 
                  by posting the new Privacy Policy on this page and updating the "Last updated" date.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;