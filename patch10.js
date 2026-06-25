const fs = require('fs');

const detailFiles = [
  'c:/Users/DREAMWORLD/Desktop/Dhruv/ERP App/my app/frontend/src/pages/staff/RequestDetail.jsx',
  'c:/Users/DREAMWORLD/Desktop/Dhruv/ERP App/my app/frontend/src/pages/inventory/RequestDetail.jsx',
  'c:/Users/DREAMWORLD/Desktop/Dhruv/ERP App/my app/frontend/src/pages/inventory/ReceivedDetail.jsx',
  'c:/Users/DREAMWORLD/Desktop/Dhruv/ERP App/my app/frontend/src/pages/inventory/UsedDetail.jsx'
];

detailFiles.forEach(f => {
  if (!fs.existsSync(f)) return;
  let content = fs.readFileSync(f, 'utf8');

  // For material images inside mat.imageUrls
  content = content.replace(/images:\s*\[img\],\s*index:\s*0\s*\}/g, (match, offset, str) => {
    // Let's determine if this is inside `mat.imageUrls` or `entry.imageUrls` or `req.imageUrls`.
    // We can just look backward to see the closest `.map((img, idx)`
    const before = str.substring(0, offset);
    
    // Find the closest `.map` before this offset
    const lastMap = before.lastIndexOf('.map(');
    if (lastMap !== -1) {
      // Look for the array name right before `.map(`
      // e.g. `mat.imageUrls.map(` or `entry.imageUrls.map(` or `request.imageUrls.map(`
      const sliceBeforeMap = before.substring(Math.max(0, lastMap - 30), lastMap);
      
      let arrayName = '';
      if (sliceBeforeMap.includes('mat.imageUrls')) arrayName = 'mat.imageUrls';
      else if (sliceBeforeMap.includes('entry.imageUrls')) arrayName = 'entry.imageUrls';
      else if (sliceBeforeMap.includes('request.imageUrls')) arrayName = 'request.imageUrls';
      else if (sliceBeforeMap.includes('req.imageUrls')) arrayName = 'req.imageUrls';
      
      if (arrayName) {
        return `images: ${arrayName}, index: idx }`;
      }
    }
    
    return match; // fallback
  });

  fs.writeFileSync(f, content);
  console.log("Fixed carousel arrays in " + f);
});
