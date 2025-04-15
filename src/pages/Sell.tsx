import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, TrendingUp, Shield, Truck, DollarSign, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Sell = () => {
  const { t } = useTranslation();
  
  const benefits = [
    {
      icon: <Users className="w-8 h-8 text-blue-600" />,
      title: t('sell.benefits.accessToMillions.title'),
      description: t('sell.benefits.accessToMillions.description'),
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-blue-600" />,
      title: t('sell.benefits.growthPotential.title'),
      description: t('sell.benefits.growthPotential.description'),
    },
    {
      icon: <Shield className="w-8 h-8 text-blue-600" />,
      title: t('sell.benefits.securePayments.title'),
      description: t('sell.benefits.securePayments.description'),
    },
    {
      icon: <Truck className="w-8 h-8 text-blue-600" />,
      title: t('sell.benefits.shippingSolutions.title'),
      description: t('sell.benefits.shippingSolutions.description'),
    },
  ];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative bg-[#1E1E2D] py-24">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&q=80&w=1920"
            alt={t('sell.autoPartsBackground')}
            className="w-full h-full object-cover opacity-10"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-white sm:text-5xl md:text-6xl">
              {t('sell.title')}
            </h1>
            <p className="mt-3 max-w-md mx-auto text-xl text-gray-300 sm:text-2xl md:mt-5 md:max-w-3xl">
              {t('sell.subtitle')}
            </p>
            <div className="mt-10 flex justify-center">
              <Link
                to="/register"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-bold rounded-md text-[#1E1E2D] bg-[#FFB800] hover:bg-[#e6a600]"
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                {t('sell.startSelling')}
              </Link>
              <Link
                to="/seller-guidelines"
                className="ml-4 inline-flex items-center px-6 py-3 border border-[#FFB800] text-base font-bold rounded-md text-[#FFB800] bg-transparent hover:bg-[#FFB800] hover:text-[#1E1E2D]"
              >
                {t('sell.learnMore')}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-[#1E1E2D] sm:text-4xl">
              {t('sell.whyWithUs')}
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              {t('sell.marketSuccessDescription')}
            </p>
          </div>

          <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-shadow duration-300"
              >
                <div className="flex justify-center mb-4">
                  {React.cloneElement(benefit.icon, { className: "w-8 h-8 text-[#FFB800]" })}
                </div>
                <h3 className="text-lg font-semibold text-[#1E1E2D] mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-[#1E1E2D]">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">{t('sell.readyToBoost')}</span>
            <span className="block text-[#FFB800]">{t('sell.joinSellerCommunity')}</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-bold rounded-md text-[#1E1E2D] bg-[#FFB800] hover:bg-[#e6a600]"
              >
                {t('sell.getStarted')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sell;