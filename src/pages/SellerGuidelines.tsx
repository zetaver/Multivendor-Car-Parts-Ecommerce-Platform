import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, AlertCircle, Book, Shield, Truck, DollarSign } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const SellerGuidelines = () => {
  const { t } = useTranslation();

  const guidelines = [
    {
      title: t('sellerGuidelines.guidelines.productQuality.title'),
      icon: <CheckCircle className="w-6 h-6 text-green-500" />,
      items: t('sellerGuidelines.guidelines.productQuality.items', { returnObjects: true }) as string[],
    },
    {
      title: t('sellerGuidelines.guidelines.prohibitedItems.title'),
      icon: <AlertCircle className="w-6 h-6 text-red-500" />,
      items: t('sellerGuidelines.guidelines.prohibitedItems.items', { returnObjects: true }) as string[],
    },
    {
      title: t('sellerGuidelines.guidelines.pricingFees.title'),
      icon: <DollarSign className="w-6 h-6 text-blue-500" />,
      items: t('sellerGuidelines.guidelines.pricingFees.items', { returnObjects: true }) as string[],
    },
    {
      title: t('sellerGuidelines.guidelines.shippingRequirements.title'),
      icon: <Truck className="w-6 h-6 text-purple-500" />,
      items: t('sellerGuidelines.guidelines.shippingRequirements.items', { returnObjects: true }) as string[],
    },
  ];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="bg-[#1E1E2D] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Book className="w-12 h-12 text-[#FFB800] mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-white mb-4">
              {t('sellerGuidelines.title')}
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              {t('sellerGuidelines.subtitle')}
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
                {React.cloneElement(section.icon, {
                  className: `w-6 h-6 ${
                    section.title === t('sellerGuidelines.guidelines.prohibitedItems.title') ? 'text-red-500' : 'text-[#FFB800]'
                  }`
                })}
                <h2 className="text-xl font-semibold ml-2 text-[#1E1E2D]">{section.title}</h2>
              </div>
              <ul className="space-y-3">
                {section.items.map((item: string, itemIndex: number) => (
                  <li key={itemIndex} className="flex items-start">
                    <span className="text-[#FFB800] mr-2">•</span>
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
            <h2 className="text-3xl font-bold text-[#1E1E2D] mb-8">
              {t('sellerGuidelines.detailedGuidelines.title')}
            </h2>
            
            <div className="space-y-12">
              <section>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  {t('sellerGuidelines.detailedGuidelines.accountRequirements.title')}
                </h3>
                <p className="text-gray-600 mb-4">
                  {t('sellerGuidelines.detailedGuidelines.accountRequirements.description')}
                </p>
                <ul className="list-disc pl-6 text-gray-600">
                  {(t('sellerGuidelines.detailedGuidelines.accountRequirements.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </section>

              <section>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  {t('sellerGuidelines.detailedGuidelines.performanceMetrics.title')}
                </h3>
                <p className="text-gray-600 mb-4">
                  {t('sellerGuidelines.detailedGuidelines.performanceMetrics.description')}
                </p>
                <ul className="list-disc pl-6 text-gray-600">
                  {(t('sellerGuidelines.detailedGuidelines.performanceMetrics.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </section>

              <section>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  {t('sellerGuidelines.detailedGuidelines.productListings.title')}
                </h3>
                <p className="text-gray-600 mb-4">
                  {t('sellerGuidelines.detailedGuidelines.productListings.description')}
                </p>
                <ul className="list-disc pl-6 text-gray-600">
                  {(t('sellerGuidelines.detailedGuidelines.productListings.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-[#1E1E2D] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            {t('sellerGuidelines.cta.readyToStart')}
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            {t('sellerGuidelines.cta.joinCommunity')}
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              to="/register"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-bold rounded-md text-[#1E1E2D] bg-[#FFB800] hover:bg-[#e6a600]"
            >
              {t('sellerGuidelines.cta.createAccount')}
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center px-6 py-3 border border-[#FFB800] text-base font-bold rounded-md text-[#FFB800] hover:bg-[#FFB800] hover:text-[#1E1E2D]"
            >
              {t('sellerGuidelines.cta.contactSupport')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerGuidelines;