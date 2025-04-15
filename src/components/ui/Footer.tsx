import React from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingBag, HelpCircle, Facebook, Twitter, Instagram } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();
  
  return (
    <footer className="bg-[#1E1E2D] border-t border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-6">
          {/* Brand Section */}
          <div className="col-span-2 mb-8 lg:mb-0">
            <div className="flex items-center gap-2 lg:justify-start">
              <Link to="/" className="flex items-center space-x-2">
                <img
                  src="https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&q=80&w=100"
                  alt="EasyCasse Logo"
                  className="h-10 w-10 rounded-full object-cover"
                />
                <span className="text-xl font-bold text-[#FFB800]">EasyCasse</span>
              </Link>
            </div>
            <p className="mt-4 text-gray-300">{t('footer.tagline')}</p>
            <div className="mt-6 flex space-x-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-[#FFB800]">
                <Facebook className="h-6 w-6" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-[#FFB800]">
                <Twitter className="h-6 w-6" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-[#FFB800]">
                <Instagram className="h-6 w-6" />
              </a>
            </div>
          </div>

          {/* Products Section */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">{t('footer.sections.products.title')}</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link to="/products" className="text-base text-gray-300 hover:text-[#FFB800]">
                  {t('footer.sections.products.allParts')}
                </Link>
              </li>
              <li>
                <Link to="/categories" className="text-base text-gray-300 hover:text-[#FFB800]">
                  {t('footer.sections.products.categories')}
                </Link>
              </li>
              <li>
                <Link to="/new-arrivals" className="text-base text-gray-300 hover:text-[#FFB800]">
                  {t('footer.sections.products.newArrivals')}
                </Link>
              </li>
              <li>
                <Link to="/best-sellers" className="text-base text-gray-300 hover:text-[#FFB800]">
                  {t('footer.sections.products.bestSellers')}
                </Link>
              </li>
              {/* <li>
                <Link to="/deals" className="text-base text-gray-300 hover:text-[#FFB800]">
                  Deals
                </Link>
              </li> */}
            </ul>
          </div>

          {/* Sell Section */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">{t('footer.sections.sell.title')}</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link to="/sell" className="text-base text-gray-300 hover:text-[#FFB800]">
                  {t('footer.sections.sell.startSelling')}
                </Link>
              </li>
              <li>
                <Link to="/seller-guidelines" className="text-base text-gray-300 hover:text-[#FFB800]">
                  {t('footer.sections.sell.sellerGuidelines')}
                </Link>
              </li>
              {/* <li>
                <Link to="/seller/dashboard" className="text-base text-gray-300 hover:text-[#FFB800]">
                  Seller Dashboard
                </Link>
              </li> */}
              <li>
                <Link to="/seller-support" className="text-base text-gray-300 hover:text-[#FFB800]">
                  {t('footer.sections.sell.sellerSupport')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Section */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">{t('footer.sections.support.title')}</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link to="/help" className="text-base text-gray-300 hover:text-[#FFB800]">
                  {t('footer.sections.support.helpCenter')}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-base text-gray-300 hover:text-[#FFB800]">
                  {t('footer.sections.support.contactUs')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Section */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">{t('footer.sections.legal.title')}</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link to="/terms" className="text-base text-gray-300 hover:text-[#FFB800]">
                  {t('footer.sections.legal.termsOfService')}
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-base text-gray-300 hover:text-[#FFB800]">
                  {t('footer.sections.legal.privacyPolicy')}
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="text-base text-gray-300 hover:text-[#FFB800]">
                  {t('footer.sections.legal.cookiePolicy')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 border-t border-gray-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-base text-gray-300">{t('footer.copyright')}</p>
            <ul className="flex flex-wrap justify-center space-x-6">
              <li>
                <Link to="/terms" className="text-sm text-gray-300 hover:text-[#FFB800]">
                  {t('footer.sections.legal.termsOfService')}
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-sm text-gray-300 hover:text-[#FFB800]">
                  {t('footer.sections.legal.privacyPolicy')}
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="text-sm text-gray-300 hover:text-[#FFB800]">
                  {t('footer.sections.legal.cookiePolicy')}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;