const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

// Create dummy PDF
fs.writeFileSync('dummy.pdf', '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Count 1\n/Kids [3 0 R]\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000056 00000 n \n0000000111 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n190\n%%EOF');

async function test() {
  try {
    const loginRes = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'admin@safety.com',
      password: 'password123'
    });
    const token = loginRes.data.token;
	
	const sitesRes = await axios.get('http://localhost:5001/api/sites', {
	  headers: { Authorization: `Bearer ${token}` }
	});
	
	const siteId = sitesRes.data.data[0]._id || sitesRes.data.data[0].id;

    const form = new FormData();
    form.append('file', fs.createReadStream('dummy.pdf'));
    form.append('title', 'Test PDF');
    form.append('version', '1.0');
    form.append('validFrom', '2023-01-01');
    form.append('validUntil', '2024-01-01');
    form.append('tags', 'test');
    form.append('siteId', siteId);
    form.append('category', 'RAMS');

	const uploadRes = await axios.post('http://localhost:5001/api/documents/upload', form, {
	  headers: { 
	    ...form.getHeaders(),
		Authorization: `Bearer ${token}` 
	  }
	});

    console.log('Upload complete.', uploadRes.data);
  } catch(e) {
    console.log('Error:', e.response?.data || e.message);
  }
}
test();
