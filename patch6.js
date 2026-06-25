const fs = require('fs');

const files = [
  'c:/Users/DREAMWORLD/Desktop/Dhruv/ERP App/my app/frontend/src/pages/staff/CreateOrder.jsx',
  'c:/Users/DREAMWORLD/Desktop/Dhruv/ERP App/my app/frontend/src/pages/inventory/CreateReceivedEntry.jsx',
  'c:/Users/DREAMWORLD/Desktop/Dhruv/ERP App/my app/frontend/src/pages/inventory/CreateUsed.jsx',
  'c:/Users/DREAMWORLD/Desktop/Dhruv/ERP App/my app/frontend/src/pages/staff/RequestDetail.jsx',
  'c:/Users/DREAMWORLD/Desktop/Dhruv/ERP App/my app/frontend/src/pages/inventory/RequestDetail.jsx',
  'c:/Users/DREAMWORLD/Desktop/Dhruv/ERP App/my app/frontend/src/pages/inventory/ReceivedDetail.jsx',
  'c:/Users/DREAMWORLD/Desktop/Dhruv/ERP App/my app/frontend/src/pages/inventory/UsedDetail.jsx'
];

const modalJSX = `
      <ImageCarouselModal
        isOpen={carouselModal.isOpen}
        onClose={() => setCarouselModal({ isOpen: false, images: [], index: 0 })}
        images={carouselModal.images}
        initialIndex={carouselModal.index}
      />
`;

files.forEach(f => {
  if (!fs.existsSync(f)) return;
  let content = fs.readFileSync(f, 'utf8');
  
  // Just in case, avoid double insertion
  if (content.includes('<ImageCarouselModal')) {
    console.log("Already has modal: " + f);
    return;
  }

  const lastParenIndex = content.lastIndexOf(');');
  if (lastParenIndex !== -1) {
    const beforeReturn = content.substring(0, lastParenIndex);
    const afterReturn = content.substring(lastParenIndex);
    
    const lastClosingTagIndex = beforeReturn.lastIndexOf('</');
    
    content = beforeReturn.substring(0, lastClosingTagIndex) + modalJSX + beforeReturn.substring(lastClosingTagIndex) + afterReturn;
    fs.writeFileSync(f, content);
    console.log("Injected in " + f);
  }
});
