import React, { useState, useEffect } from "react";
import { ChevronRight, ChevronLeft, Search } from "lucide-react";
import { Link } from "react-router-dom";

const slides = [
  {
    image: "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&q=80&w=1920",
    title: "Catalytic Converters",
    description: "Up to 60% off on top brands",
    buttonText: "Shop Now",
    buttonLink: "/products/catalytic-converters",
  },
  {
    image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=1920",
    title: "Brake Systems",
    description: "Professional grade brake components",
    buttonText: "View Collection",
    buttonLink: "/products/brake-systems",
  },
  {
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=1920",
    title: "Engine Parts",
    description: "OEM and aftermarket engine components",
    buttonText: "Explore",
    buttonLink: "/products/engine-parts",
  },
];

const popularBrands = [
  "Toyota",
  "Honda",
  "BMW",
  "Mercedes",
  "Volkswagen",
  "Audi",
  "Ford",
  "Peugeot",
  "Renault",
  "Citroën",
];

const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Implement search functionality
  };

  return (
    <div className="relative bg-gray-100 h-auto md:h-[70vh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex flex-col md:grid md:grid-cols-3 h-full">
          {/* Vehicle Filter */}
          <div className={`
            fixed inset-x-0 bottom-0 md:relative md:static
            z-[100] md:z-auto
            bg-[#1e3a8a] 
            
            transition-all duration-300 ease-in-out
            md:block md:h-full
            ${isFilterOpen ? 'translate-y-0' : 'translate-y-full'}
            md:transform-none
            order-last md:order-first
            shadow-lg
          `}>
            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between p-4">
              <h2 className="text-white text-xl font-semibold">Add a New Vehicle</h2>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="text-white p-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="px-4 pb-6 pt-2 md:p-8">
              <h2 className="text-white text-2xl font-bold mb-6 hidden md:block">Find Parts for Your Vehicle</h2>
              <form onSubmit={handleSearch} className="flex flex-col gap-6">
                {/* Year Selection */}
                <div>
                  <label className="block text-white text-base mb-2">Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full p-4 bg-[rgba(255,255,255,0.1)] rounded-lg text-white border-0 appearance-none focus:ring-2 focus:ring-white/20 focus:outline-none cursor-pointer"
                  >
                    <option value="">Select Year</option>
                    {Array.from({ length: 30 }, (_, i) => 2024 - i).map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                {/* Brand Selection */}
                <div>
                  <label className="block text-white text-base mb-2">Brand</label>
                  <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="w-full p-4 bg-[rgba(255,255,255,0.1)] rounded-lg text-white border-0 appearance-none focus:ring-2 focus:ring-white/20 focus:outline-none cursor-pointer"
                  >
                    <option value="">Select Brand</option>
                    {popularBrands.map((brand) => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                </div>

                {/* Model Selection */}
                <div>
                  <label className="block text-white text-base mb-2">Model</label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full p-4 bg-[rgba(255,255,255,0.1)] rounded-lg text-white border-0 appearance-none focus:ring-2 focus:ring-white/20 focus:outline-none cursor-pointer"
                  >
                    <option value="">Select Model</option>
                  </select>
                </div>

                {/* Search Button */}
                <button
                  type="submit"
                  className="w-full bg-orange-600 text-white py-4 px-4 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center mt-2 text-lg font-medium"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Search Parts
                </button>
              </form>
            </div>
          </div>

          {/* Carousel */}
          <div className="col-span-2 relative h-[300px] md:h-full overflow-hidden order-first md:order-last mb-4 md:mb-0">
            {slides.map((slide, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-700 ${
                  currentSlide === index ? "opacity-100" : "opacity-0"
                }`}
              >
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
                <div className="absolute inset-y-0 left-0 flex items-center p-4 sm:p-6 md:p-8">
                  <div className="max-w-md">
                    <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2 md:mb-4">
                      {slide.title}
                    </h2>
                    <p className="text-sm sm:text-base md:text-lg text-gray-200 mb-4">
                      {slide.description}
                    </p>
                    <Link
                      to={slide.buttonLink}
                      className="inline-flex items-center px-4 py-2 sm:px-6 sm:py-3 bg-orange-600 text-white text-sm sm:text-base font-medium rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      {slide.buttonText}
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}

            {/* Navigation Buttons */}
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 p-1.5 sm:p-2 bg-black/30 text-white rounded-full hover:bg-black/50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1.5 sm:p-2 bg-black/30 text-white rounded-full hover:bg-black/50 transition-colors"
            >
              <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6" />
            </button>

            {/* Slide Indicators */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-colors ${
                    currentSlide === index ? "bg-white" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Mobile Select Vehicle Button */}
          <div className="md:hidden order-2 mb-4">
            <button
              onClick={() => setIsFilterOpen(true)}
              className="w-full bg-[#1e3a8a] text-white py-3 px-4 rounded-lg flex items-center justify-center"
            >
              <span className="mr-2">SELECT YOUR VEHICLE</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroCarousel;
