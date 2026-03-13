const fs = require('fs');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function test() {
  try {
    const res = await cloudinary.uploader.upload('dummy2.pdf', {
      resource_type: 'image',
      folder: 'safetyapp_uploads',
      public_id: 'test_pdf_123.pdf'
    });
    console.log('IMAGE URL WITH EXT:', res.secure_url);
    
    const res2 = await cloudinary.uploader.upload('dummy2.pdf', {
      resource_type: 'image',
      folder: 'safetyapp_uploads',
      public_id: 'test_pdf_456'
    });
    console.log('IMAGE URL WITHOUT EXT:', res2.secure_url);
  } catch(e) {
    console.log(e);
  }
}
test();
