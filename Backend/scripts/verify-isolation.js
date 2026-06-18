const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });
const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api`;

const logTest = (name, passed, detail = '') => {
  console.log(`${passed ? '✅' : '❌'} ${name} ${detail ? `(${detail})` : ''}`);
};

// Simple cookie parser helper
const getCookieString = (headers) => {
  const setCookie = headers.get('set-cookie');
  if (!setCookie) return '';
  // set-cookie can contain multiple cookies separated by comma in some runtimes, or it can be a single string.
  // We want to find the accessToken=... part.
  const match = setCookie.match(/accessToken=[^;]+/);
  return match ? match[0] : '';
};

const run = async () => {
  try {
    console.log('Starting backend tenant isolation verification...\n');

    // 1. Login Owner 1
    const loginRes1 = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId: 'owner@example.com', password: 'owner123' })
    });
    if (!loginRes1.ok) {
      const rawText = await loginRes1.text();
      throw new Error(`Owner 1 login failed with status ${loginRes1.status}: ${rawText}`);
    }
    const cookie1 = getCookieString(loginRes1.headers);
    const user1 = await loginRes1.json();
    console.log(`Logged in Owner 1: ${user1.email} (Cookie: ${cookie1.slice(0, 20)}...)`);

    // 2. Login Owner 2
    const loginRes2 = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId: 'owner2@example.com', password: 'owner123' })
    });
    if (!loginRes2.ok) {
      const rawText = await loginRes2.text();
      throw new Error(`Owner 2 login failed with status ${loginRes2.status}: ${rawText}`);
    }
    const cookie2 = getCookieString(loginRes2.headers);
    const user2 = await loginRes2.json();
    console.log(`Logged in Owner 2: ${user2.email} (Cookie: ${cookie2.slice(0, 20)}...)\n`);

    // Helper headers with cookies
    const authHeader1 = { 'Cookie': cookie1, 'Content-Type': 'application/json' };
    const authHeader2 = { 'Cookie': cookie2, 'Content-Type': 'application/json' };

    // 3. Create unique site codes
    const randomCode1 = `S1-${Math.floor(Math.random() * 10000)}`;
    const randomCode2 = `S2-${Math.floor(Math.random() * 10000)}`;

    // 4. Create Site for Owner 1
    const createSiteRes1 = await fetch(`${BASE_URL}/owner/sites`, {
      method: 'POST',
      headers: authHeader1,
      body: JSON.stringify({
        siteName: 'Site for Owner 1',
        siteCode: randomCode1,
        address: 'Addr 1'
      })
    });
    const site1Data = await createSiteRes1.json();
    const site1 = site1Data.data;
    logTest('Create Site for Owner 1', createSiteRes1.ok && !!site1, `siteId: ${site1?._id}, code: ${randomCode1}`);

    // 5. Create Site for Owner 2
    const createSiteRes2 = await fetch(`${BASE_URL}/owner/sites`, {
      method: 'POST',
      headers: authHeader2,
      body: JSON.stringify({
        siteName: 'Site for Owner 2',
        siteCode: randomCode2,
        address: 'Addr 2'
      })
    });
    const site2Data = await createSiteRes2.json();
    const site2 = site2Data.data;
    logTest('Create Site for Owner 2', createSiteRes2.ok && !!site2, `siteId: ${site2?._id}, code: ${randomCode2}`);

    // 6. Verify Owner 1 Site Listing only returns Site 1
    const listSitesRes1 = await fetch(`${BASE_URL}/owner/sites`, {
      method: 'GET',
      headers: authHeader1
    });
    const listSites1 = await listSitesRes1.json();
    const hasOnlyOwner1Sites = listSites1.data.every(s => s.ownerId === user1._id);
    const hasSite1 = listSites1.data.some(s => s._id === site1._id);
    const hasSite2In1 = listSites1.data.some(s => s._id === site2._id);
    logTest('Owner 1 Site listing isolation', hasOnlyOwner1Sites && hasSite1 && !hasSite2In1, `Returned ${listSites1.data.length} sites`);

    // 7. Verify Owner 2 Site Listing only returns Site 2
    const listSitesRes2 = await fetch(`${BASE_URL}/owner/sites`, {
      method: 'GET',
      headers: authHeader2
    });
    const listSites2 = await listSitesRes2.json();
    const hasOnlyOwner2Sites = listSites2.data.every(s => s.ownerId === user2._id);
    const hasSite2 = listSites2.data.some(s => s._id === site2._id);
    const hasSite1In2 = listSites2.data.some(s => s._id === site1._id);
    logTest('Owner 2 Site listing isolation', hasOnlyOwner2Sites && hasSite2 && !hasSite1In2, `Returned ${listSites2.data.length} sites`);

    // 8. Owner 2 tries to GET Owner 1 Site by ID
    const getSiteRes = await fetch(`${BASE_URL}/owner/sites/${site1._id}`, {
      method: 'GET',
      headers: authHeader2
    });
    logTest('Owner 2 cannot GET Owner 1 Site (404/403 Expected)', getSiteRes.status === 404 || getSiteRes.status === 403, `Status: ${getSiteRes.status}`);

    // 9. Owner 2 tries to PUT/Update Owner 1 Site
    const updateSiteRes = await fetch(`${BASE_URL}/owner/sites/${site1._id}`, {
      method: 'PUT',
      headers: authHeader2,
      body: JSON.stringify({ siteName: 'Hacked name' })
    });
    logTest('Owner 2 cannot PUT/Update Owner 1 Site (404/403 Expected)', updateSiteRes.status === 404 || updateSiteRes.status === 403, `Status: ${updateSiteRes.status}`);

    // 10. Owner 2 tries to DELETE Owner 1 Site
    const deleteSiteRes = await fetch(`${BASE_URL}/owner/sites/${site1._id}`, {
      method: 'DELETE',
      headers: authHeader2
    });
    logTest('Owner 2 cannot DELETE Owner 1 Site (404/403 Expected)', deleteSiteRes.status === 404 || deleteSiteRes.status === 403, `Status: ${deleteSiteRes.status}`);

    // 11. Create Material for Owner 1
    const createMatRes1 = await fetch(`${BASE_URL}/owner/materials`, {
      method: 'POST',
      headers: authHeader1,
      body: JSON.stringify({
        materialName: `Cement-${Math.floor(Math.random() * 1000)}`,
        unit: 'bags'
      })
    });
    const mat1Data = await createMatRes1.json();
    const mat1 = mat1Data.data;
    logTest('Create Material for Owner 1', createMatRes1.ok && !!mat1, `materialId: ${mat1?._id}`);

    // 12. Owner 2 tries to GET Owner 1 Material by ID
    const getMatRes = await fetch(`${BASE_URL}/owner/materials/${mat1._id}`, {
      method: 'GET',
      headers: authHeader2
    });
    logTest('Owner 2 cannot GET Owner 1 Material (404/403 Expected)', getMatRes.status === 404 || getMatRes.status === 403, `Status: ${getMatRes.status}`);

    // 13. Owner 2 tries to PUT/Update Owner 1 Material
    const updateMatRes = await fetch(`${BASE_URL}/owner/materials/${mat1._id}`, {
      method: 'PUT',
      headers: authHeader2,
      body: JSON.stringify({ materialName: 'Hacked Cement' })
    });
    logTest('Owner 2 cannot PUT/Update Owner 1 Material (404/403 Expected)', updateMatRes.status === 404 || updateMatRes.status === 403, `Status: ${updateMatRes.status}`);

    // 14. Owner 2 tries to DELETE Owner 1 Material
    const deleteMatRes = await fetch(`${BASE_URL}/owner/materials/${mat1._id}`, {
      method: 'DELETE',
      headers: authHeader2
    });
    logTest('Owner 2 cannot DELETE Owner 1 Material (404/403 Expected)', deleteMatRes.status === 404 || deleteMatRes.status === 403, `Status: ${deleteMatRes.status}`);

    console.log('\nVerification complete!');
    process.exit(0);
  } catch (err) {
    console.error('Verification failed with error:', err);
    process.exit(1);
  }
};

run();
