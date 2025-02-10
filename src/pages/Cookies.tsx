import React from 'react';
import { Cookie, Shield, Settings, AlertTriangle } from 'lucide-react';

const Cookies = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-blue-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Cookie className="w-16 h-16 text-white mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-4">Cookie Policy</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Understanding how we use cookies to improve your experience
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-8">
            <div className="prose prose-blue max-w-none">
              <p className="text-gray-600">
                This Cookie Policy explains how EasyCasse uses cookies and similar tracking technologies 
                when you visit our website. By continuing to browse our site, you consent to our use of cookies.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">What Are Cookies?</h2>
              <p className="text-gray-600">
                Cookies are small text files that are stored on your device when you visit a website. 
                They help us remember your preferences and improve your browsing experience.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Types of Cookies We Use</h2>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900">Essential Cookies</h3>
                  <p className="text-gray-600">Required for basic website functionality</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900">Performance Cookies</h3>
                  <p className="text-gray-600">Help us understand how visitors use our website</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900">Functionality Cookies</h3>
                  <p className="text-gray-600">Remember your preferences and settings</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900">Marketing Cookies</h3>
                  <p className="text-gray-600">Used to deliver relevant advertisements</p>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Managing Cookies</h2>
              <p className="text-gray-600 mb-4">
                You can control and manage cookies in various ways:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                <li>Browser settings to block or delete cookies</li>
                <li>Our cookie consent tool to customize your preferences</li>
                <li>Third-party opt-out tools for specific services</li>
              </ul>

              <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-yellow-600 mr-2" />
                  <h3 className="text-lg font-semibold text-yellow-800">Important Notice</h3>
                </div>
                <p className="text-yellow-700">
                  Blocking certain cookies may impact your experience on our website and limit access to some features.
                </p>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Updates to This Policy</h2>
              <p className="text-gray-600">
                We may update this Cookie Policy from time to time. Any changes will be posted on this page 
                with an updated revision date.
              </p>

              <div className="mt-8 bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Us</h3>
                <p className="text-gray-600">
                  If you have any questions about our Cookie Policy, please contact us at:
                </p>
                <ul className="mt-4 space-y-2 text-gray-600">
                  <li>Email: privacy@easycasse.com</li>
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

export default Cookies;