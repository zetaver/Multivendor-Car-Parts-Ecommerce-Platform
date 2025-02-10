import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import sampleProducts from "../data/sampleProducts";
import HeroCarousel from "../components/ui/HeroCarousel";

const Home = () => {
  const categoriesScrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollBy({ left: -300, behavior: "smooth" });
  };

  const scrollRight = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollBy({ left: 300, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Carousel */}
      <HeroCarousel />

      {/* Categories Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-6">
          Top Categories
        </h2>
        <div className="relative">
          {/* Left Scroll Button */}
          <button
            className="hidden lg:flex absolute left-0 top-1/2 transform -translate-y-1/2 bg-white shadow-md rounded-full p-2 z-10 hover:bg-gray-100"
            onClick={() => scrollLeft(categoriesScrollRef)}
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>

          {/* Horizontal Scroll Container */}
          <div
            className="flex gap-4 overflow-x-auto hide-scrollbar"
            ref={categoriesScrollRef}
          >
            {[
              {
                name: "Engine Parts",
                image:
                  "https://images.unsplash.com/photo-1580274455191-1c62238fa333?auto=format&fit=crop&q=80&w=500",
                description: "Essential components for your engine",
              },
              {
                name: "Brake Systems",
                image:
                  "https://images.unsplash.com/photo-1600712242805-5f78671b24da?auto=format&fit=crop&q=80&w=500",
                description: "Complete brake solutions",
              },
              {
                name: "Transmission",
                image:
                  "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?auto=format&fit=crop&q=80&w=500",
                description: "Transmission parts and accessories",
              },
              {
                name: "Body Parts",
                image:
                  "https://images.unsplash.com/photo-1489824904134-891ab64532f1?auto=format&fit=crop&q=80&w=500",
                description: "Exterior and interior components",
              },
            ].map((category, index) => (
              <Link
                key={index}
                to={`/categories/${category.name
                  .toLowerCase()
                  .replace(/\s+/g, "-")}`}
                className="group relative rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 min-w-[200px] lg:min-w-[250px]"
              >
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                  <div className="p-4 w-full">
                    <h3 className="text-base md:text-lg font-semibold text-white group-hover:text-blue-200 transition-colors duration-300">
                      {category.name}
                    </h3>
                    <p className="text-sm text-gray-200">
                      {category.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Right Scroll Button */}
          <button
            className="hidden lg:flex absolute right-0 top-1/2 transform -translate-y-1/2 bg-white shadow-md rounded-full p-2 z-10 hover:bg-gray-100"
            onClick={() => scrollRight(categoriesScrollRef)}
          >
            <ChevronRight className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Products Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {sampleProducts.map(({ feature, products }) => {
          const productsScrollRef = useRef<HTMLDivElement>(null);

          return (
            <div key={feature} className="mb-12">
              {/* Feature Title */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 md:mb-0">
                  {feature}
                </h2>
                <Link
                  to={`/categories/${feature.toLowerCase().replace(/\s+/g, "-")}`}
                  className="text-[#FFB800] text-sm md:text-base hover:underline font-bold"
                >
                  See all
                </Link>
              </div>

              {/* Horizontal Scroll Container */}
              <div className="relative">
                {/* Left Scroll Button */}
                <button
                  className="hidden lg:flex absolute left-0 top-1/2 transform -translate-y-1/2 bg-white shadow-md rounded-full p-2 z-10 hover:bg-gray-100"
                  onClick={() => scrollLeft(productsScrollRef)}
                >
                  <ChevronLeft className="w-6 h-6 text-gray-600" />
                </button>

                <div
                  className="flex gap-4 overflow-x-auto hide-scrollbar py-4"
                  ref={productsScrollRef}
                  style={{
                    scrollBehavior: "smooth",
                    WebkitOverflowScrolling: "touch",
                  }}
                >
                  {products.map((product) => (
                    <Link
                      key={product.id}
                      to={`/products/${product.id}`}
                      className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 min-w-[240px] sm:min-w-[280px] flex-shrink-0 transform hover:-translate-y-1 overflow-hidden"
                    >
                      <div className="relative">
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          className="w-full h-48 sm:h-52 object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {product.discount && (
                          <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            -{product.discount}%
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-500">
                            OEM: {product.oemNumber}
                          </span>
                          <div className="flex items-center bg-gray-50 px-2 py-1 rounded-full">
                            <Star className="w-3.5 h-3.5 text-yellow-400 fill-current" />
                            <span className="ml-1 text-xs font-medium text-gray-600">
                              {product.rating}
                            </span>
                          </div>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2">
                          {product.title}
                        </h3>
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex flex-col">
                            {product.oldPrice && (
                              <span className="text-xs text-gray-500 line-through">
                                €{product.oldPrice}
                              </span>
                            )}
                            <span className="text-lg font-bold text-blue-600">
                              €{product.price}
                            </span>
                          </div>
                          <button className="bg-[#FFB800]  hover:bg-[#e6a600]  text-secondary text-sm  px-4 py-2 rounded-lg transition-colors ">
                            View Details
                          </button>
                        </div>

                      </div>
                    </Link>
                  ))}
                </div>

                {/* Right Scroll Button */}
                <button
                  className="hidden lg:flex absolute right-0 top-1/2 transform -translate-y-1/2 bg-white shadow-md rounded-full p-2 z-10 hover:bg-gray-100"
                  onClick={() => scrollRight(productsScrollRef)}
                >
                  <ChevronRight className="w-6 h-6 text-gray-600" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// CSS for scrollbar hiding
const styles = `
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default Home;
