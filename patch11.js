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

  if (!content.includes('import ImageCarouselModal')) {
    const insertionPoint = content.indexOf('\n') + 1;
    content = content.substring(0, insertionPoint) + 
              "import ImageCarouselModal from '../../components/common/ImageCarouselModal';\n" + 
              content.substring(insertionPoint);
    fs.writeFileSync(f, content);
    console.log('Injected import into ' + f);
  }
});
