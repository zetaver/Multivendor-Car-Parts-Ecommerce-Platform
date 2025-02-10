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
      'https://images.unsplash.com/photo-1537378235181-3b3396b0b089?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1562426509-5044a121aa49?auto=format&fit=crop&q=80&w=1200',
    ],
    seller: {
      id: '123',
      name: 'Auto Parts Pro',
      rating: 4.8,
      sales: 1234,
      location: 'Paris, France',
      responseTime: '< 2 hours',
    },
    stock: 5,
    shipping: {
      free: true,
      estimated: '2-3 business days',
      returns: '30-day returns',
    },
  };

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
    console.log('Offer submitted:', offerAmount);
    setShowOfferModal(false);
    setOfferAmount('');
  };

  const handleViewStore = () => {
    navigate(`/seller/${product.seller.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="relative aspect-w-4 aspect-h-3 rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={product.images[selectedImage]}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow-lg"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow-lg"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-4">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative rounded-lg overflow-hidden aspect-w-1 aspect-h-1 ${
                      selectedImage === index ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    <img
                      src={image}
                      alt={`Product ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {product.title}
                </h1>
                <div className="flex items-center space-x-4">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {product.condition}
                  </span>
                  <span className="text-sm text-gray-500">
                    OEM: {product.oemNumber}
                  </span>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-baseline space-x-4">
                <span className="text-3xl font-bold text-gray-900">
                  €{product.price}
                </span>
                {product.originalPrice && (
                  <>
                    <span className="text-lg text-gray-500 line-through">
                      €{product.originalPrice}
                    </span>
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                      -{product.discount}%
                    </span>
                  </>
                )}
              </div>

              {/* Stock Status */}
              <div className="flex items-center space-x-2 text-sm">
                <Package className="w-4 h-4 text-green-500" />
                <span className="text-green-600 font-medium">
                  In Stock
                </span>
                <span className="text-gray-500">
                  ({product.stock} available)
                </span>
              </div>

              {/* Shipping Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center space-x-3">
                  <Truck className="w-5 h-5 text-blue-600" />
                  <div>
                    <span className="font-medium text-gray-900">
                      {product.shipping.free ? 'Free Shipping' : 'Standard Shipping'}
                    </span>
                    <p className="text-sm text-gray-500">
                      Estimated delivery: {product.shipping.estimated}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <div>
                    <span className="font-medium text-gray-900">
                      Buyer Protection
                    </span>
                    <p className="text-sm text-gray-500">
                      {product.shipping.returns}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quantity Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 border rounded-md hover:bg-gray-50"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 text-center border-gray-300 rounded-md"
                    min="1"
                    max={product.stock}
                  />
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="p-2 border rounded-md hover:bg-gray-50"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col space-y-4">
                <div className="flex space-x-4">
                  <button 
                    onClick={handleMakeOffer}
                    className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 flex items-center justify-center"
                  >
                    <DollarSign className="w-5 h-5 mr-2" />
                    Make an Offer
                  </button>
                  <button 
                    className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 flex items-center justify-center"
                  >
                    Buy Now
                  </button>
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={handleViewStore}
                    className="flex-1 border border-blue-600 text-blue-600 py-3 px-6 rounded-lg hover:bg-blue-50 flex items-center justify-center"
                  >
                    <Store className="w-5 h-5 mr-2" />
                    View Store
                  </button>
                  <button className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <Heart className="w-5 h-5 text-gray-400" />
                  </button>
                  <button className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <Share2 className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Seller Info */}
              <div className="border-t pt-6">
                <div className="flex items-center space-x-4">
                  <img
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=48&h=48&q=80"
                    alt={product.seller.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {product.seller.name}
                    </h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span>{product.seller.rating}</span>
                      <span>•</span>
                      <span>{product.seller.sales} sales</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-6 text-sm text-gray-500 mt-4">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {product.seller.location}
                  </div>
                  <div className="flex items-center">
                    <MessageCircle className="w-4 h-4 mr-1" />
                    Response time: {product.seller.responseTime}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Product Details Tabs */}
          <div className="border-t">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Product Details</h2>
              
              {/* Description */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
                <div className="prose prose-blue max-w-none">
                  <p className="whitespace-pre-line text-gray-600">{product.description}</p>
                </div>
              </div>

              {/* Specifications */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Specifications</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex border-b border-gray-200 py-3">
                      <span className="font-medium text-gray-900 w-1/3">{key}</span>
                      <span className="text-gray-600">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Compatibility */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Compatibility</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {product.compatibility.map((vehicle, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 rounded-lg p-4"
                    >
                      <div className="font-medium text-gray-900">
                        {vehicle.make} {vehicle.model}
                      </div>
                      <div className="text-sm text-gray-600">
                        Year: {vehicle.years}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Offer Modal */}
      {showOfferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Make an Offer</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Offer Amount (€)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="number"
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter amount"
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Original price: €{product.price}
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowOfferModal(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitOffer}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Submit Offer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Layout */}
      {isMobile && (
        <div className="min-h-screen bg-white">
          {/* Top Navigation */}
          <div className="fixed top-0 left-0 right-0 bg-white z-50 p-4 flex justify-between items-center">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="flex gap-2">
              <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow">
                <Share2 className="w-5 h-5" />
              </button>
              <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow">
                <Heart className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="pt-16 pb-32">
            {/* Image Slider */}
            <div className="relative aspect-square bg-gray-100">
              <img
                src={product.images[currentImageIndex]}
                alt={product.title}
                className="w-full h-full object-cover"
              />
              
              {/* Image Navigation */}
              <button 
                onClick={() => setCurrentImageIndex(prev => Math.max(0, prev - 1))}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-white border-2 border-yellow-400"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setCurrentImageIndex(prev => Math.min(product.images.length - 1, prev + 1))}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-md"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Image Counter */}
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                {currentImageIndex + 1}/{product.images.length}
              </div>
            </div>

            {/* Product Info */}
            <div className="p-4 space-y-4">
              {/* Trust Badges */}
              <div className="flex gap-4">
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-600">Secure payment</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-600">Verified add</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-600">Inc</span>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-2xl font-bold">Rent Me</h1>
              
              {/* Brand */}
              <div className="text-gray-600">Atk.</div>
              
              {/* Size */}
              <div className="text-gray-600">Unique size</div>

              {/* Price */}
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold">330 €</span>
                <span className="text-gray-500 line-through">600 €</span>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                  -45%
                </span>
              </div>
            </div>
          </div>

          {/* Fixed Bottom Buttons */}
          <div className="fixed bottom-0 left-0 right-0 bg-white p-4 flex gap-3">
            <button className="flex-1 py-3.5 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium text-center">
              Make an offer
            </button>
            <button className="flex-1 py-3.5 px-4 bg-emerald-500 text-white rounded-lg font-medium text-center">
              BUY
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;