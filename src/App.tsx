import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar';
import Footer from './components/ui/Footer';
import BottomNavigation from './components/BottomNavigation';
import ScrollToTop from './components/ScrollToTop';
import clsx from 'clsx';
import Profile from "./pages/Profile";
import OrderDetails from "./pages/OrderDetails";

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import Categories from './pages/Categories';
import NewArrivals from './pages/NewArrivals';
import BestSellers from './pages/BestSellers';
import Deals from './pages/Deals';
import Sell from './pages/Sell';
import Messages from './pages/Messages';
import SellerGuidelines from './pages/SellerGuidelines';
import SellerDashboard from './pages/SellerDashboard';
// import Orders from './pages/seller/Orders';
// import AddListing from './pages/seller/AddListing';
// import Inventory from './pages/seller/Inventory';
// import SellerAnalytics from './pages/seller/Analytics';
import Shipping from './pages/Shipping';
import SellerSupport from './pages/SellerSupport';
import Help from './pages/Help';
import TrackOrder from './pages/TrackOrder';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Contact from './pages/Contact';
import Cookies from './pages/Cookies';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import Users from './pages/admin/Users';
import Products from './pages/admin/Products';
// import AdminOrders from './pages/admin/Orders';
import AdminAnalytics from './pages/admin/Analytics';
import Reports from './pages/admin/Reports';
import Settings from './pages/admin/Settings';
import SellerStore from './pages/SellerStore';
import Wishlist from './pages/Wishlist';
import Notifications from './pages/Notifications';
import UserSettings from './pages/UserSettings';
import SearchPage from './pages/SearchPage';
import ProductsPage from './pages/Home';
import ProductAdd from './pages/ProductAdd';
import AdminCategories from './pages/admin/Categories';
import ProductSuccess from './pages/ProductSuccess';
import SellerOrders from './pages/admin/SellerOrders';
import BannerManagement from './pages/admin/BannerManagement';
import CategoryAnalytics from "./pages/admin/CategoryAnalytics";

interface ProtectedRouteProps {
  children: React.ReactNode;
  role?: string;
  redirectTo?: string;
}

const ProtectedRoute = ({ children, role, redirectTo = '/login' }: ProtectedRouteProps) => {
  const isAuthenticated = localStorage.getItem('accessToken') !== null;
  const userRole = localStorage.getItem('userRole');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  console.log(user);

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} />;
  }

  if (role && userRole !== role) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

