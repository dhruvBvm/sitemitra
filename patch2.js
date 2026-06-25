const fs = require('fs');

const files = [
  'c:/Users/DREAMWORLD/Desktop/Dhruv/ERP App/my app/frontend/src/pages/staff/CreateOrder.jsx',
  'c:/Users/DREAMWORLD/Desktop/Dhruv/ERP App/my app/frontend/src/pages/inventory/CreateReceivedEntry.jsx',
  'c:/Users/DREAMWORLD/Desktop/Dhruv/ERP App/my app/frontend/src/pages/inventory/CreateUsed.jsx',
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  
  // For material images (Create pages)
  content = content.replace(
    /className="relative w-\[80px\] h-\[80px\] rounded-md border border-transparent shrink-0"\s*>\s*<img src=\{url\} alt="spec" className="w-full h-full object-cover rounded-md" \/>\s*<button type="button" onClick=\{([^}]+)\} className="absolute -top-1\.5 -right-1\.5 bg-\[\#EF4444\] text-white rounded-full p-0\.5 shadow"/g,
    `className="relative w-16 h-16 rounded-md border border-gray-200 shrink-0">\n                              <img src={url} alt="spec" className="w-full h-full object-cover rounded-md cursor-pointer" onClick={() => setCarouselModal({ isOpen: true, images: materialImages[field.id], index: i })} />\n                              <button type="button" onClick={$1} className="absolute -top-1.5 -right-1.5 bg-[#EF4444] text-white rounded-full p-0.5 shadow z-10"`
  );

  // For global images (Create pages)
  content = content.replace(
    /className="relative w-\[80px\] h-\[80px\] bg-\[\#F3F4F6\] rounded-md border border-transparent shrink-0"\s*>\s*<img src=\{URL\.createObjectURL\(f\)\} alt="order" className="w-full h-full object-cover rounded-md" \/>\s*<button type="button" onClick=\{([^}]+)\} className="absolute -top-1\.5 -right-1\.5 bg-\[\#EF4444\] text-white rounded-full p-0\.5 shadow"/g,
    `className="relative w-16 h-16 bg-[#F3F4F6] rounded-md border border-gray-200 shrink-0">\n                    <img src={URL.createObjectURL(f)} alt="order" className="w-full h-full object-cover rounded-md cursor-pointer" onClick={() => setCarouselModal({ isOpen: true, images: imageFiles.map(file => URL.createObjectURL(file)), index: i })} />\n                    <button type="button" onClick={$1} className="absolute -top-1.5 -right-1.5 bg-[#EF4444] text-white rounded-full p-0.5 shadow z-10"`
  );

  // Note for CreateUsed it says alt="material" or "uploaded" instead of "spec" or "order"
  content = content.replace(
    /className="relative w-\[80px\] h-\[80px\] rounded-md border border-transparent shrink-0"\s*>\s*<img src=\{url\} alt="material" className="w-full h-full object-cover rounded-md" \/>\s*<button type="button" onClick=\{([^}]+)\} className="absolute -top-1\.5 -right-1\.5 bg-\[\#EF4444\] text-white rounded-full p-0\.5 shadow"/g,
    `className="relative w-16 h-16 rounded-md border border-gray-200 shrink-0">\n                              <img src={url} alt="material" className="w-full h-full object-cover rounded-md cursor-pointer" onClick={() => setCarouselModal({ isOpen: true, images: materialImages[field.id], index: i })} />\n                              <button type="button" onClick={$1} className="absolute -top-1.5 -right-1.5 bg-[#EF4444] text-white rounded-full p-0.5 shadow z-10"`
  );

  content = content.replace(
    /className="relative w-\[80px\] h-\[80px\] bg-\[\#F3F4F6\] rounded-md border border-transparent shrink-0"\s*>\s*<img src=\{URL\.createObjectURL\(f\)\} alt="uploaded" className="w-full h-full object-cover rounded-md" \/>\s*<button type="button" onClick=\{([^}]+)\} className="absolute -top-1\.5 -right-1\.5 bg-\[\#EF4444\] text-white rounded-full p-0\.5 shadow"/g,
    `className="relative w-16 h-16 bg-[#F3F4F6] rounded-md border border-gray-200 shrink-0">\n                       <img src={URL.createObjectURL(f)} alt="uploaded" className="w-full h-full object-cover rounded-md cursor-pointer" onClick={() => setCarouselModal({ isOpen: true, images: imageFiles.map(file => URL.createObjectURL(file)), index: i })} />\n                       <button type="button" onClick={$1} className="absolute -top-1.5 -right-1.5 bg-[#EF4444] text-white rounded-full p-0.5 shadow z-10"`
  );

  fs.writeFileSync(f, content);
  console.log("Patched create pages: " + f);
});

const detailFiles = [
  'c:/Users/DREAMWORLD/Desktop/Dhruv/ERP App/my app/frontend/src/pages/staff/RequestDetail.jsx',
  'c:/Users/DREAMWORLD/Desktop/Dhruv/ERP App/my app/frontend/src/pages/inventory/RequestDetail.jsx',
  'c:/Users/DREAMWORLD/Desktop/Dhruv/ERP App/my app/frontend/src/pages/inventory/ReceivedDetail.jsx',
  'c:/Users/DREAMWORLD/Desktop/Dhruv/ERP App/my app/frontend/src/pages/inventory/UsedDetail.jsx'
];

detailFiles.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  
  // In details pages, it maps over item.images or request.images
  // <div key={idx} className="w-16 h-16 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
  //   <img src={img} alt="material" className="w-full h-full object-cover" />
  // </div>
  
  content = content.replace(
    /className="w-16 h-16 rounded-md overflow-hidden bg-gray-100 flex-shrink-0"\s*>\s*<img src=\{img\} alt="material" className="w-full h-full object-cover" \/>/g,
    `className="w-16 h-16 rounded-md overflow-hidden bg-gray-100 flex-shrink-0 cursor-pointer border border-gray-200" onClick={() => setCarouselModal({ isOpen: true, images: item.images || [], index: idx })}>\n                          <img src={img} alt="material" className="w-full h-full object-cover hover:opacity-80 transition-opacity" />`
  );

  content = content.replace(
    /className="w-16 h-16 rounded-md overflow-hidden bg-gray-100 flex-shrink-0"\s*>\s*<img src=\{img\} alt="attachment" className="w-full h-full object-cover" \/>/g,
    `className="w-16 h-16 rounded-md overflow-hidden bg-gray-100 flex-shrink-0 cursor-pointer border border-gray-200" onClick={() => setCarouselModal({ isOpen: true, images: request?.images || entry?.images || data?.images || [], index: idx })}>\n                  <img src={img} alt="attachment" className="w-full h-full object-cover hover:opacity-80 transition-opacity" />`
  );

  fs.writeFileSync(f, content);
  console.log("Patched details pages: " + f);
});

