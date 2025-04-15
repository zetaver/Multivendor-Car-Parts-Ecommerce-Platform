const Brand = require('../models/Brand');
const { errorHandler } = require('../utils/errorHandler');

// Get all brands with their models and versions
exports.getAllBrands = async (req, res) => {
  try {
    const brands = await Brand.find({ active: true });
    
    // Format the response to match the desired structure
    const formattedBrands = brands.map(brand => ({
      id: brand._id,
      name: brand.name,
      logo: brand.logo,
      models: brand.models.map(model => ({
        id: model._id,
        name: model.name,
        versions: model.versions.map(version => ({
          id: version._id,
          name: version.name
        }))
      }))
    }));
    
    res.json({ brands: formattedBrands });
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ error: 'Failed to fetch brands' });
  }
};

// Get a specific brand by ID
exports.getBrandById = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    
    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }
    
    // Format the response
    const formattedBrand = {
      id: brand._id,
      name: brand.name,
      logo: brand.logo,
      models: brand.models.map(model => ({
        id: model._id,
        name: model.name,
        versions: model.versions.map(version => ({
          id: version._id,
          name: version.name
        }))
      }))
    };
    
    res.json(formattedBrand);
  } catch (error) {
    console.error('Error fetching brand:', error);
    res.status(500).json({ error: 'Failed to fetch brand' });
  }
};

// Create a new brand
exports.createBrand = async (req, res) => {
  try {
    const { name, logo, models } = req.body;
    
    // Check if brand already exists
    const existingBrand = await Brand.findOne({ name });
    if (existingBrand) {
      return res.status(400).json({ error: 'Brand with this name already exists' });
    }
    
    const brand = new Brand({
      name,
      logo,
      models: models || [] // Initialize with empty models array if not provided
    });
    
    await brand.save();
    
    res.status(201).json({
      id: brand._id,
      name: brand.name,
      logo: brand.logo,
      models: brand.models
    });
  } catch (error) {
    console.error('Error creating brand:', error);
    const errorMessage = errorHandler(error);
    res.status(400).json({ error: errorMessage });
  }
};

// Update a brand
exports.updateBrand = async (req, res) => {
  try {
    const { name, logo, active } = req.body;
    
    const brand = await Brand.findById(req.params.id);
    
    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }
    
    // Update brand fields if provided
    if (name) brand.name = name;
    if (logo !== undefined) brand.logo = logo;
    if (active !== undefined) brand.active = active;
    
    await brand.save();
    
    res.json({
      id: brand._id,
      name: brand.name,
      logo: brand.logo,
      active: brand.active,
      models: brand.models.map(model => ({
        id: model._id,
        name: model.name,
        versions: model.versions.map(version => ({
          id: version._id,
          name: version.name
        }))
      }))
    });
  } catch (error) {
    console.error('Error updating brand:', error);
    const errorMessage = errorHandler(error);
    res.status(400).json({ error: errorMessage });
  }
};

// Delete a brand
exports.deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findByIdAndDelete(req.params.id);
    
    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }
    
    res.json({ message: 'Brand deleted successfully' });
  } catch (error) {
    console.error('Error deleting brand:', error);
    res.status(500).json({ error: 'Failed to delete brand' });
  }
};

// Add a new model to a brand
exports.addModel = async (req, res) => {
  try {
    const { name, versions } = req.body;
    
    const brand = await Brand.findById(req.params.brandId);
    
    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }
    
    const newModel = {
      name,
      versions: versions || []
    };
    
    brand.models.push(newModel);
    await brand.save();
    
    const addedModel = brand.models[brand.models.length - 1];
    
    res.status(201).json({
      id: addedModel._id,
      name: addedModel.name,
      versions: addedModel.versions.map(version => ({
        id: version._id,
        name: version.name
      }))
    });
  } catch (error) {
    console.error('Error adding model:', error);
    const errorMessage = errorHandler(error);
    res.status(400).json({ error: errorMessage });
  }
};

// Update a model
exports.updateModel = async (req, res) => {
  try {
    const { name } = req.body;
    const { brandId, modelId } = req.params;
    
    const brand = await Brand.findById(brandId);
    
    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }
    
    const model = brand.models.id(modelId);
    
    if (!model) {
      return res.status(404).json({ error: 'Model not found' });
    }
    
    if (name) model.name = name;
    
    await brand.save();
    
    res.json({
      id: model._id,
      name: model.name,
      versions: model.versions.map(version => ({
        id: version._id,
        name: version.name
      }))
    });
  } catch (error) {
    console.error('Error updating model:', error);
    const errorMessage = errorHandler(error);
    res.status(400).json({ error: errorMessage });
  }
};

// Delete a model
exports.deleteModel = async (req, res) => {
  try {
    const { brandId, modelId } = req.params;
    
    const brand = await Brand.findById(brandId);
    
    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }
    
    const modelIndex = brand.models.findIndex(m => m._id.toString() === modelId);
    
    if (modelIndex === -1) {
      return res.status(404).json({ error: 'Model not found' });
    }
    
    brand.models.splice(modelIndex, 1);
    await brand.save();
    
    res.json({ message: 'Model deleted successfully' });
  } catch (error) {
    console.error('Error deleting model:', error);
    res.status(500).json({ error: 'Failed to delete model' });
  }
};

// Add a version to a model
exports.addVersion = async (req, res) => {
  try {
    const { name } = req.body;
    const { brandId, modelId } = req.params;
    
    const brand = await Brand.findById(brandId);
    
    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }
    
    const model = brand.models.id(modelId);
    
    if (!model) {
      return res.status(404).json({ error: 'Model not found' });
    }
    
    model.versions.push({ name });
    await brand.save();
    
    const addedVersion = model.versions[model.versions.length - 1];
    
    res.status(201).json({
      id: addedVersion._id,
      name: addedVersion.name
    });
  } catch (error) {
    console.error('Error adding version:', error);
    const errorMessage = errorHandler(error);
    res.status(400).json({ error: errorMessage });
  }
};

// Update a version
exports.updateVersion = async (req, res) => {
  try {
    const { name } = req.body;
    const { brandId, modelId, versionId } = req.params;
    
    const brand = await Brand.findById(brandId);
    
    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }
    
    const model = brand.models.id(modelId);
    
    if (!model) {
      return res.status(404).json({ error: 'Model not found' });
    }
    
    const version = model.versions.id(versionId);
    
    if (!version) {
      return res.status(404).json({ error: 'Version not found' });
    }
    
    if (name) version.name = name;
    
    await brand.save();
    
    res.json({
      id: version._id,
      name: version.name
    });
  } catch (error) {
    console.error('Error updating version:', error);
    const errorMessage = errorHandler(error);
    res.status(400).json({ error: errorMessage });
  }
};

// Delete a version
exports.deleteVersion = async (req, res) => {
  try {
    const { brandId, modelId, versionId } = req.params;
    
    const brand = await Brand.findById(brandId);
    
    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }
    
    const model = brand.models.id(modelId);
    
    if (!model) {
      return res.status(404).json({ error: 'Model not found' });
    }
    
    const versionIndex = model.versions.findIndex(v => v._id.toString() === versionId);
    
    if (versionIndex === -1) {
      return res.status(404).json({ error: 'Version not found' });
    }
    
    model.versions.splice(versionIndex, 1);
    await brand.save();
    
    res.json({ message: 'Version deleted successfully' });
  } catch (error) {
    console.error('Error deleting version:', error);
    res.status(500).json({ error: 'Failed to delete version' });
  }
};

// Populate database with initial brand data (for testing or seeding)
exports.populateInitialData = async (req, res) => {
  try {
    // Check if already has data
    const existingBrands = await Brand.countDocuments();
    if (existingBrands > 0) {
      return res.status(400).json({ error: 'Database already contains brand data' });
    }
    
    // Sample data based on the provided example
    const initialData = [
      {
        name: 'Toyota',
        models: [
          {
            name: 'Corolla',
            versions: [
              { name: 'SE' },
              { name: 'LE' },
              { name: 'XLE' }
            ]
          },
          {
            name: 'Camry',
            versions: [
              { name: 'XSE' },
              { name: 'TRD' }
            ]
          }
        ]
      },
      {
        name: 'Honda',
        models: [
          {
            name: 'Civic',
            versions: [
              { name: 'LX' },
              { name: 'EX' }
            ]
          }
        ]
      }
    ];
    
    await Brand.insertMany(initialData);
    
    res.status(201).json({ message: 'Initial brand data populated successfully' });
  } catch (error) {
    console.error('Error populating initial data:', error);
    res.status(500).json({ error: 'Failed to populate initial data' });
  }
}; 