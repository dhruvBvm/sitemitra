const fs = require('fs');

const createFiles = [
  'c:/Users/DREAMWORLD/Desktop/Dhruv/ERP App/my app/frontend/src/pages/staff/CreateOrder.jsx',
  'c:/Users/DREAMWORLD/Desktop/Dhruv/ERP App/my app/frontend/src/pages/inventory/CreateReceivedEntry.jsx',
  'c:/Users/DREAMWORLD/Desktop/Dhruv/ERP App/my app/frontend/src/pages/inventory/CreateUsed.jsx'
];

const modalJSX = `
      <ImageCarouselModal
        isOpen={carouselModal.isOpen}
        onClose={() => setCarouselModal({ isOpen: false, images: [], index: 0 })}
        images={carouselModal.images}
        initialIndex={carouselModal.index}
      />
`;

createFiles.forEach(f => {
  if (!fs.existsSync(f)) return;
  let content = fs.readFileSync(f, 'utf8');

  // Fix 1: Add ImageCarouselModal before the final </div>
  if (!content.includes('<ImageCarouselModal')) {
    const lastParenIndex = content.lastIndexOf(');');
    if (lastParenIndex !== -1) {
      const beforeReturn = content.substring(0, lastParenIndex);
      const afterReturn = content.substring(lastParenIndex);
      const lastClosingTagIndex = beforeReturn.lastIndexOf('</');
      content = beforeReturn.substring(0, lastClosingTagIndex) + modalJSX + beforeReturn.substring(lastClosingTagIndex) + afterReturn;
    }
  }

  // Fix 2: Add hidden input for name
  if (!content.includes('type="hidden" {...register(`materials.${index}.name`)}')) {
    // Let's find the exact string to replace using indexOf
    const searchString = '{...register(`materials.${index}.materialId`, {';
    const indexStr = content.indexOf(searchString);
    if (indexStr !== -1) {
      // Find the `<select` right before this.
      const beforeMatch = content.substring(0, indexStr);
      const selectIndex = beforeMatch.lastIndexOf('<select');
      if (selectIndex !== -1) {
        content = content.substring(0, selectIndex) + 
                  '<input type="hidden" {...register(`materials.${index}.name`)} />\n                      ' + 
                  content.substring(selectIndex);
      }
    }
  }

  fs.writeFileSync(f, content);
  console.log("Fixed " + f);
});

// Also fix details files modals
const detailFiles = [
  'c:/Users/DREAMWORLD/Desktop/Dhruv/ERP App/my app/frontend/src/pages/staff/RequestDetail.jsx',
  'c:/Users/DREAMWORLD/Desktop/Dhruv/ERP App/my app/frontend/src/pages/inventory/RequestDetail.jsx',
  'c:/Users/DREAMWORLD/Desktop/Dhruv/ERP App/my app/frontend/src/pages/inventory/ReceivedDetail.jsx',
  'c:/Users/DREAMWORLD/Desktop/Dhruv/ERP App/my app/frontend/src/pages/inventory/UsedDetail.jsx'
];

detailFiles.forEach(f => {
  if (!fs.existsSync(f)) return;
  let content = fs.readFileSync(f, 'utf8');
  if (!content.includes('<ImageCarouselModal')) {
    const lastParenIndex = content.lastIndexOf(');');
    if (lastParenIndex !== -1) {
      const beforeReturn = content.substring(0, lastParenIndex);
      const afterReturn = content.substring(lastParenIndex);
      const lastClosingTagIndex = beforeReturn.lastIndexOf('</');
      content = beforeReturn.substring(0, lastClosingTagIndex) + modalJSX + beforeReturn.substring(lastClosingTagIndex) + afterReturn;
      fs.writeFileSync(f, content);
    }
  }
});

