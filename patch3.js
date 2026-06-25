const fs = require('fs');

const files = [
  'c:/Users/DREAMWORLD/Desktop/Dhruv/ERP App/my app/frontend/src/pages/staff/CreateOrder.jsx',
  'c:/Users/DREAMWORLD/Desktop/Dhruv/ERP App/my app/frontend/src/pages/inventory/CreateReceivedEntry.jsx',
  'c:/Users/DREAMWORLD/Desktop/Dhruv/ERP App/my app/frontend/src/pages/inventory/CreateUsed.jsx',
];

files.forEach(f => {
  if (!fs.existsSync(f)) return;
  let content = fs.readFileSync(f, 'utf8');
  
  // Patch material images
  content = content.replace(
    /className="relative w-16 h-16 rounded-md border border-gray-200 shrink-0 overflow-hidden"\s*>\s*<img src=\{url\} alt="([^"]+)" className="w-full h-full object-cover cursor-pointer" onClick=\{([^}]+)\}\s*\/>/g,
    `className="relative rounded-md border border-gray-200 shrink-0 overflow-hidden" style={{ width: '80px', height: '80px' }}>\n                              <img src={url} alt="$1" className="cursor-pointer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onClick={$2} />`
  );

  // Patch global images
  content = content.replace(
    /className="relative w-16 h-16 bg-\[\#F3F4F6\] rounded-md border border-gray-200 shrink-0 overflow-hidden"\s*>\s*<img src=\{URL\.createObjectURL\(f\)\} alt="([^"]+)" className="w-full h-full object-cover cursor-pointer" onClick=\{([^}]+)\}\s*\/>/g,
    `className="relative bg-[#F3F4F6] rounded-md border border-gray-200 shrink-0 overflow-hidden" style={{ width: '80px', height: '80px' }}>\n                       <img src={URL.createObjectURL(f)} alt="$1" className="cursor-pointer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onClick={$2} />`
  );

  fs.writeFileSync(f, content);
  console.log("Patched fixed styles for: " + f);
});

const detailFiles = [
  'c:/Users/DREAMWORLD/Desktop/Dhruv/ERP App/my app/frontend/src/pages/staff/RequestDetail.jsx',
  'c:/Users/DREAMWORLD/Desktop/Dhruv/ERP App/my app/frontend/src/pages/inventory/RequestDetail.jsx',
  'c:/Users/DREAMWORLD/Desktop/Dhruv/ERP App/my app/frontend/src/pages/inventory/ReceivedDetail.jsx',
  'c:/Users/DREAMWORLD/Desktop/Dhruv/ERP App/my app/frontend/src/pages/inventory/UsedDetail.jsx'
];

detailFiles.forEach(f => {
  if (!fs.existsSync(f)) return;
  let content = fs.readFileSync(f, 'utf8');

  content = content.replace(
    /className="w-16 h-16 rounded-md overflow-hidden bg-gray-100 flex-shrink-0 cursor-pointer border border-gray-200" onClick=\{([^}]+)\}>\s*<img src=\{img\} alt="([^"]+)" className="w-full h-full object-cover hover:opacity-80 transition-opacity" \/>/g,
    `className="rounded-md overflow-hidden bg-gray-100 flex-shrink-0 cursor-pointer border border-gray-200" style={{ width: '80px', height: '80px' }} onClick={$1}>\n                          <img src={img} alt="$2" style={{ width: '100%', height: '100%', objectFit: 'cover' }} className="hover:opacity-80 transition-opacity" />`
  );

  fs.writeFileSync(f, content);
  console.log("Patched fixed styles for details: " + f);
});