const AppContent = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [showBottomNav, setShowBottomNav] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [userRole, setUserRole] = useState<string | null>(null);

  const location = useLocation();
  const isSearchPage = location.pathname === '/products' || location.pathname.includes('/search');
  const isProductDetailPage = location.pathname.includes('/products/') && location.pathname !== '/products';
  const isProductListPage = location.pathname === '/products';
  const isProductAddPage = location.pathname === '/products/add';
  const isMessagePage = location.pathname === '/messages';
  const isprofilePage = location.pathname === '/profile';
  const isOrderDetailsPage = location.pathname.startsWith('/orders/');

  const isAdminPage = location.pathname.startsWith('/admin');

  useEffect(() => {
    // Set showBottomNav to true if on ProductList page
    if (isProductListPage) {
      setShowBottomNav(true);
    } else {
      // Optionally, you can set it to false for other pages if needed
      // setShowBottomNav(false);
    }
  }, [isProductListPage]);
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const role = localStorage.getItem('userRole');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    console.log(user, token, role);

    console.log('Current user role:', role);
    setUserRole(role);
  }, [location.pathname]);
  React.useEffect(() => {
    const handleInitialMobileState = () => {
      const isMobileDevice = window.innerWidth < 768;
      setIsMobile(isMobileDevice);

      if (isMobileDevice) {
        setIsMobileMenuOpen(false);
        setShowBottomNav(true);
      }
    };

    handleInitialMobileState();

    const handleResize = () => {
      const isMobileDevice = window.innerWidth < 768;
      setIsMobile(isMobileDevice);

      if (!isMobileDevice && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
        setShowBottomNav(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileMenuOpen]);

  const shouldShowNavbar = () => {
    // Check if user is logged in
    const isLoggedIn = !!userRole; // Assuming userRole is null/undefined when not logged in

    console.log("User Role:", userRole);
    console.log("Should Show Navbar:", userRole !== "admin" );

    // Hide navbar for logged-in admin/seller
    if (isLoggedIn && (userRole === "admin" )) return false;

    // Hide navbar for mobile on product pages
    if (isMobile && (isProductListPage || isProductDetailPage)) return false;

    // Hide navbar for mobile on messages page
    if (isMobile && isMessagePage) return false;
    
    // Hide navbar for mobile on profile page
    if(isMobile && isprofilePage) return false;

    // Hide navbar for mobile on ProductDetal page
    if(isMobile && isOrderDetailsPage) return false;

    // Show navbar for all other cases
    return true;
  };




  const handleMobileMenuToggle = (isOpen: boolean) => {
    setIsMobileMenuOpen(isOpen);
    setShowBottomNav(!isOpen);
  };
  const handleMobileSearchToggle = (isOpen: boolean) => {
    setIsMobileSearchOpen(isOpen);
    setShowBottomNav(!isOpen);
  };

  const handleBottomNavVisibilityChange = (isVisible: boolean) => {
    setShowBottomNav(isVisible);
  };

  const showMainNavbar = shouldShowNavbar();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ScrollToTop />

      {/* Show Navbar except on admin pages or for admin users */}
      {(!isProductAddPage || !isMobile) && showMainNavbar && (
        <Navbar
          onMobileMenuToggle={handleMobileMenuToggle}
          onMobileSearchToggle={handleMobileSearchToggle}
          onBottomNavVisibilityChange={handleBottomNavVisibilityChange}
        />
      )}

      <main
        className={clsx(
          "flex-grow",
          // CHANGE 5: Use the calculated visibility value here too
          (!isProductAddPage || !isMobile) && showMainNavbar && !isProductDetailPage && !isAdminPage && "mt-[102px]",
          (isProductAddPage && !isMobile && showMainNavbar) && "pt-[102px]"
        )}
      >
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/products"
            element={
              <ProductList
                onDialogVisibilityChange={handleMobileMenuToggle}
              />
            }
          />

          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/new-arrivals" element={<NewArrivals />} />
          <Route path="/best-sellers" element={<BestSellers />} />
          <Route path="/deals" element={<Deals />} />
          <Route path="/sell" element={<Sell />} />
          <Route path="/seller-guidelines" element={<SellerGuidelines />} />
          {/* <Route path="/shipping" element={<Shipping />} /> */}
          <Route path="/seller-support" element={<SellerSupport />} />
          <Route path="/help" element={<Help />} />
          <Route path="/track-order" element={<TrackOrder />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/cookies" element={<Cookies />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/seller/:sellerId" element={<SellerStore />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/add" element={<ProductAdd />} />
          <Route path="/product-success" element={<ProductSuccess />} />
          <Route path="/profile" element={<Profile />} />

          {/* Protected Routes */}
          <Route
            path="/orders/:id"
            element={
              <ProtectedRoute>
                <OrderDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wishlist"
            element={
              <ProtectedRoute>
                <Wishlist />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <UserSettings />
              </ProtectedRoute>
            }
          />

          {/* Protected Seller Routes */}
          <Route
            path="/seller/dashboard"
            element={
              <ProtectedRoute role="seller">
                <SellerDashboard />
              </ProtectedRoute>
            }
          />
          {/* <Route
            path="/seller/orders"
            element={
              <ProtectedRoute role="seller">
                <Orders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller/add-listing"
            element={
              <ProtectedRoute role="seller">
                <AddListing />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller/inventory"
            element={
              <ProtectedRoute role="seller">
                <Inventory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller/analytics"
            element={
              <ProtectedRoute role="seller">
                <SellerAnalytics />
              </ProtectedRoute>
            }
          /> */}

          {/* Protected Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="categories" element={<AdminCategories onSearch={(search: string) => {
              console.log(search);
            }} />} />
            <Route path="category-analytics" element={<CategoryAnalytics />} />
            <Route path="products" element={<Products />} />
            {/* <Route path="orders" element={<AdminOrders />} /> */}
            <Route path="seller-orders" element={<SellerOrders />} />
            <Route path="banner-management" element={<BannerManagement />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Catch all route - 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Show Footer except on admin pages or for admin users */}
      {(!isProductAddPage || !isMobile) && showMainNavbar && <Footer />}

      {/* Show BottomNavigation based on showBottomNav state */}
      {showBottomNav && !isMobileMenuOpen &&  (!isProductAddPage || !isMobile) && (
        !(isMobile && isProductDetailPage ) || isProductListPage ) && ( 
        <BottomNavigation
          className="md:hidden"
          isMobileMenuOpen={isMobileMenuOpen}
          isMobileSearchOpen={isMobileSearchOpen}
        />
      )}

    </div>
  );
};

const App = () => {
  return (
    <Provider store={store}>
      <AuthProvider>
        <SocketProvider>
          <Router>
            <AppContent />
          </Router>
        </SocketProvider>
      </AuthProvider>
    </Provider>
  );
};

export default App;