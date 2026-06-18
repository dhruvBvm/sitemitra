const mongoose = require('mongoose');
const User = require('./modules/user/user.model');
const jwt = require('jsonwebtoken');
require('dotenv').config();

(async () => {
  try {
    await mongoose.connect('mongodb+srv://dhruvsit:2uP9VbLw0Q3yIpxN@cluster0.85rx1v7.mongodb.net/fe-sitemitra?retryWrites=true&w=majority&appName=Cluster0');
    console.log('Connected to DB');

    const user = await User.findOne({ role: 'owner' });
    if (!user) {
      console.log('No user found');
      process.exit(1);
    }
    
    // Generate token
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1d' });

    // Test GET /api/users/bookmark
    const getRes = await fetch('http://localhost:5000/api/users/bookmark', {
      headers: {
        Cookie: `accessToken=${token}`
      }
    });
    console.log('GET response:', getRes.status, await getRes.json());

    // Test PUT /api/users/bookmark
    const putRes = await fetch('http://localhost:5000/api/users/bookmark', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `accessToken=${token}`
      },
      body: JSON.stringify({ siteId: null })
    });
    console.log('PUT response:', putRes.status, await putRes.json());

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
