const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const dotenv = require('dotenv');

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        const ext = file.originalname.split('.').pop().toLowerCase();
        // RAW files that shouldn't be processed by Cloudinary (Cloudinary forces attachment download for these)
        const isRaw = ['doc', 'docx', 'xls', 'xlsx', 'txt', 'csv'].includes(ext);
        // PDFs can be uploaded as 'image' which allows inline viewing without forcing download
        const isPdf = ext === 'pdf';
        
        return {
            folder: 'safetyapp_uploads',
            resource_type: isRaw ? 'raw' : (isPdf ? 'image' : 'auto'),
            // Only manually append extension for raw files, since image/auto handles it automatically
            public_id: file.originalname.split('.')[0] + '_' + Date.now() + (isRaw ? `.${ext}` : ''),
        };
    },
});

module.exports = {
    cloudinary,
    storage,
};
