const fs = require('fs');

const files = [
  'c:/Users/DREAMWORLD/Desktop/Dhruv/ERP App/my app/frontend/src/pages/staff/CreateOrder.jsx',
  'c:/Users/DREAMWORLD/Desktop/Dhruv/ERP App/my app/frontend/src/pages/inventory/CreateReceivedEntry.jsx',
  'c:/Users/DREAMWORLD/Desktop/Dhruv/ERP App/my app/frontend/src/pages/inventory/CreateUsed.jsx'
];

files.forEach(f => {
  if (!fs.existsSync(f)) return;
  let content = fs.readFileSync(f, 'utf8');

  // We want to insert the hidden input for name just before the select for materialId.
  // The select looks like:
  // <select
  //   {...register(`materials.${index}.materialId`, ...
  
  if (!content.includes('type="hidden" {...register(`materials.${index}.name`)}')) {
    content = content.replace(/(<select\s*[^>]*\{\.\.\.register\(`materials\.\$\{index\}\.materialId`)/g, 
      '<input type="hidden" {...register(`materials.${index}.name`)} />\n                      $1'
    );
    fs.writeFileSync(f, content);
    console.log("Injected hidden name input into " + f);
  }
});
