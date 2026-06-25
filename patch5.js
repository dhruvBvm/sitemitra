const fs = require('fs');

const filesToInjectModal = [
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

filesToInjectModal.forEach(f => {
  if (!fs.existsSync(f)) return;
  let content = fs.readFileSync(f, 'utf8');

  // Strip out any existing ImageCarouselModal just to be safe
  content = content.replace(/<ImageCarouselModal[\s\S]*?\/>\s*/g, '');

  // Now we need to inject it before the last </div> that is before the final );
  // A robust way is to find the last index of `);` (which closes the return statement).
  // Then we go backwards to find the `</` tag right before it.
  
  const lastParenIndex = content.lastIndexOf(');');
  if (lastParenIndex === -1) {
    console.log("Could not find ');' in " + f);
    return;
  }
  
  const contentBeforeReturnEnd = content.substring(0, lastParenIndex);
  const contentAfterReturnEnd = content.substring(lastParenIndex);
  
  // Find the last closing tag in contentBeforeReturnEnd
  const lastClosingTagIndex = contentBeforeReturnEnd.lastIndexOf('</');
  if (lastClosingTagIndex === -1) {
    console.log("Could not find closing tag in " + f);
    return;
  }
  
  const finalContent = contentBeforeReturnEnd.substring(0, lastClosingTagIndex) + modalJSX + contentBeforeReturnEnd.substring(lastClosingTagIndex) + contentAfterReturnEnd;
  
  fs.writeFileSync(f, finalContent);
  console.log('Successfully injected modal into ' + f);
});
