import React, { useState, useEffect, useRef } from "react";
import { ChevronRight, ChevronLeft, Search, ChevronDown, Car, Calendar, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { API_URL } from "../../config";
import axios from "axios";

interface Banner {
  _id: string;
  title: string;
  imageUrl: string;
  link: string;
  isActive: boolean;
  position: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

interface Version {
  id: string;
  name: string;
  year?: number;
}

interface Model {
  id: string;
  name: string;
  versions: Version[];
}

interface Brand {
  id: string;
  name: string;
  logo?: string;
  models: Model[];
}

const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [reference, setReference] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedVersion, setSelectedVersion] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownType, setDropdownType] = useState<'brand' | 'model' | 'version' | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isClosing, setIsClosing] = useState(false);
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Brand-related state
  const [brands, setBrands] = useState<Brand[]>([]);
  const [filteredModels, setFilteredModels] = useState<Model[]>([]);
  const [filteredVersions, setFilteredVersions] = useState<Version[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(false);

  // Fetch brands data
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        setLoadingBrands(true);
        const response = await axios.get(`${API_URL}/api/brands`);
        if (response.data && response.data.brands) {
          setBrands(response.data.brands);
        }
      } catch (err) {
        console.error('Error fetching brands:', err);
      } finally {
        setLoadingBrands(false);
      }
    };

    fetchBrands();
  }, []);

  // Update filtered models when a brand is selected
  useEffect(() => {
    if (selectedBrand) {
      const brand = brands.find(b => b.name === selectedBrand);
      if (brand) {
        setFilteredModels(brand.models);
      } else {
        setFilteredModels([]);
      }
      setSelectedModel("");
      setSelectedVersion("");
    } else {
      setFilteredModels([]);
    }
  }, [selectedBrand, brands]);

  // Update filtered versions when a model is selected
  useEffect(() => {
    if (selectedModel) {
      const model = filteredModels.find(m => m.name === selectedModel);
      if (model) {
        setFilteredVersions(model.versions);
      } else {
        setFilteredVersions([]);
      }
      setSelectedVersion("");
    } else {
      setFilteredVersions([]);
    }
  }, [selectedModel, filteredModels]);

  // Fetch active banners
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/banners/active`);
        if (!response.ok) {
          throw new Error('Failed to fetch banners');
        }
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          setBanners(data.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch banners');
        console.error('Error fetching banners:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  useEffect(() => {
    if (banners.length === 0) return;

    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev + 1) % 100);
    }, 50);

    const slideInterval = setInterval(() => {
      if (progress === 99) {
        setCurrentSlide((prev) => (prev + 1) % banners.length);
        setProgress(0);
      }
    }, 50);

    return () => {
      clearInterval(progressInterval);
      clearInterval(slideInterval);
    };
  }, [progress, banners.length]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isDropdownOpen) {
      document.body.classList.add('overflow-hidden');
      const bottomNav = document.querySelector('.bottom-navigation');
      if (bottomNav) {
        bottomNav.classList.add('hidden');
      }
    } else {
      document.body.classList.remove('overflow-hidden');
      const bottomNav = document.querySelector('.bottom-navigation');
      if (bottomNav) {
        bottomNav.classList.remove('hidden');
      }
    }

    return () => {
      document.body.classList.remove('overflow-hidden');
      const bottomNav = document.querySelector('.bottom-navigation');
      if (bottomNav) {
        bottomNav.classList.remove('hidden');
      }
    };
  }, [isDropdownOpen]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
    setProgress(0);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
    setProgress(0);
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Implement search functionality
  };

  const handleDropdownClick = (type: 'brand' | 'model' | 'version') => {
    setDropdownType(type);
    setIsDropdownOpen(true);
  };

  const handleOptionSelect = (value: string) => {
    switch (dropdownType) {
      case 'brand':
        setSelectedBrand(value);
        setDropdownType('model');
        break;
        
      case 'model':
        setSelectedModel(value);
        setDropdownType('version');
        break;
        
      case 'version':
        setSelectedVersion(value);
        setIsDropdownOpen(false);
        handleSearchClick();
        break;
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsDropdownOpen(false);
      setIsClosing(false);
    }, 300);
  };

  const handleSearchClick = () => {
    // Build URL with query parameters for direct filtering
    let filterUrl = '/products?';
    
    if (selectedBrand) {
      filterUrl += `brandId=${encodeURIComponent(selectedBrand)}&`;
    }
    
    if (selectedModel) {
      filterUrl += `modelId=${encodeURIComponent(selectedModel)}&`;
    }
    
    if (selectedVersion) {
      // Check if this is a simple year value (numeric) 
      const versionIsNumeric = /^\d+$/.test(selectedVersion);
      console.log(`Processing selected version: ${selectedVersion}, isNumeric: ${versionIsNumeric}`);
      
      // Always set versionId to the full value for backward compatibility
      filterUrl += `versionId=${encodeURIComponent(selectedVersion)}&`;
      
      // If it's a numeric year, also add it as yearFilter
      if (versionIsNumeric) {
        filterUrl += `yearFilter=${encodeURIComponent(selectedVersion)}&`;
      }
    }
    
    // Remove trailing '&' if present
    if (filterUrl.endsWith('&')) {
      filterUrl = filterUrl.slice(0, -1);
    }
    
    console.log(`Navigating to: ${filterUrl}`);
    
    // Navigate with state to show product listing and also include query params in URL
    navigate(filterUrl, { 
      state: { 
        showProductListingScreen: true
      }
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const x = e.pageX;
    const walk = (x - startX);

    if (walk > 100) {
      prevSlide();
      setIsDragging(false);
    } else if (walk < -100) {
      nextSlide();
      setIsDragging(false);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  return (
    <div className="relative vh-8 mt-12">
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 h-full pt-2">
        <div className="flex flex-col md:flex-row md:space-x-6">
          {/* Vehicle Filter Card */}
          <div className="order-2 md:order-1 md:w-1/3  md:px-0 mt-0 md:mt-0">
            <div className="bg-white p-6 md:p-4 shadow-sm h-[380px] relative md:h-[280px]  rounded-none md:rounded-lg mt-2 md:mt-0 mb-2 md:mb-0">
              {/* Header */}
              <div className="text-center border-gray-300 pb-0 mb-3 md:mb-1 relative">
                <span className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1/6 border-t border-gray-300"></span>
                <h2 className="text-yellow-500 text-lg font-bold inline-block bg-white">Identifiez</h2>
                <h2 className="text-gray-800 text-lg font-bold inline-block px-4 bg-white">votre véhicule</h2>
                <span className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1/5 border-t border-gray-300"></span>
              </div>
              <div className="flex py-3 md:py-0.5">
                <div className="w-full flex items-center  justify-center">
                  <img src="/categorye/car.webp" alt="reference" className="w-9 h-9" />
                </div>
                <div className="w-full flex items-center justify-center bg-gray-100 ">
                  <img src="/book.png" alt="reference" className="w-5 h-5" />
                  <span className="text-black text-lg ml-2 font-sans ">Reference</span>
                </div>
              </div>
              <form className="space-y-3 md:space-y-0.5">
                {/* Reference Input with icon */}
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      placeholder="X-111-XX"
                      className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 text-center pr-10"
                    />
                    <Search className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  </div>
                  <button
                    type="button"
                    className="px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                </div>

                {/* Brand button with icon */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => handleDropdownClick('brand')}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-blue-500
                    text-gray-700 text-sm text-left pr-10"
                  >
                    {selectedBrand || "Select Brand"}
                  </button>
                  <Car className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>

                {/* Model button with icon */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => handleDropdownClick('model')}
                    disabled={!selectedBrand}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-blue-500
                    text-gray-700 text-sm text-left disabled:opacity-50 pr-10"
                  >
                    {selectedModel || "Select a model"}
                  </button>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>

                {/* Version button with icon */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <button
                      type="button"
                      onClick={() => handleDropdownClick('version')}
                      disabled={!selectedModel}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg
                      focus:outline-none focus:ring-2 focus:ring-blue-500
                      text-gray-700 text-sm text-left disabled:opacity-50 pr-10"
                    >
                      {selectedVersion || "Select a version"}
                    </button>
                    <Calendar className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  </div>
                  {/* Search button */}
                  <button
                    type="button"
                    onClick={handleSearchClick}
                    disabled={!selectedBrand || !selectedModel || !selectedVersion}
                    className={`px-4 ${
                      selectedBrand && selectedModel && selectedVersion
                        ? "bg-blue-500 hover:bg-blue-600"
                        : "bg-gray-400 cursor-not-allowed"
                    } text-white rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                  >
                    <Search className="w-5 h-5" />
                  </button>
                </div>

                {/* Add the animated dropdown */}
                {isDropdownOpen && (
                  <div
                    ref={dropdownRef}
                    className={`fixed inset-0 top-0 bg-white z-[9999] 
                    md:bg-black/0 md:flex md:items-center md:justify-center
                    ${isClosing 
                      ? 'animate-slide-out md:animate-slide-down-out' 
                      : 'animate-slide-in md:animate-slide-up-in'}`}
                    style={{ height: '100vh', minHeight: '-webkit-fill-available' }}
                  >
                    <div 
                      className="h-full w-full md:h-auto md:w-[90%] md:max-w-md md:mx-auto
                      md:bg-white md:rounded-lg md:shadow-lg flex flex-col"
                    >
                      <div className="flex flex-col h-full">
                        <div className="flex justify-between items-center h-14 px-4 border-b fixed top-0 w-full bg-white 
                          md:relative md:h-auto md:px-6 md:py-4">
                          <button
                            onClick={handleClose}
                            className="p-1 md:hidden"
                          >
                            <X className="w-6 h-6 text-gray-500" />
                          </button>
                          <h3 className="text-base font-semibold text-gray-800 flex-1 text-center md:text-left">
                            {dropdownType === 'brand' 
                              ? 'Select Brand' 
                              : dropdownType === 'model' 
                                ? 'Select Model' 
                                : 'Select Version'}
                          </h3>
                          <button
                            onClick={() => setIsDropdownOpen(false)}
                            className="hidden md:block text-gray-500 hover:text-gray-700 text-xl"
                          >
                            ×
                          </button>
                        </div>
                        <div className="flex-1 overflow-y-auto mt-14 md:mt-0 md:max-h-[400px]">
                          {loadingBrands && (
                            <div className="flex justify-center items-center h-20">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                            </div>
                          )}

                          {!loadingBrands && dropdownType === 'brand' && brands.map((brand) => (
                            <button
                              key={brand.id}
                              onClick={() => handleOptionSelect(brand.name)}
                              className="w-full text-left px-4 py-3 hover:bg-gray-100 text-sm border-b border-gray-100 last:border-0"
                            >
                              {brand.name}
                            </button>
                          ))}

                          {!loadingBrands && dropdownType === 'model' && filteredModels.map((model) => (
                            <button
                              key={model.id}
                              onClick={() => handleOptionSelect(model.name)}
                              className="w-full text-left px-4 py-3 hover:bg-gray-100 text-sm border-b border-gray-100 last:border-0"
                            >
                              {model.name}
                            </button>
                          ))}

                          {!loadingBrands && dropdownType === 'version' && filteredVersions.length > 0 ? (
                            filteredVersions.map((version) => (
                              <button
                                key={version.id}
                                onClick={() => handleOptionSelect(version.name)}
                                className="w-full text-left px-4 py-3 hover:bg-gray-100 text-sm border-b border-gray-100 last:border-0"
                              >
                                {version.name} {version.year ? `(${version.year})` : ''}
                              </button>
                            ))
                          ) : (
                            dropdownType === 'version' && (
                              <div className="md:px-2">
                                {Array.from({ length: 30 }, (_, i) => 2024 - i).map((year) => (
                                  <button
                                    key={year}
                                    onClick={() => handleOptionSelect(year.toString())}
                                    className="w-full text-left px-4 py-3 hover:bg-gray-100 text-sm 
                                      border-b border-gray-100 last:border-0 md:rounded-lg md:border-none md:my-0.5"
                                  >
                                    {year}
                                  </button>
                                ))}
                              </div>
                            )
                          )}

                          {!loadingBrands && dropdownType === 'model' && filteredModels.length === 0 && selectedBrand && (
                            <div className="text-center py-8 text-gray-500">
                              No models available for this brand
                            </div>
                          )}

                          {!loadingBrands && dropdownType === 'brand' && brands.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                              No brands available
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Carousel Section */}
          <div className="mt-12 ml-3 mr-3 order-1 md:order-2 md:w-2/3 relative h-[177px] md:h-[280px] overflow-hidden px-4 sm:px-6 md:mt-0 pt-2 rounded-lg">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <p className="text-red-500">{error}</p>
              </div>
            ) : (
              banners.map((banner, index) => (
                <div
                  key={banner._id}
                  className={`absolute inset-0 transition-opacity duration-700 cursor-grab ${
                    isDragging ? 'cursor-grabbing' : ''
                  } ${currentSlide === index ? "opacity-100" : "opacity-0"}`}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseLeave}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  <img
                    src={banner.imageUrl}
                    alt={banner.title}
                    className="w-full h-full object-cover select-none"
                    draggable={false}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center px-4 sm:px-6 md:px-8 max-w-2xl">
                      {/* <h2 className="text-xl sm:text-2xl md:text-4xl font-bold text-white mb-3">
                        {banner.title}
                      </h2> */}
                      {/* {banner.link && (
                        <Link
                          to={banner.link}
                          className="inline-flex items-center px-6 py-3 bg-[#FFB800] text-white text-sm font-medium rounded-lg hover:bg-[#e6a600] transition-colors"
                        >
                          View More
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </Link>
                      )} */}
                    </div>
                  </div>
                </div>
              ))
            )}

            {!loading && !error && banners.length > 0 && (
              <>
                {/* Navigation Buttons */}
                <button
                  onClick={prevSlide}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 p-1.5 sm:p-2 bg-white/65 rounded-full hover:bg-white/75 transition-colors hidden md:block"
                >
                  <ChevronLeft className="w-6 h-6 sm:w-6 sm:h-6 text-black" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1.5 sm:p-2 bg-white/65 rounded-full hover:bg-white/75 transition-colors hidden md:block"
                >
                  <ChevronRight className="w-6 h-6 sm:w-6 sm:h-6 text-black" />
                </button>

                {/* Slide Indicators */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-3">
                  {banners.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setCurrentSlide(index);
                        setProgress(0);
                      }}
                      className="relative w-12 h-1.5 bg-black/30 rounded-full overflow-hidden"
                    >
                      <div
                        className={`absolute left-0 top-0 h-full transition-all duration-200 rounded-full ${
                          index < currentSlide 
                            ? "bg-white w-full"
                            : index === currentSlide 
                              ? "bg-white"
                              : "bg-transparent"
                        } ${
                          currentSlide === index ? "opacity-100" : "opacity-70"
                        }`}
                        style={{
                          width: `${currentSlide === index ? progress : index < currentSlide ? '100' : '0'}%`
                        }}
                      />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroCarousel;