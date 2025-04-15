import React from 'react';
import { Cookie, Shield, Settings, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Cookies = () => {
  const { t } = useTranslation();

  // Get cookie types from translations
  const cookieTypes = t('cookies.sections.typesOfCookies.types', { returnObjects: true }) as Array<{
    name: string;
    description: string;
  }>;

  // Get managing cookie options from translations
  const managingOptions = t('cookies.sections.managingCookies.options', { returnObjects: true }) as string[];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-[#1E1E2D] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Cookie className="w-16 h-16 text-[#FFB800] mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-4">{t('cookies.title')}</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            {t('cookies.subtitle')}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-8">
            <div className="prose prose-blue max-w-none">
              <p className="text-gray-600">
                {t('cookies.introduction')}
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
                {t('cookies.sections.whatAreCookies.title')}
              </h2>
              <p className="text-gray-600">
                {t('cookies.sections.whatAreCookies.content')}
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
                {t('cookies.sections.typesOfCookies.title')}
              </h2>
              <div className="space-y-4">
                {cookieTypes.map((cookieType, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900">{cookieType.name}</h3>
                    <p className="text-gray-600">{cookieType.description}</p>
                  </div>
                ))}
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
                {t('cookies.sections.managingCookies.title')}
              </h2>
              <p className="text-gray-600 mb-4">
                {t('cookies.sections.managingCookies.intro')}
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                {managingOptions.map((option, index) => (
                  <li key={index}>{option}</li>
                ))}
              </ul>

              <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-yellow-600 mr-2" />
                  <h3 className="text-lg font-semibold text-yellow-800">
                    {t('cookies.sections.importantNotice.title')}
                  </h3>
                </div>
                <p className="text-yellow-700">
                  {t('cookies.sections.importantNotice.content')}
                </p>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
                {t('cookies.sections.updatesPolicy.title')}
              </h2>
              <p className="text-gray-600">
                {t('cookies.sections.updatesPolicy.content')}
              </p>

              <div className="mt-8 bg-[#1E1E2D] rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  {t('cookies.sections.contactUs.title')}
                </h3>
                <p className="text-gray-300">
                  {t('cookies.sections.contactUs.intro')}
                </p>
                <ul className="mt-4 space-y-2 text-gray-300">
                  <li>{t('cookies.sections.contactUs.email')}</li>
                  <li>{t('cookies.sections.contactUs.phone')}</li>
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