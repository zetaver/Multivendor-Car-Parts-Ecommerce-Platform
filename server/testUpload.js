const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const uploadFile = async () => {
  const formData = new FormData();
  const filePath = 'path/to/your/image.jpg'; // Change this to your file path

  if (!fs.existsSync(filePath)) {
    console.error('File does not exist');
    return;
  }

  formData.append('file', fs.createReadStream(filePath));
  formData.append('upload_preset', 'categories');

  try {
    const response = await axios.post(process.env.CLOUDINARY_API_URL, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });
    console.log('Upload successful:', response.data);
  } catch (error) {
    console.error('Upload error:', error);
  }
};

uploadFile(); 