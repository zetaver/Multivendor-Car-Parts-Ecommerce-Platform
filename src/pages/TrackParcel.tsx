import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getTrackingDetails } from '../services/locationService';
import { Package, MapPin, Clock, CheckCircle, Truck, AlertCircle, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TrackingActivity {
  location: {
    address?: {
      city?: string;
      countryCode?: string;
      country?: string;
    };
    slic?: string;
  };
  status: {
    type: string;
    description: string;
    code?: string;
    statusCode: string;
  };
  date: string;
  time: string;
}

interface TrackingInfo {
  shipment: Array<{
    inquiryNumber: string;
    package: Array<{
      trackingNumber: string;
      weight?: {
        unitOfMeasurement: string;
        weight: string;
      };
      dimension?: {
        height: string;
        length: string;
        width: string;
        unitOfDimension: string;
      };
      isSmartPackage: boolean;
      packageCount: number;
      activity: TrackingActivity[];
      currentStatus: {
        description: string;
        code: string;
        simplifiedTextDescription: string;
      };
      packageAddress: Array<{
        type: string;
        address: {
          city: string;
          countryCode: string;
        };
      }>;
      service: {
        description: string;
      };
    }>;
  }>;
}

const TrackParcel = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [trackingNumber, setTrackingNumber] = useState(location.state?.trackingNumber || '');
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (location.state?.trackingNumber) {
      handleTrack();
    }
  }, []);

  const handleTrack = async () => {
    if (!trackingNumber.trim()) {
      setError(t('tracking.pleaseEnter'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await getTrackingDetails(trackingNumber);
      setTrackingInfo(data);
    } catch (err) {
      setError(t('tracking.error'));
      setTrackingInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTime = (date: string, time: string) => {
    const dateObj = new Date(
      `${date.substring(0, 4)}-${date.substring(4, 6)}-${date.substring(6, 8)}T${time.substring(0, 2)}:${time.substring(2, 4)}:${time.substring(4, 6)}`
    );
    return dateObj.toLocaleString();
  };

  const getStatusColor = (statusCode: string) => {
    switch (statusCode) {
      case '001': // Delivered
        return 'bg-green-100 text-green-800';
      case '092': // In Transit
        return 'bg-blue-100 text-blue-800';
      case 'X': // Exception
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (statusCode: string) => {
    switch (statusCode) {
      case '001':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case '092':
        return <Truck className="h-6 w-6 text-blue-500" />;
      case 'X':
        return <AlertCircle className="h-6 w-6 text-red-500" />;
      default:
        return <Clock className="h-6 w-6 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-emerald-600 hover:text-emerald-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          {t('tracking.back')}
        </button>
        
        <div className="text-center mb-8">
          <Package className="mx-auto h-12 w-12 text-emerald-600" />
          <h1 className="mt-3 text-3xl font-bold text-gray-900">{t('tracking.title')}</h1>
          <p className="mt-2 text-gray-600">{t('tracking.subtitle')}</p>
        </div>

        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="flex space-x-4">
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder={t('tracking.enterTrackingNumber')}
              className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            />
            <button
              onClick={handleTrack}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
            >
              {isLoading ? t('tracking.tracking') : t('tracking.track')}
            </button>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {trackingInfo && trackingInfo.shipment?.[0]?.package?.[0] && (
            <div className="mt-8">
              <div className="border-b border-gray-200 pb-4 mb-6">
                <h2 className="text-lg font-medium text-gray-900">{t('tracking.trackingDetails')}</h2>
                <div className="mt-2 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">{t('tracking.packageDetails.trackingNumber')}</p>
                    <p className="text-sm font-medium text-gray-900">
                      {trackingInfo.shipment[0].package[0].trackingNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t('tracking.packageDetails.packageCount')}</p>
                    <p className="text-sm font-medium text-gray-900">
                      {trackingInfo.shipment[0].package[0].packageCount}
                    </p>
                  </div>
                </div>

                <div className="mt-4 bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">{t('tracking.packageDetails.title')}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">{t('tracking.packageDetails.service')}</p>
                      <p className="text-sm font-medium text-gray-900">
                        {trackingInfo.shipment[0].package[0].service.description}
                      </p>
                    </div>
                    {trackingInfo.shipment[0].package[0].weight && (
                      <div>
                        <p className="text-sm text-gray-500">{t('tracking.packageDetails.weight')}</p>
                        <p className="text-sm font-medium text-gray-900">
                          {trackingInfo.shipment[0].package[0].weight.weight} {trackingInfo.shipment[0].package[0].weight.unitOfMeasurement}
                        </p>
                      </div>
                    )}
                    {trackingInfo.shipment[0].package[0].dimension && (
                      <div className="col-span-2">
                        <p className="text-sm text-gray-500">{t('tracking.packageDetails.dimensions')}</p>
                        <p className="text-sm font-medium text-gray-900">
                          {trackingInfo.shipment[0].package[0].dimension.length} × {' '}
                          {trackingInfo.shipment[0].package[0].dimension.width} × {' '}
                          {trackingInfo.shipment[0].package[0].dimension.height} {' '}
                          {trackingInfo.shipment[0].package[0].dimension.unitOfDimension}
                        </p>
                      </div>
                    )}
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500">{t('tracking.packageDetails.smartPackage')}</p>
                      <p className="text-sm font-medium text-gray-900">
                        {trackingInfo.shipment[0].package[0].isSmartPackage ? 'Yes' : 'No'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                {trackingInfo.shipment[0].package[0].activity.map((activity, index) => (
                  <div key={index} className="relative">
                    {index !== trackingInfo.shipment[0].package[0].activity.length - 1 && (
                      <div className="absolute top-8 left-4 h-full w-0.5 bg-gray-200" />
                    )}
                    <div className="relative flex items-start">
                      <div className="flex-shrink-0">
                        <div className={`relative z-10 w-8 h-8 flex items-center justify-center rounded-full ${
                          index === 0 ? 'bg-emerald-100' : 'bg-gray-100'
                        }`}>
                          {index === 0 ? (
                            getStatusIcon(activity.status.statusCode)
                          ) : (
                            <MapPin className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                      <div className="ml-4 min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {activity.status.description}
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          {activity.location.address?.city && (
                            <span className="block">
                              {activity.location.address.city}, {activity.location.address.countryCode}
                            </span>
                          )}
                          <span className="block">
                            {formatDateTime(activity.date, activity.time)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackParcel; 