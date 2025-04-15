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
import SellerDetails from './pages/SellerDetails';
// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import Categories from './pages/Categories';
import NewArrivals from './pages/NewArrivals';
import BestSellers from './pages/BestSellers';
// import Deals from './pages/Deals';
import Sell from './pages/Sell';
import Messages from './pages/Messages';
import SellerGuidelines from './pages/SellerGuidelines';
import SellerDashboard from './pages/SellerDashboard';
import SellerAnalytics from './pages/admin/SellerAnalytics';
// import Analytics from './pages/Analytics';
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
import ContactMessages from './pages/admin/ContactMessages';
// import SellerStore from './pages/SellerStore';
import Wishlist from './pages/Wishlist';
import Notifications from './pages/Notifications';
import UserSettings from './pages/UserSettings';
import SearchPage from './pages/SearchPage';
import ProductsPage from './pages/Home';
import ProductAdd from './pages/ProductAdd';
import EditProduct from './pages/EditProduct';
import AdminCategories from './pages/admin/Categories';
import ProductSuccess from './pages/ProductSuccess';
import SellerOrders from './pages/admin/SellerOrders';
import BannerManagement from './pages/admin/BannerManagement';
import BrandManagement from './pages/admin/BrandManagement';
import CategoryAnalytics from "./pages/admin/CategoryAnalytics";
import Checkout from './pages/Checkout';
import TrackParcel from './pages/TrackParcel';
import ShippingForm from './components/ShippingForm';
import PickupRequest from './pages/PickupRequest';

interface ProtectedRouteProps {
  children: React.ReactNode;
  role?: string;
  redirectTo?: string;
}

