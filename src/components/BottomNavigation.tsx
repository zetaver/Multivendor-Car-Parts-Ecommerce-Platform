import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import SellDialog from './SellDialog';

interface BottomNavigationProps {
  className?: string;
  isMobileMenuOpen?: boolean;
  isMobileSearchOpen: boolean;
}

const BottomNavigation = ({ className = '', isMobileMenuOpen = false, isMobileSearchOpen = false }: BottomNavigationProps) => {
  const [sellDialogOpen, setSellDialogOpen] = React.useState(false);
  const location = useLocation();
  
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { user } = useSelector((state: RootState) => state.auth);

  const navItems = [
    { label: 'Home', path: '/', icon: 'M3 9.5L12 4L21 9.5 M19 13V19.4C19 19.7314 18.7314 20 18.4 20H5.6C5.26863 20 5 19.7314 5 19.4V13' },
    { label: 'Search', path: '/products', icon: 'M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z M21 21L16.65 16.65' },
    { label: 'Sell', path: '/sell', isSell: true },
    { label: 'Messages', path: isAuthenticated ? '/messages' : '/contact', icon: 'M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z' },
    { label: 'Profile', path: isAuthenticated ? '/profile' : '/login', icon: 'M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21 M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z' },
  ];

  const handleNavigation = (item: typeof navItems[0]) => {
    if (item.isSell) {
      if (isAuthenticated) {
        // Check if user is a seller or not
        const userObj = JSON.parse(localStorage.getItem('user') || '{}');
        const userRole = userObj?.role || user?.role || '';
        
        if (userRole === 'user') {
          // If user role is not seller, redirect to profile page
          navigate('/profile?tab=profile');
        } else {
          // If user is a seller, navigate to add product page
          navigate('/products/add');
        }
      } else {
        setSellDialogOpen(true);
      }
    } else {
      navigate(item.path);
    }
  };

  const isPathActive = (itemPath: string) => location.pathname === itemPath;

  return (
    <>
      {!isMobileMenuOpen && !isMobileSearchOpen && location.pathname !== '/search' && (
        <nav 
          data-bottom-nav 
          className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 ${className}`}
        >
          <div className="flex justify-around items-center h-16">
            {navItems.map((item) => {
              const isActive = isPathActive(item.path);

              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item)}
                  className={`flex flex-col items-center justify-center flex-1 h-full focus:outline-none ${
                    item.isSell ? 'relative' : ''
                  }`}
                >
                  {item.isSell ? (
                    <div className="w-14 h-14 bg-primary text-secondary-dark rounded-full flex items-center justify-center text-xl -translate-y-3 shadow-md hover:bg-primary-dark transition-colors">
                      +
                    </div>
                  ) : (
                    <div className={`flex flex-col items-center ${
                      isActive ? 'text-primary' : 'text-gray-500 hover:text-gray-700'
                    }`}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d={item.icon} />
                      </svg>
                      <span className={`text-xs mt-1 ${isActive ? 'font-medium' : ''}`}>{item.label}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* Sell Dialog */}
      <SellDialog 
        isOpen={sellDialogOpen}
        onClose={() => setSellDialogOpen(false)}
        onOpenChange={(isOpen) => setSellDialogOpen(isOpen)}
      />
    </>
  );
};

export default BottomNavigation;
