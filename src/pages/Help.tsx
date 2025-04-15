import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

  const commonQuestions = [
    {
      question: t('help.faq.trackOrder.question'),
      answer: t('help.faq.trackOrder.answer'),
      link: '/track-order',
    },
    {
      question: t('help.faq.returnPolicy.question'),
      answer: t('help.faq.returnPolicy.answer'),
      link: '/returns',
    },
    {
      question: t('help.faq.sellerSupport.question'),
      answer: t('help.faq.sellerSupport.answer'),
      link: '/seller-support',
    },
  ];

  const categories = [
    {
      title: t('help.categories.shipping'),
      icon: <Truck className="w-6 h-6" />,
      link: '/shipping',
    },
    {
      title: t('help.categories.returns'),
      icon: <RefreshCw className="w-6 h-6" />,
      link: '/returns',
    },
    {
      title: t('help.categories.account'),
      icon: <User className="w-6 h-6" />,
      link: '/account',
    },
    {
      title: t('help.categories.payment'),
      icon: <CreditCard className="w-6 h-6" />,
      link: '/payment',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-[#1E1E2D] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <HelpCircle className="w-16 h-16 text-[#FFB800] mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-4">
            {t('help.title')}
          </h1>
          <div className="max-w-xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t('help.searchPlaceholder')}
                className="w-full pl-10 pr-4 py-3 rounded-lg border-none focus:ring-2 focus:ring-[#FFB800]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Help Categories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('help.categories.title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <Link
              key={index}
              to={category.link}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
            >
              <div className="flex items-center text-[#FFB800] mb-3">
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
            {t('help.faq.title')}
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
                  className="text-[#FFB800] hover:text-[#e6a600] font-medium"
                >
                  {t('help.faq.trackOrder.link')} →
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
            {t('help.contactSection.title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <Phone className="w-8 h-8 text-[#FFB800] mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('help.contactSection.call.title')}</h3>
              <p className="text-gray-600">{t('help.contactSection.call.description')}</p>
              <a
                href="tel:+33123456789"
                className="mt-4 inline-block text-[#FFB800] hover:text-[#e6a600]"
              >
                {t('help.contactSection.call.phone')}
              </a>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <Mail className="w-8 h-8 text-[#FFB800] mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('help.contactSection.email.title')}</h3>
              <p className="text-gray-600">{t('help.contactSection.email.description')}</p>
              <a
                href="mailto:support@easycasse.com"
                className="mt-4 inline-block text-[#FFB800] hover:text-[#e6a600]"
              >
                {t('help.contactSection.email.address')}
              </a>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <MessageCircle className="w-8 h-8 text-[#FFB800] mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('help.contactSection.chat.title')}</h3>
              <p className="text-gray-600">{t('help.contactSection.chat.description')}</p>
              <button className="mt-4 text-[#FFB800] hover:text-[#e6a600]">
                {t('help.contactSection.chat.button')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;