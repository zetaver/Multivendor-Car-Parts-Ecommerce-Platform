import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';

const categories = [
  {
    title: "Engine Parts",
    image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&q=80&w=500",
    href: "/categories/engine-parts",
    subcategories: ["Engine Filters", "Pistons", "Gaskets", "Timing Belts"]
  },
  {
    title: "Brake Systems",
    image: "https://images.unsplash.com/photo-1486754735734-325b5831c3ad?auto=format&fit=crop&q=80&w=500",
    href: "/categories/brake-systems",
    subcategories: ["Brake Pads", "Rotors", "Calipers", "Brake Lines"]
  },
  {
    title: "Transmission",
    image: "https://images.unsplash.com/photo-1537378235181-3b3396b0b089?auto=format&fit=crop&q=80&w=500",
    href: "/categories/transmission",
    subcategories: ["Gearbox", "Clutch", "Flywheel", "Transmission Fluid"]
  },
  {
    title: "Body Parts",
    image: "https://images.unsplash.com/photo-1562426509-5044a121aa49?auto=format&fit=crop&q=80&w=500",
    href: "/categories/body-parts",
    subcategories: ["Bumpers", "Fenders", "Mirrors", "Lights"]
  },
  {
    title: "Electrical",
    image: "https://images.unsplash.com/photo-1565742863375-88d6b3b98ea7?auto=format&fit=crop&q=80&w=500",
    href: "/categories/electrical",
    subcategories: ["Batteries", "Alternators", "Starters", "Sensors"]
  },
  {
    title: "Suspension",
    image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=500",
    href: "/categories/suspension",
    subcategories: ["Shock Absorbers", "Springs", "Control Arms", "Bushings"]
  }
];

const CategoryCard = ({ category, isHovered, onHover, onLeave }) => {
  const { t } = useTranslation();

  return (
    <div
      className="relative group"
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <Link to={category.href} className="block">
        <div className="relative overflow-hidden rounded-lg">
          <img
            src={category.image}
            alt={category.title}
            className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between">
            <h3 className="text-white font-semibold">{t(category.title)}</h3>
            <ChevronDown className={`w-5 h-5 text-white transition-transform duration-300 ${isHovered ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </Link>

      {/* Dropdown Menu */}
      {isHovered && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 py-2"
        >
          {category.subcategories.map((subcategory, index) => (
            <Link
              key={index}
              to={`${category.href}/${subcategory.toLowerCase().replace(' ', '-')}`}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
            >
              {t(subcategory)}
            </Link>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export const SubheaderCategories = () => {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  return (
    <div className="bg-gray-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {categories.map((category) => (
            <CategoryCard
              key={category.title}
              category={category}
              isHovered={hoveredCategory === category.title}
              onHover={() => setHoveredCategory(category.title)}
              onLeave={() => setHoveredCategory(null)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};