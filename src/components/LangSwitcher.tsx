import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { Globe } from 'lucide-react';

interface LangSwitcherProps {
  className?: string;
}

const LangSwitcher: React.FC<LangSwitcherProps> = ({ className = '' }) => {
  const { t } = useTranslation();
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Check if mobile or desktop on mount and window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Close the language menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Function to change language
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setIsLangMenuOpen(false);
  };

  // Get language display names
  const getLanguageName = (code: string) => {
    switch(code) {
      case 'en': return 'English';
      case 'fr': return 'Français';
      default: return code.toUpperCase();
    }
  };
  
  // Get language code
  const getLanguageCode = (code: string) => {
    switch(code) {
      case 'en': return 'EN';
      case 'fr': return 'FR';
      default: return code.toUpperCase();
    }
  };

  // Mobile dropdown UI
  const renderMobileDropdown = () => (
    <div className="fixed right-0 top-16 mt-1 bg-white rounded-md shadow-lg overflow-hidden w-[140px] z-[9999]">
      {['en', 'fr'].map(lang => (
        <button
          key={lang}
          onClick={() => changeLanguage(lang)}
          className="w-full py-3 flex items-center hover:bg-gray-50"
        >
          <div className="flex items-center px-3">
            <span className="bg-amber-400 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-2">
              {getLanguageCode(lang)}
            </span>
            <span className="text-sm">
              {getLanguageName(lang)}
            </span>
          </div>
        </button>
      ))}
    </div>
  );

  // Desktop dropdown UI
  const renderDesktopDropdown = () => (
    <div className="absolute right-0 top-full mt-1 bg-white rounded-md shadow-lg overflow-hidden border border-gray-100 w-auto z-[100]">
      {['en', 'fr'].map(lang => (
        <button
          key={lang}
          onClick={() => changeLanguage(lang)}
          className={`w-full text-left px-4 py-2.5 flex items-center hover:bg-gray-50 transition-colors ${
            i18n.language === lang ? 'bg-gray-50 font-medium' : 'text-gray-700'
          }`}
        >
          <div className="flex items-center w-full space-x-2">
            <span className="bg-amber-400 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
              {getLanguageCode(lang)}
            </span>
            <span className="text-sm">
              {getLanguageName(lang)}
            </span>
          </div>
        </button>
      ))}
    </div>
  );

  return (
    <div 
      ref={langMenuRef}
      className={`${className} relative`}
    >
      <button 
        onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
        className={isMobile 
          ? "bg-transparent p-2 flex items-center justify-center" 
          : "flex items-center justify-center bg-white rounded-full py-1.5 px-3 shadow-sm transition-all duration-200 border border-gray-200 hover:bg-gray-50"
        }
        aria-label="Change language"
      >
        {isMobile ? (
          <span className="bg-amber-400 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
            {getLanguageCode(i18n.language)}
          </span>
        ) : (
          <div className="flex items-center space-x-1">
            <span className="bg-amber-400 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">{getLanguageCode(i18n.language)}</span>
            <span className="text-sm font-medium">{getLanguageName(i18n.language)}</span>
          </div>
        )}
      </button>
      
      {isLangMenuOpen && (isMobile ? renderMobileDropdown() : renderDesktopDropdown())}
    </div>
  );
};

export default LangSwitcher; 