import React from 'react';
import { MessageCircle, Phone, Mail, FileText, HelpCircle, Video, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const SellerSupport = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const supportChannels = [
    {
      icon: <Phone className="w-8 h-8 text-[#FFB800]" />,
      title: t('sellerSupport.supportChannels.phoneSupport.title'),
      description: t('sellerSupport.supportChannels.phoneSupport.description'),
      action: t('sellerSupport.supportChannels.phoneSupport.action'),
      link: 'tel:+33123456789',
      availability: t('sellerSupport.supportChannels.phoneSupport.availability'),
    },
    {
      icon: <MessageCircle className="w-8 h-8 text-[#FFB800]" />,
      title: t('sellerSupport.supportChannels.liveChat.title'),
      description: t('sellerSupport.supportChannels.liveChat.description'),
      action: t('sellerSupport.supportChannels.liveChat.action'),
      link: '/contact',
      availability: t('sellerSupport.supportChannels.liveChat.availability'),
    },
    {
      icon: <Mail className="w-8 h-8 text-[#FFB800]" />,
      title: t('sellerSupport.supportChannels.emailSupport.title'),
      description: t('sellerSupport.supportChannels.emailSupport.description'),
      action: t('sellerSupport.supportChannels.emailSupport.action'),
      link: 'mailto:seller.support@easycasse.com',
      availability: t('sellerSupport.supportChannels.emailSupport.availability'),
    },
  ];

  const commonIssues = [
    {
      title: t('sellerSupport.commonIssues.accountManagement.title'),
      items: t('sellerSupport.commonIssues.accountManagement.items', { returnObjects: true }) as string[],
    },
    {
      title: t('sellerSupport.commonIssues.listingIssues.title'),
      items: t('sellerSupport.commonIssues.listingIssues.items', { returnObjects: true }) as string[],
    },
    {
      title: t('sellerSupport.commonIssues.orderProcessing.title'),
      items: t('sellerSupport.commonIssues.orderProcessing.items', { returnObjects: true }) as string[],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Back Button - Only visible on mobile */}
      <div className="md:hidden sticky top-0 z-10 bg-white p-4 shadow-sm flex items-center">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center text-gray-700"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span>{t('sellerSupport.back')}</span>
        </button>
      </div>

      {/* Hero Section */}
      <div className="bg-[#1E1E2D] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <HelpCircle className="w-16 h-16 text-white mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-4">
            {t('sellerSupport.title')}
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            {t('sellerSupport.subtitle')}
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
                {t('sellerSupport.supportChannels.availablePrefix')}{channel.availability}
              </p>
              <a
                href={channel.link}
                className="inline-flex items-center justify-center w-full px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-[#FFB800] hover:bg-[#e6a600]"
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
            {t('sellerSupport.commonIssues.title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {commonIssues.map((section, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4">{section.title}</h3>
                <ul className="space-y-3">
                  {section.items.map((item: string, itemIndex: number) => (
                    <li key={itemIndex} className="flex items-center text-gray-600">
                      <FileText className="w-5 h-5 text-[#FFB800] mr-2" />
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
            <Video className="w-8 h-8 text-[#FFB800] mr-3" />
            <h2 className="text-2xl font-bold">{t('sellerSupport.videoTutorials.title')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg">
              {/* Embed video player here */}
              <div className="flex items-center justify-center">
                <p className="text-gray-500">{t('sellerSupport.videoTutorials.gettingStarted')}</p>
              </div>
            </div>
            <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg">
              {/* Embed video player here */}
              <div className="flex items-center justify-center">
                <p className="text-gray-500">{t('sellerSupport.videoTutorials.advancedTips')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerSupport;