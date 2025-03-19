import React from 'react';
import { ExpandableTabs } from './ui/ExpandableTabs';
import { MessageSquare, ShoppingBag, Bell, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

const SubMenu = () => {
  const { t } = useTranslation();
  const location = useLocation();
  
  const tabs = [
    { title: t('common.messages'), icon: MessageSquare, path: '/messages' },
    { title: t('nav.sell'), icon: ShoppingBag, path: '/sell' },
    { type: "separator" as const },
    { title: t('common.notifications'), icon: Bell, path: '/notifications' },
    { title: t('common.settings'), icon: Settings, path: '/settings' }
  ];

  // Check if we're on a page that needs the submenu
  const isActivePage = tabs.some(tab => 
    typeof tab.path === 'string' && location.pathname.startsWith(tab.path)
  );

  return (
    <div className={`bg-gray-50 border-b border-gray-200 py-2 ${isActivePage ? 'block' : 'hidden md:block'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ExpandableTabs tabs={tabs} />
      </div>
    </div>
  );
};

export default SubMenu;