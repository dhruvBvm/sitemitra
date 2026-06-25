const fs = require('fs');

const detailFiles = [
  'c:/Users/DREAMWORLD/Desktop/Dhruv/ERP App/my app/frontend/src/pages/inventory/RequestDetail.jsx',
  'c:/Users/DREAMWORLD/Desktop/Dhruv/ERP App/my app/frontend/src/pages/inventory/ReceivedDetail.jsx',
  'c:/Users/DREAMWORLD/Desktop/Dhruv/ERP App/my app/frontend/src/pages/inventory/UsedDetail.jsx'
];

detailFiles.forEach(f => {
  if (!fs.existsSync(f)) return;
  let content = fs.readFileSync(f, 'utf8');

  // Inject only if it's missing
  if (!content.includes('const [carouselModal, setCarouselModal] = useState')) {
    content = content.replace(
      /const \[loading, setLoading\] = useState\(true\);\r?\n/,
      'const [loading, setLoading] = useState(true);\n  const [carouselModal, setCarouselModal] = useState({ isOpen: false, images: [], index: 0 });\n'
    );
    fs.writeFileSync(f, content);
    console.log('Injected carouselModal state into ' + f);
  }
});
