import React from 'react';
import { Lock, Shield, Eye, Database, Bell, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Privacy = () => {
  const { t } = useTranslation();

  const sections = [
    {
      icon: <Database className="w-6 h-6 text-[#FFB800]" />,
      title: t('privacy.sections.informationWeCollect.title'),
      content: t('privacy.sections.informationWeCollect.content', { returnObjects: true }) as string[],
    },
    {
      icon: <Eye className="w-6 h-6 text-[#FFB800]" />,
      title: t('privacy.sections.howWeUseInformation.title'),
      content: t('privacy.sections.howWeUseInformation.content', { returnObjects: true }) as string[],
    },
    {
      icon: <Shield className="w-6 h-6 text-[#FFB800]" />,
      title: t('privacy.sections.dataProtection.title'),
      content: t('privacy.sections.dataProtection.content', { returnObjects: true }) as string[],
    },
    {
      icon: <Bell className="w-6 h-6 text-[#FFB800]" />,
      title: t('privacy.sections.yourPrivacyRights.title'),
      content: t('privacy.sections.yourPrivacyRights.content', { returnObjects: true }) as string[],
    },
  ];

  // Get cookie policy content from the translations
  const cookieSection = t('privacy.sections.cookiePolicy', { returnObjects: true }) as { 
    title: string, 
    content: string[] 
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-[#1E1E2D] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Lock className="w-16 h-16 text-[#FFB800] mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-4">{t('privacy.title')}</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            {t('privacy.subtitle')}
          </p>
        </div>
      </div>

      {/* Last Updated */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-sm text-gray-500">
          {t('privacy.lastUpdated')}
        </div>
      </div>

      {/* Privacy Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-8">
            <div className="prose prose-blue max-w-none">
              <p className="text-gray-600">
                {t('privacy.introduction')}
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
                  <h2 className="text-2xl font-bold text-[#1E1E2D]">{cookieSection.title}</h2>
                </div>
                <div className="space-y-3">
                  <ul className="space-y-3">
                    {cookieSection.content.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start">
                        <span className="text-[#FFB800] mr-2">•</span>
                        <span className="text-gray-600">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Contact Information */}
              <div className="mt-12">
                <h2 className="text-2xl font-bold text-[#1E1E2D] mb-4">
                  {t('privacy.sections.contactUs.title')}
                </h2>
                <ul className="mt-4 space-y-2 text-gray-600">
                  {(t('privacy.sections.contactUs.content', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* Updates to Privacy Policy */}
              <div className="mt-12 bg-[#1E1E2D] rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-2">
                  {t('privacy.sections.updates.title')}
                </h3>
                <div className="space-y-2">
                  {(t('privacy.sections.updates.content', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                    <p key={index} className="text-gray-300">{item}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;