// New component to redirect admin users
const AdminRedirect = ({ children }: { children: React.ReactNode }) => {
  const userRole = localStorage.getItem('userRole');
  const isAuthenticated = localStorage.getItem('accessToken') !== null;
  
  // If user is authenticated and has admin role, redirect to admin panel
  if (isAuthenticated && userRole === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  
  // Otherwise render the children component
  return <>{children}</>;
};

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
  const isCheckoutPage = location.pathname === '/checkout';
  const isOrderDetailsPage = location.pathname.startsWith('/orders/');
  const isSellerDetails = location.pathname.startsWith('/seller/');
  const isSellerSupport = location.pathname === '/seller-support';
  const isproductlistproduct = location.pathname.startsWith('/category/');
  const isTrackParcelPage = location.pathname === '/track-parcel';

  const isAdminPage = location.pathname.startsWith('/admin');

  // Initial redirect for admin users
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const role = localStorage.getItem('userRole');
    
    // If user is authenticated and has admin role
    if (token && role === 'admin') {
      // Only redirect if not already on an admin page
      if (!location.pathname.startsWith('/admin')) {
        // We can't use Navigate directly in useEffect, so we use window.location
        window.location.href = '/admin';
      }
    }
    
    setUserRole(role);
  }, []);

  useEffect(() => {
    if (isProductListPage) {
      setShowBottomNav(true);
    } else {
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
    
    // Hide navbar for mobile on Checkout page
    if(isMobile && isCheckoutPage) return false;
    
    // Hide navbar for mobile on Checkout page
    if(isMobile && isSellerDetails) return false;

    // Hide navbar for mobile on ProductDetal page
    if(isMobile && isOrderDetailsPage) return false;

    // Hide navbar for mobile on ProductDetal page
    if(isMobile && isproductlistproduct) return false;

    // Hide navbar for mobile on TrackParcel page
    if(isMobile && isTrackParcelPage) return false;

    // Hide navbar for mobile on SellerSupport page
    if(isMobile && isSellerSupport) return false;

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
          {/* Public Routes - Wrap Home with AdminRedirect */}
          <Route path="/" element={<AdminRedirect><Home /></AdminRedirect>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/products"
            element={
              <AdminRedirect>
                <ProductList
                  onDialogVisibilityChange={handleMobileMenuToggle}
                />
              </AdminRedirect>
            }
          />

          <Route path="/products/:id" element={<AdminRedirect><ProductDetail /></AdminRedirect>} />
          <Route path="/categories" element={<AdminRedirect><Categories /></AdminRedirect>} />
          <Route 
            path="/category/:categoryId" 
            element={
              <AdminRedirect>
                <ProductList
                  onDialogVisibilityChange={handleMobileMenuToggle}
                />
              </AdminRedirect>
            } 
          />
          <Route 
            path="/category/:categoryId/:itemId" 
            element={
              <AdminRedirect>
                <ProductList
                  onDialogVisibilityChange={handleMobileMenuToggle}
                />
              </AdminRedirect>
            } 
          />
          <Route path="/new-arrivals" element={<AdminRedirect><NewArrivals /></AdminRedirect>} />
          <Route path="/best-sellers" element={<AdminRedirect><BestSellers /></AdminRedirect>} />
          {/* <Route path="/deals" element={<Deals />} /> */}
          <Route path="/sell" element={<AdminRedirect><Sell /></AdminRedirect>} />
          <Route path="/seller-guidelines" element={<AdminRedirect><SellerGuidelines /></AdminRedirect>} />
          {/* <Route path="/shipping" element={<Shipping />} /> */}
          <Route path="/seller-support" element={<AdminRedirect><SellerSupport /></AdminRedirect>} />
          <Route path="/help" element={<AdminRedirect><Help /></AdminRedirect>} />
          <Route path="/track-order" element={<AdminRedirect><TrackOrder /></AdminRedirect>} />
          <Route path="/track-parcel" element={<AdminRedirect><TrackParcel /></AdminRedirect>} />
          <Route path="/shipping-form" element={<AdminRedirect><Shipping  /></AdminRedirect>} />
          <Route path="/terms" element={<AdminRedirect><Terms /></AdminRedirect>} />
          <Route path="/privacy" element={<AdminRedirect><Privacy /></AdminRedirect>} />
          <Route path="/cookies" element={<AdminRedirect><Cookies /></AdminRedirect>} />
          <Route path="/contact" element={<AdminRedirect><Contact /></AdminRedirect>} />
          <Route path="/seller/:sellerId" element={<AdminRedirect><SellerDetails /></AdminRedirect>} />
          <Route path="/search" element={<AdminRedirect><SearchPage /></AdminRedirect>} />
          <Route path="/products" element={<AdminRedirect><ProductsPage /></AdminRedirect>} />
          <Route path="/products/add" element={<AdminRedirect><ProductAdd /></AdminRedirect>} />
          <Route 
            path="/products/:id/edit" 
            element={
              <ProtectedRoute>
                <AdminRedirect><EditProduct /></AdminRedirect>
              </ProtectedRoute>
            } 
          />
          <Route path="/product-success" element={<AdminRedirect><ProductSuccess /></AdminRedirect>} />
          <Route path="/profile" element={<AdminRedirect><Profile /></AdminRedirect>} />
          <Route path="/checkout" element={<AdminRedirect><Checkout /></AdminRedirect>} />

          {/* Protected Routes */}
          <Route
            path="/orders/:id"
            element={
              <ProtectedRoute>
                <AdminRedirect><OrderDetails /></AdminRedirect>
              </ProtectedRoute>
            }
          />
          <Route
            path="/pickup-request/:id"
            element={
              <ProtectedRoute>
                <AdminRedirect><PickupRequest /></AdminRedirect>
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <AdminRedirect><Messages /></AdminRedirect>
              </ProtectedRoute>
            }
          />
          <Route
            path="/wishlist"
            element={
              <ProtectedRoute>
                <AdminRedirect><Wishlist /></AdminRedirect>
              </ProtectedRoute>
            }
          />
          {/* <Route
            path="/seller-analytics"
            element={
              <ProtectedRoute>
                <AdminRedirect><Analytics /></AdminRedirect>
              </ProtectedRoute>
            }
          /> */}
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <AdminRedirect><Notifications /></AdminRedirect>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <AdminRedirect><UserSettings /></AdminRedirect>
              </ProtectedRoute>
            }
          />

          {/* Protected Seller Routes */}
          <Route
            path="/seller/dashboard"
            element={
              <ProtectedRoute role="seller">
                <AdminRedirect><SellerDashboard /></AdminRedirect>
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller/analytics"
            element={
              <ProtectedRoute role="seller">
                <AdminRedirect><SellerAnalytics /></AdminRedirect>
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
            <Route path="brand-management" element={<BrandManagement />} />
            <Route path="contact-messages" element={<ContactMessages />} />
            <Route path="seller-analytics" element={<SellerAnalytics />} />
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