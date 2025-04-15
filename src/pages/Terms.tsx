import React from 'react';
import { FileText, Shield, Scale, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Terms = () => {
  const { t } = useTranslation();
  
  // Define the sections using translation keys
  const sections = [
    {
      title: t('terms.sections.acceptance.title'),
      content: t('terms.sections.acceptance.content'),
    },
    {
      title: t('terms.sections.accounts.title'),
      content: t('terms.sections.accounts.content'),
    },
    {
      title: t('terms.sections.listings.title'),
      content: t('terms.sections.listings.content'),
    },
    {
      title: t('terms.sections.payment.title'),
      content: t('terms.sections.payment.content'),
    },
    {
      title: t('terms.sections.shipping.title'),
      content: t('terms.sections.shipping.content'),
    },
    {
      title: t('terms.sections.returns.title'),
      content: t('terms.sections.returns.content'),
    },
  ];

  // Get important notices as an array from translation
  const importantNotices = t('terms.importantNotices.items', { returnObjects: true }) as string[];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-[#1E1E2D] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FileText className="w-16 h-16 text-[#FFB800] mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-4">{t('terms.title')}</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            {t('terms.subtitle')}
          </p>
        </div>
      </div>

      {/* Last Updated */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-sm text-gray-500">
          {t('terms.lastUpdated')}
        </div>
      </div>

      {/* Terms Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-8">
            <div className="prose prose-blue max-w-none">
              <p className="text-gray-600">
                {t('terms.introduction')}
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
                  <h3 className="text-lg font-semibold text-yellow-800">{t('terms.importantNotices.title')}</h3>
                </div>
                <ul className="list-disc pl-5 space-y-2 text-yellow-700">
                  {importantNotices.map((notice, index) => (
                    <li key={index}>{notice}</li>
                  ))}
                </ul>
              </div>

              {/* Contact Information */}
              <div className="mt-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('terms.contact.title')}</h2>
                <p className="text-gray-600">
                  {t('terms.contact.text')}
                </p>
                <ul className="mt-4 space-y-2 text-gray-600">
                  <li>{t('terms.contact.email')}</li>
                  <li>{t('terms.contact.address')}</li>
                  <li>{t('terms.contact.phone')}</li>
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