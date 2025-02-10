import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Heart,
  Share2,
  Shield,
  Truck,
  MessageCircle,
  Star,
  Info,
  AlertCircle,
  Check,
  MapPin,
  Package,
  ArrowLeft,
  ArrowRight,
  DollarSign,
  Store,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
} from 'lucide-react';

interface SimilarProduct {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  image: string;
  condition?: string;
  negotiable?: boolean;
}

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [offerAmount, setOfferAmount] = useState('');
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const product = {
    id: '1',
    title: 'High Performance Engine Filter',
    condition: 'Used - Excellent',
    price: 49.99,
    originalPrice: 79.99,
    discount: 38,
    description: `Premium quality engine filter compatible with multiple vehicle models. Provides superior filtration and engine protection.

    • Original equipment manufacturer (OEM) quality
    • Enhanced filtration efficiency
    • Extended service life
    • Easy installation
    `,
    specifications: {
      brand: 'TechFilter Pro',
      model: 'TF-2000X',
      compatibility: 'Universal Fit',
      material: 'High-grade synthetic fiber',
      dimensions: '10" x 5" x 5"',
      weight: '450g',
    },
    oemNumber: 'TF2000X-123',
    compatibility: [
      { make: 'Toyota', model: 'Camry', years: '2018-2022' },
      { make: 'Honda', model: 'Accord', years: '2019-2023' },
      { make: 'Volkswagen', model: 'Golf', years: '2017-2021' },
    ],
    images: [
      'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1486754735734-325b5831c3ad?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1562426509-5044a121aa49?auto=format&fit=crop&q=80&w=1200',
    ],
    seller: {
      id: '123',
      name: 'Auto Parts Pro',
      rating: 4.8,
      sales: 1234,
      location: 'Paris, France',
      responseTime: '< 2 hours',
      logo: '/images/auto-parts-pro-logo.png'
    },
    stock: 5,
    shipping: {
      free: true,
      estimated: '2-3 business days',
      returns: '30-day returns',
    },
  };

  const similarProducts: SimilarProduct[] = [
    {
      id: '1',
      title: 'THE SPORTSMAN The Miura',
      price: 80,
      image: 'https://images.unsplash.com/photo-1486754735734-325b5831c3ad?auto=format&fit=crop&q=80&w=1200',
      condition: 'Delivery available'
    },
    {
      id: '2',
      title: 'SIMOND Edge Soft',
      price: 90,
      image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&q=80&w=1200',
      condition: 'Like new'
    },
    {
      id: '3',
      title: 'SIMOND Edge Soft',
      price: 90,
      image: 'https://images.unsplash.com/photo-1562426509-5044a121aa49?auto=format&fit=crop&q=80&w=1200',
      condition: 'No addictions'
    }
  ];

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % product.images.length);
  };

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + product.images.length) % product.images.length);
  };

  const handleMakeOffer = () => {
    setShowOfferModal(true);
  };

  const handleSubmitOffer = () => {
    if (!offerAmount) return;
    
    console.log('Offer submitted:', offerAmount);
    setShowOfferModal(false);
    setOfferAmount('');
  };

  const handleViewStore = (sellerId: string) => {
    navigate(`/seller/${sellerId}`);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile View */}
      <div className="md:hidden flex flex-col min-h-screen">
        {/* Mobile Header */}
        <div className="fixed top-0 left-0 right-0 bg-white z-50 p-4 flex justify-between items-center border-b">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex gap-2">
            <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100">
              <Share2 className="w-5 h-5" />
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100">
              <Heart className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Content */}
        <div className="flex-1 pb-[80px]">
          {/* Image Slider */}
          <div className="relative w-full aspect-square bg-gray-100">
            <img
              src={product.images[currentImageIndex]}
              alt={product.title}
              className="w-full h-full object-cover"
            />
            <button 
              onClick={() => setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shadow-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setCurrentImageIndex((prev) => (prev + 1) % product.images.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shadow-lg"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1 rounded-full">
              {currentImageIndex + 1}/{product.images.length}
            </div>
          </div>

          {/* Product Info */}
          <div className="px-4 py-6 space-y-6">
            <div>
              <h1 className="text-2xl font-semibold mb-3">{product.title}</h1>
              
              <div className="p-4 bg-gray-50 rounded-lg mb-4">
                <p className="text-sm text-gray-600 whitespace-pre-line">{product.description}</p>
              </div>

              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-2xl font-bold">${product.price}</span>
                <span className="text-sm text-gray-500">
                  ${(product.price * 1.12).toFixed(2)} service fees included
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>{product.seller.name}</span>
                <span>•</span>
                <span>Size: {product.specifications.dimensions}</span>
              </div>
            </div>

            {/* Seller Card - Updated spacing */}
            <div className="border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                  <img 
                    src={product.seller.logo}
                    alt={product.seller.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/images/default-store-logo.png';
                    }}
                  />
                </div>
                <div className="flex-grow">
                  <div className="font-medium">{product.seller.name}</div>
                  <div className="text-sm text-gray-500">Partner brand</div>
                  <div className="text-sm text-gray-500">{product.seller.location}</div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button 
                  onClick={() => handleViewStore(product.seller.id)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  View Store
                </button>
                <button className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                  Contact Seller
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Bottom Buttons */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex gap-3">
          <button 
            onClick={handleMakeOffer}
            className="flex-1 py-3 px-4 border border-secondary rounded-lg font-medium hover:bg-gray-50"
          >
            Make an offer
          </button>
          <button className="flex-1 py-3 px-4 bg-primary text-secondary-dark rounded-lg font-medium hover:bg-primary-dark transition-colors">
            Buy Now
          </button>
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden md:block mt-16">
        <div className="max-w-4xl mx-auto px-8 py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-8">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 hover:text-gray-700">
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <span>/</span>
            <span>Auto Parts</span>
          </nav>

          {/* Main Content */}
          <div className="grid grid-cols-12 gap-8">
            {/* Left Column - Images */}
            <div className="col-span-7 relative">
              <div className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 relative group max-w-[500px]">
                <img
                  src={product.images[currentImageIndex]}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
                <button 
                  onClick={() => setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button 
                  onClick={() => setCurrentImageIndex((prev) => (prev + 1) % product.images.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-4 mt-4 max-w-[500px]">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`aspect-square rounded-lg overflow-hidden transition-all
                      ${currentImageIndex === index 
                        ? 'ring-2 ring-primary ring-offset-2' 
                        : 'hover:opacity-80'
                      }`}
                  >
                    <img src={image} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column - Product Info */}
            <div className="col-span-5 space-y-6">
              {/* Seller Note */}
              <div className="p-5 bg-gray-50 rounded-xl">
                <h3 className="font-medium text-lg mb-3">Word from the seller</h3>
                <p className="text-gray-600">{product.description}</p>
                <p className="text-gray-400 text-sm mt-3">#{id}</p>
              </div>

              {/* Product Details */}
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-semibold mb-1">{product.title}</h1>
                  <p className="text-gray-600">{product.seller.name}</p>
                  <p className="text-gray-600">Size: {product.specifications.dimensions}</p>
                </div>

                <div className="flex items-baseline gap-4">
                  <span className="text-3xl font-bold">${product.price}</span>
                  <span className="text-gray-500">
                    ${(product.price * 1.12).toFixed(2)} service fees included
                  </span>
                </div>

                {/* Condition */}
                <div className="p-5 bg-gray-50 rounded-xl">
                  <h3 className="font-medium text-lg mb-2">{product.condition}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {product.description}
                  </p>
                </div>

                {/* Seller Info */}
                <div className="border rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                      <img 
                        src={product.seller.logo}
                        alt={product.seller.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/images/default-store-logo.png';
                        }}
                      />
                    </div>
                    <div className="flex-grow">
                      <div className="font-medium">{product.seller.name}</div>
                      <div className="text-sm text-gray-500">Partner brand</div>
                      <div className="text-sm text-gray-500">{product.seller.location}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button 
                      onClick={() => handleViewStore(product.seller.id)}
                      className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      View Store
                    </button>
                    <button className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                      Contact Seller
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={handleMakeOffer}
                    className="flex-1 py-3.5 px-6 border border-secondary rounded-xl font-medium hover:bg-gray-50 transition-colors"
                  >
                    Make an offer
                  </button>
                  <button className="flex-1 py-3.5 px-6 bg-primary text-secondary-dark rounded-xl font-medium hover:bg-primary-dark transition-colors">
                    Buy Now
                  </button>
                </div>
                <button 
                  onClick={() => {/* Add your view details logic here */}}
                  className="w-full py-3 px-6 text-secondary border border-secondary rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  View Full Details
                </button>
              </div>
            </div>
          </div>

          {/* Similar Products */}
          <div className="mt-16">
            <h2 className="text-2xl font-semibold mb-6">Similar Products</h2>
            <div className="grid grid-cols-4 gap-6">
              {similarProducts.map((product) => (
                <div key={product.id} className="flex flex-col bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="aspect-square w-full overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4 flex flex-col flex-grow">
                    <h3 className="font-medium text-sm mb-2 line-clamp-2 flex-grow">
                      {product.title}
                    </h3>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold">${product.price}</span>
                      {product.condition && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {product.condition}
                        </span>
                      )}
                    </div>
                    <button 
                      onClick={() => navigate(`/products/${product.id}`)}
                      className="w-full py-2 px-4 text-sm text-secondary border border-secondary rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Make Offer Modal */}
      {showOfferModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Make an Offer</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="offerAmount" className="block text-sm font-medium text-gray-700 mb-1">
                  Your Offer Amount ($)
                </label>
                <input
                  type="number"
                  id="offerAmount"
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Enter amount"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowOfferModal(false)}
                  className="flex-1 py-2.5 px-4 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitOffer}
                  className="flex-1 py-2.5 px-4 bg-primary text-secondary-dark rounded-lg font-medium hover:bg-primary-dark"
                >
                  Send Offer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;

<style jsx>{`
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`}</style>