import React, { useEffect, useState } from 'react';
import { Save, User, Bell, Lock, Globe, Palette, Mail, Package, Shield, Check } from 'lucide-react';
import { API_URL } from '../../config';
import { useTranslation } from 'react-i18next';

const Settings = () => {
  const { t, i18n } = useTranslation();
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'EasyCasse',
    siteDescription: 'Your trusted marketplace for quality auto parts',
    supportEmail: 'support@easycasse.com',
    timezone: 'Europe/Paris',
  });
  const [notificationSettings, setNotificationSettings] = useState({
    orderNotifications: true,
    productAlerts: true,
    newsletterUpdates: false,
    securityAlerts: true,
  });
  const [autoApproveEnabled, setAutoApproveEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  useEffect(() => {
    const fetchAutoApproveSettings = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${API_URL}/api/admin/settings/auto-approve`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        setAutoApproveEnabled(data.autoApprove);
      } catch (error) {
        console.error('Error fetching auto-approve settings:', error);
        setError('Failed to load auto-approve settings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAutoApproveSettings();
  }, []);

  const handleAutoApproveToggle = async (value: boolean) => {
    try {
      setIsLoading(true);
      setError(null);
      setMessage(null);
      
      console.log("Toggling auto-approve to:", value);
      
      const response = await fetch(`${API_URL}/api/admin/settings/auto-approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ autoApprove: value }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log("Auto-approve response:", data);
      
      setAutoApproveEnabled(data.setting.autoApprove);
      setMessage(t('settings.product.success'));
    } catch (error) {
      console.error('Error updating auto-approve setting:', error);
      setError(t('settings.product.error'));
      setAutoApproveEnabled(!value);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLanguageChange = (language: string) => {
    i18n.changeLanguage(language);
    setCurrentLanguage(language);
    console.log(`Language changed to: ${language}`);
  };

  const handleSaveChanges = () => {
    console.log('Saving all settings...');
    // Save general settings, notification settings, etc.
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">{t('settings.title')}</h1>
        <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
          <Save className="h-5 w-5 mr-2" />
          {t('settings.saveChanges')}
        </button>
      </div>

      <div className="space-y-6">
        {/* General Settings */}
        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">{t('settings.general.title')}</h2>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="siteName" className="block text-sm font-medium text-gray-700">
                  {t('settings.general.siteName')}
                </label>
                <input
                  type="text"
                  id="siteName"
                  value={generalSettings.siteName}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, siteName: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="siteDescription" className="block text-sm font-medium text-gray-700">
                  {t('settings.general.siteDescription')}
                </label>
                <textarea
                  id="siteDescription"
                  value={generalSettings.siteDescription}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, siteDescription: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="supportEmail" className="block text-sm font-medium text-gray-700">
                  {t('settings.general.supportEmail')}
                </label>
                <input
                  type="email"
                  id="supportEmail"
                  value={generalSettings.supportEmail}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, supportEmail: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {/* <div>
                <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
                  {t('settings.general.timezone')}
                </label>
                <select
                  id="timezone"
                  value={generalSettings.timezone}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, timezone: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Europe/Paris">Europe/Paris</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="Europe/Berlin">Europe/Berlin</option>
                </select>
              </div> */}
            </div>
          </div>
        </div>

        {/* Language Settings */}
        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Globe className="h-5 w-5 mr-2 text-gray-500" />
              {t('profile.settings.language')}
            </h2>
            <p className="text-sm text-gray-500 mb-4">{t('profile.settings.languageDescription')}</p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => handleLanguageChange('en')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  currentLanguage === 'en' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t('profile.settings.english')}
              </button>
              <button
                onClick={() => handleLanguageChange('fr')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  currentLanguage === 'fr' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t('profile.settings.french')}
              </button>
            </div>
          </div>
        </div>

         {/* Auto-Approve Settings */}
         <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">{t('admin.settings.product.title')}</h2>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center">
                <Check className="h-5 w-5 text-gray-500 mr-2" />
                <div>
                  <span className="text-sm font-medium text-gray-700">{t('admin.settings.product.autoApprove')}</span>
                  <p className="text-xs text-gray-500 mt-1">{t('admin.settings.product.autoApproveDescription')}</p>
                </div>
              </div>
              <div className="flex items-center">
                <span className={`mr-2 text-sm font-medium ${autoApproveEnabled ? 'text-green-600' : 'text-gray-500'}`}>
                  {autoApproveEnabled ? t('admin.settings.enabled') : t('admin.settings.disabled')}
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoApproveEnabled}
                    onChange={(e) => handleAutoApproveToggle(e.target.checked)}
                    className="sr-only peer"
                    disabled={isLoading}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
            {message && (
              <div className="mt-2 p-2 bg-green-50 text-green-700 text-sm rounded-md">
                {message}
              </div>
            )}
            {error && (
              <div className="mt-2 p-2 bg-red-50 text-red-700 text-sm rounded-md">
                {error}
              </div>
            )}
          </div>
        </div>
       
      </div>
    </div>
  );
};

export default Settings;