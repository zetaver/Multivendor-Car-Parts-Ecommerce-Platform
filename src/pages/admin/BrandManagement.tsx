import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, Edit, ChevronDown, ChevronRight, Car, X } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../../config';
import { useTranslation } from 'react-i18next';

export interface Version {
    id: string;
    name: string;
    year: number;
    specifications?: string;
  }
  
  export interface Model {
    id: string;
    name: string;
    description?: string;
    versions: Version[];
  }
  
  export interface Brand {
    id: string;
    name: string;
    logo?: string;
    description?: string;
    models: Model[];
  }
  
  export interface User {
    isAdmin: boolean;
  }
interface Props {
  user?: { isAdmin: boolean };
}

const BrandManagement: React.FC<Props> = ({ user = { isAdmin: true } }) => {
  const { t } = useTranslation();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [expandedBrand, setExpandedBrand] = useState<string | null>(null);
  const [expandedModel, setExpandedModel] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Modal states
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showModelModal, setShowModelModal] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  
  // Form data
  const [currentBrand, setCurrentBrand] = useState<Brand | null>(null);
  const [currentModel, setCurrentModel] = useState<Model | null>(null);
  const [currentVersion, setCurrentVersion] = useState<Version | null>(null);
  const [brandName, setBrandName] = useState('');
  const [brandLogo, setBrandLogo] = useState('');
  const [modelName, setModelName] = useState('');
  const [versionName, setVersionName] = useState('');
  const [versionYear, setVersionYear] = useState<number>(new Date().getFullYear());

  // Fetch brands data
  const fetchBrands = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/brands`);
      setBrands(response.data.brands || []);
    } catch (error) {
      console.error('Error fetching brands:', error);
      alert(t('admin.brandManagement.errors.fetchFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const toggleBrand = (brandId: string) => {
    setExpandedBrand(expandedBrand === brandId ? null : brandId);
  };

  const toggleModel = (modelId: string) => {
    setExpandedModel(expandedModel === modelId ? null : modelId);
  };

  // Brand CRUD
  const openAddBrandModal = () => {
    setCurrentBrand(null);
    setBrandName('');
    setBrandLogo('');
    setShowBrandModal(true);
  };

  const openEditBrandModal = (brand: Brand) => {
    setCurrentBrand(brand);
    setBrandName(brand.name);
    setBrandLogo(brand.logo || '');
    setShowBrandModal(true);
  };

  const handleSaveBrand = async () => {
    try {
      if (!brandName.trim()) {
        alert(t('admin.brandManagement.errors.brandNameRequired'));
        return;
      }

      if (currentBrand) {
        // Update existing brand
        await axios.put(`${API_URL}/api/brands/${currentBrand.id}`, {
          name: brandName,
          logo: brandLogo
        });
      } else {
        // Create new brand
        await axios.post(`${API_URL}/api/brands`, {
          name: brandName,
          logo: brandLogo
        });
      }
      
      setShowBrandModal(false);
      fetchBrands();
    } catch (error) {
      console.error('Error saving brand:', error);
      alert(t('admin.brandManagement.errors.saveBrandFailed'));
    }
  };

  const handleDeleteBrand = async (brandId: string) => {
    if (!confirm(t('admin.brandManagement.confirmDeleteBrand'))) {
      return;
    }
    
    try {
      await axios.delete(`${API_URL}/api/brands/${brandId}`);
      fetchBrands();
    } catch (error) {
      console.error('Error deleting brand:', error);
      alert(t('admin.brandManagement.errors.deleteBrandFailed'));
    }
  };

  // Model CRUD
  const openAddModelModal = (brandId: string) => {
    const brand = brands.find(b => b.id === brandId);
    if (!brand) return;
    
    setCurrentBrand(brand);
    setCurrentModel(null);
    setModelName('');
    setShowModelModal(true);
  };

  const openEditModelModal = (brandId: string, model: Model) => {
    const brand = brands.find(b => b.id === brandId);
    if (!brand) return;
    
    setCurrentBrand(brand);
    setCurrentModel(model);
    setModelName(model.name);
    setShowModelModal(true);
  };

  const handleSaveModel = async () => {
    if (!currentBrand) return;
    
    try {
      if (!modelName.trim()) {
        alert(t('admin.brandManagement.errors.modelNameRequired'));
        return;
      }

      if (currentModel) {
        // Update existing model
        await axios.put(`${API_URL}/api/brands/${currentBrand.id}/models/${currentModel.id}`, {
          name: modelName
        });
      } else {
        // Create new model
        await axios.post(`${API_URL}/api/brands/${currentBrand.id}/models`, {
          name: modelName
        });
      }
      
      setShowModelModal(false);
      fetchBrands();
    } catch (error) {
      console.error('Error saving model:', error);
      alert(t('admin.brandManagement.errors.saveModelFailed'));
    }
  };

  const handleDeleteModel = async (brandId: string, modelId: string) => {
    if (!confirm(t('admin.brandManagement.confirmDeleteModel'))) {
      return;
    }
    
    try {
      await axios.delete(`${API_URL}/api/brands/${brandId}/models/${modelId}`);
      fetchBrands();
    } catch (error) {
      console.error('Error deleting model:', error);
      alert(t('admin.brandManagement.errors.deleteModelFailed'));
    }
  };

  // Version CRUD
  const openAddVersionModal = (brandId: string, modelId: string) => {
    const brand = brands.find(b => b.id === brandId);
    if (!brand) return;
    
    const model = brand.models.find(m => m.id === modelId);
    if (!model) return;
    
    setCurrentBrand(brand);
    setCurrentModel(model);
    setCurrentVersion(null);
    setVersionName('');
    setVersionYear(new Date().getFullYear());
    setShowVersionModal(true);
  };

  const openEditVersionModal = (brandId: string, modelId: string, version: Version) => {
    const brand = brands.find(b => b.id === brandId);
    if (!brand) return;
    
    const model = brand.models.find(m => m.id === modelId);
    if (!model) return;
    
    setCurrentBrand(brand);
    setCurrentModel(model);
    setCurrentVersion(version);
    setVersionName(version.name);
    setVersionYear(version.year);
    setShowVersionModal(true);
  };

  const handleSaveVersion = async () => {
    if (!currentBrand || !currentModel) return;
    
    try {
      if (!versionName.trim()) {
        alert(t('admin.brandManagement.errors.versionNameRequired'));
        return;
      }

      const versionData = {
        name: versionName,
        year: versionYear
      };

      if (currentVersion) {
        // Update existing version
        await axios.put(
          `${API_URL}/api/brands/${currentBrand.id}/models/${currentModel.id}/versions/${currentVersion.id}`, 
          versionData
        );
      } else {
        // Create new version
        await axios.post(
          `${API_URL}/api/brands/${currentBrand.id}/models/${currentModel.id}/versions`, 
          versionData
        );
      }
      
      setShowVersionModal(false);
      fetchBrands();
    } catch (error) {
      console.error('Error saving version:', error);
      alert(t('admin.brandManagement.errors.saveVersionFailed'));
    }
  };

  const handleDeleteVersion = async (brandId: string, modelId: string, versionId: string) => {
    if (!confirm(t('admin.brandManagement.confirmDeleteVersion'))) {
      return;
    }
    
    try {
      await axios.delete(`${API_URL}/api/brands/${brandId}/models/${modelId}/versions/${versionId}`);
      fetchBrands();
    } catch (error) {
      console.error('Error deleting version:', error);
      alert(t('admin.brandManagement.errors.deleteVersionFailed'));
    }
  };

  const handlePopulateInitialData = async () => {
    if (!confirm(t('admin.brandManagement.confirmPopulateData'))) {
      return;
    }
    
    try {
      await axios.post(`${API_URL}/api/brands/populate`);
      fetchBrands();
      alert(t('admin.brandManagement.dataPopulatedSuccess'));
    } catch (error) {
      console.error('Error populating data:', error);
      alert(t('admin.brandManagement.errors.populateDataFailed'));
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
             
              {t('admin.brandManagement.title')}
            </h1>
            <div className="flex space-x-4">
              {user.isAdmin && (
                <>
                  <button 
                    onClick={openAddBrandModal}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <PlusCircle className="w-5 h-5 mr-2" />
                    {t('admin.brandManagement.addBrand')}
                  </button>
                  {/* <button 
                    onClick={handlePopulateInitialData}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Initialize Data
                  </button> */}
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : brands.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <p className="text-gray-500 mb-4">{t('admin.brandManagement.noBrandsFound')}</p>
            {user.isAdmin && (
              <div className="space-y-4">
                <button 
                  onClick={openAddBrandModal}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusCircle className="w-5 h-5 mr-2" />
                  {t('admin.brandManagement.addBrand')}
                </button>
                <div>
                  <button 
                    onClick={handlePopulateInitialData}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {t('admin.brandManagement.initializeSampleData')}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg">
            {brands.map(brand => (
              <div key={brand.id} className="border-b last:border-b-0">
                <div
                  className="px-6 py-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
                  onClick={() => toggleBrand(brand.id)}
                >
                  <div className="flex items-center space-x-4">
                    {expandedBrand === brand.id ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                    <img
                      src={brand.logo || `https://ui-avatars.com/api/?name=${brand.name}&background=random`}
                      alt={brand.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <h2 className="text-lg font-medium text-gray-900">{brand.name}</h2>
                  </div>
                  {user.isAdmin && (
                    <div className="flex items-center space-x-2">
                      <button 
                        className="p-2 text-gray-400 hover:text-blue-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditBrandModal(brand);
                        }}
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button 
                        className="p-2 text-gray-400 hover:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBrand(brand.id);
                        }}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>

                {expandedBrand === brand.id && (
                  <div className="pl-16 pr-6 pb-4">
                    {brand.models.length === 0 ? (
                      <p className="text-gray-500 text-sm py-2">{t('admin.brandManagement.noModelsAvailable')}</p>
                    ) : (
                      brand.models.map(model => (
                        <div key={model.id} className="mt-4">
                          <div
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => toggleModel(model.id)}
                          >
                            <div className="flex items-center space-x-2">
                              {expandedModel === model.id ? (
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                              )}
                              <h3 className="text-md font-medium text-gray-700">{model.name}</h3>
                            </div>
                            {user.isAdmin && (
                              <div className="flex items-center space-x-2">
                                <button 
                                  className="p-1 text-gray-400 hover:text-blue-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditModelModal(brand.id, model);
                                  }}
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button 
                                  className="p-1 text-gray-400 hover:text-red-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteModel(brand.id, model.id);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>

                          {expandedModel === model.id && (
                            <div className="pl-6 mt-2">
                              {model.versions.length === 0 ? (
                                <p className="text-gray-500 text-sm py-2">{t('admin.brandManagement.noVersionsAvailable')}</p>
                              ) : (
                                model.versions.map(version => (
                                  <div
                                    key={version.id}
                                    className="flex items-center justify-between py-2 border-b last:border-b-0"
                                  >
                                    <div>
                                      <span className="text-sm font-medium text-gray-900">
                                        {version.name}
                                      </span>
                                      {/* <span className="ml-2 text-sm text-gray-500">
                                        ({version.year})
                                      </span> */}
                                    </div>
                                    {user.isAdmin && (
                                      <div className="flex items-center space-x-2">
                                        <button 
                                          className="p-1 text-gray-400 hover:text-blue-600"
                                          onClick={() => openEditVersionModal(brand.id, model.id, version)}
                                        >
                                          <Edit className="w-4 h-4" />
                                        </button>
                                        <button 
                                          className="p-1 text-gray-400 hover:text-red-600"
                                          onClick={() => handleDeleteVersion(brand.id, model.id, version.id)}
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                ))
                              )}
                              {user.isAdmin && (
                                <button 
                                  className="mt-2 inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                                  onClick={() => openAddVersionModal(brand.id, model.id)}
                                >
                                  <PlusCircle className="w-4 h-4 mr-1" />
                                  {t('admin.brandManagement.addVersion')}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                    {user.isAdmin && (
                      <button 
                        className="mt-4 inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                        onClick={() => openAddModelModal(brand.id)}
                      >
                        <PlusCircle className="w-4 h-4 mr-1" />
                        {t('admin.brandManagement.addModel')}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Brand Modal */}
      {showBrandModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                {currentBrand ? t('admin.brandManagement.editBrand') : t('admin.brandManagement.addBrand')}
              </h3>
              <button 
                className="text-gray-400 hover:text-gray-500"
                onClick={() => setShowBrandModal(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <label htmlFor="brandName" className="block text-sm font-medium text-gray-700">
                    {t('admin.brandManagement.brandName')}
                  </label>
                  <input
                    type="text"
                    id="brandName"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder={t('admin.brandManagement.enterBrandName')}
                    required
                  />
                </div>
                {/* <div>
                  <label htmlFor="brandLogo" className="block text-sm font-medium text-gray-700">
                    Logo URL (optional)
                  </label>
                  <input
                    type="text"
                    id="brandLogo"
                    value={brandLogo}
                    onChange={(e) => setBrandLogo(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter logo URL"
                  />
                </div> */}
              </div>
            </div>
            <div className="px-6 py-3 border-t flex justify-end space-x-3">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => setShowBrandModal(false)}
              >
                {t('admin.brandManagement.cancel')}
              </button>
              <button
                type="button"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={handleSaveBrand}
              >
                {currentBrand ? t('admin.brandManagement.update') : t('admin.brandManagement.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Model Modal */}
      {showModelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                {currentModel ? t('admin.brandManagement.editModel') : t('admin.brandManagement.addModel')}
              </h3>
              <button 
                className="text-gray-400 hover:text-gray-500"
                onClick={() => setShowModelModal(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <label htmlFor="modelName" className="block text-sm font-medium text-gray-700">
                    {t('admin.brandManagement.modelName')}
                  </label>
                  <input
                    type="text"
                    id="modelName"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder={t('admin.brandManagement.enterModelName')}
                    required
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-3 border-t flex justify-end space-x-3">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => setShowModelModal(false)}
              >
                {t('admin.brandManagement.cancel')}
              </button>
              <button
                type="button"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={handleSaveModel}
              >
                {currentModel ? t('admin.brandManagement.update') : t('admin.brandManagement.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Version Modal */}
      {showVersionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                {currentVersion ? t('admin.brandManagement.editVersion') : t('admin.brandManagement.addVersion')}
              </h3>
              <button 
                className="text-gray-400 hover:text-gray-500"
                onClick={() => setShowVersionModal(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <label htmlFor="versionName" className="block text-sm font-medium text-gray-700">
                    {t('admin.brandManagement.versionName')}
                  </label>
                  <input
                    type="text"
                    id="versionName"
                    value={versionName}
                    onChange={(e) => setVersionName(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder={t('admin.brandManagement.enterVersionName')}
                    required
                  />
                </div>
                {/* <div>
                  <label htmlFor="versionYear" className="block text-sm font-medium text-gray-700">
                    Year
                  </label>
                  <input
                    type="number"
                    id="versionYear"
                    value={versionYear}
                    onChange={(e) => setVersionYear(parseInt(e.target.value))}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter year"
                    min="1900"
                    max="2100"
                  />
                </div> */}
              </div>
            </div>
            <div className="px-6 py-3 border-t flex justify-end space-x-3">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => setShowVersionModal(false)}
              >
                {t('admin.brandManagement.cancel')}
              </button>
              <button
                type="button"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={handleSaveVersion}
              >
                {currentVersion ? t('admin.brandManagement.update') : t('admin.brandManagement.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrandManagement;