const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Media upload function
exports.uploadMedia = async (req, res) => {
  try {
    const file = req.file; // Multer adds file to the request
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // The file is already saved to disk by multer
    // Return the path where the file can be accessed
    const filePath = `/api/media/${file.filename}`;
    
    console.log('File successfully stored at:', file.path);
    console.log('Accessible at URL:', filePath);

    // Respond with the file URL
    res.status(200).json({
      success: true,
      url: filePath,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload media' });
  }
};

// New function to delete media
exports.deleteMedia = async (req, res) => {
  try {
    const { filename } = req.params;
    
    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }
    
    const filePath = path.join(__dirname, '../uploads', filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Delete the file
    fs.unlinkSync(filePath);
    
    console.log('File successfully deleted:', filePath);
    
    res.status(200).json({
      success: true,
      message: 'File deleted successfully',
      filename: filename
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete media' });
  }
}; 