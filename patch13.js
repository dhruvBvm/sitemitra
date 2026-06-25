const fs = require('fs');

const files = [
  { path: 'c:/Users/DREAMWORLD/Desktop/Dhruv/ERP App/my app/frontend/src/pages/staff/RequestDetail.jsx', globalArray: 'request.imageUrls' },
  { path: 'c:/Users/DREAMWORLD/Desktop/Dhruv/ERP App/my app/frontend/src/pages/inventory/RequestDetail.jsx', globalArray: 'request.imageUrls' },
  { path: 'c:/Users/DREAMWORLD/Desktop/Dhruv/ERP App/my app/frontend/src/pages/inventory/ReceivedDetail.jsx', globalArray: 'entry.imageUrls' }
];

files.forEach(({ path, globalArray }) => {
  if (!fs.existsSync(path)) return;
  let content = fs.readFileSync(path, 'utf8');

  // Replace mat.imageUrls div
  const matDivOriginal = '<div key={idx} className="w-16 h-16 rounded border border-transparent overflow-hidden hover:scale-105 transition-transform block">';
  const matDivReplacement = `<div key={idx} className="w-16 h-16 rounded border border-transparent overflow-hidden hover:scale-105 transition-transform block cursor-pointer" onClick={() => setCarouselModal({ isOpen: true, images: mat.imageUrls, index: idx })}>`;
  content = content.replace(new RegExp(matDivOriginal.replace(/[.*+?^$\/{}()|[\\]\\\\]/g, '\\\\$&'), 'g'), matDivReplacement);

  // Replace global array div
  const globalDivOriginal = '<div key={idx} className="w-20 h-20 rounded-md border border-transparent overflow-hidden hover:scale-105 transition-transform block">';
  const globalDivReplacement = `<div key={idx} className="w-20 h-20 rounded-md border border-transparent overflow-hidden hover:scale-105 transition-transform block cursor-pointer" onClick={() => setCarouselModal({ isOpen: true, images: ${globalArray}, index: idx })}>`;
  content = content.replace(new RegExp(globalDivOriginal.replace(/[.*+?^$\/{}()|[\\]\\\\]/g, '\\\\$&'), 'g'), globalDivReplacement);

  fs.writeFileSync(path, content);
  console.log('Fixed onClicks in ' + path);
});
