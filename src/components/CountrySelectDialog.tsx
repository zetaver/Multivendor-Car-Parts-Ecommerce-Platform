import React from 'react';
import clsx from 'clsx';

interface Country {
  code: string;
  name: string;
  dialCode: string;
}

interface CountrySelectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (country: Country) => void;
}

const countries: Country[] = [
  { code: 'FR', name: 'France', dialCode: '+33' },
  { code: 'BE', name: 'Belgium', dialCode: '+32' },
  { code: 'DE', name: 'Germany', dialCode: '+49' },
  { code: 'IT', name: 'Italy', dialCode: '+39' },
  { code: 'ES', name: 'Spain', dialCode: '+34' },
  { code: 'NL', name: 'Netherlands', dialCode: '+31' },
  { code: 'LU', name: 'Luxembourg', dialCode: '+352' },
  { code: 'CH', name: 'Switzerland', dialCode: '+41' },
  // Other countries section
  { code: 'AC', name: 'Ascension Island', dialCode: '+247' },
  { code: 'AD', name: 'Andorra', dialCode: '+376' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971' },
];

const CountrySelectDialog: React.FC<CountrySelectDialogProps> = ({ isOpen, onClose, onSelect }) => {
  return (
    <>
      {/* Backdrop */}
      <div 
        className={clsx(
          "fixed inset-0 bg-gray-100 rounded-lg bg-opacity-50 transition-opacity z-[200]",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        className={clsx(
          "fixed z-[200] transform transition-all duration-300 ease-in-out",
          // Mobile view styles (full screen)
          "max-sm:inset-x-0 max-sm:bottom-0 max-sm:top-[5%]",
          // Desktop/tablet view styles (centered with specific size)
          "sm:w-[480px] sm:h-auto sm:max-h-[600px] sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2",
          // Animation and visibility
          isOpen 
            ? "opacity-100 max-sm:translate-y-0" 
            : "opacity-0 pointer-events-none max-sm:translate-y-full",
        )}
      >
        <div className={clsx(
          "relative w-full h-full bg-white overflow-hidden",
          "sm:rounded-lg", // Regular rounded corners for tablet/desktop
          "max-sm:rounded-t-2xl", // Only round top corners on mobile
        )}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Pays</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Countries List */}
          <div className="overflow-y-auto max-h-[calc(100vh-200px)] sm:max-h-[500px]">
            {/* Main Countries */}
            <div className="divide-y">
              {countries.slice(0, 8).map((country) => (
                <button
                  key={country.code}
                  onClick={() => {
                    onSelect(country);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <img 
                      src={`/flags/${country.code.toLowerCase()}.svg`}
                      alt={country.code}
                      className="w-6 h-6"
                    />
                    <span>{country.code}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-600">{country.dialCode}</span>
                    {country.code === 'FR' && (
                      <div className="w-5 h-5 rounded-full bg-emerald-400" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Other Countries Section */}
            <div className="bg-gray-50 px-4 py-2">
              <h3 className="text-sm font-medium text-gray-600">Autres pays</h3>
            </div>
            <div className="divide-y">
              {countries.slice(8).map((country) => (
                <button
                  key={country.code}
                  onClick={() => {
                    onSelect(country);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <img 
                      src={`/flags/${country.code.toLowerCase()}.svg`}
                      alt={country.code}
                      className="w-6 h-6"
                    />
                    <span>{country.code}</span>
                  </div>
                  <span className="text-gray-600">{country.dialCode}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CountrySelectDialog; 