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

files.forEach(f => {
  if (!fs.existsSync(f)) {
    console.log("Not found: " + f);
    return;
  }
  let content = fs.readFileSync(f, 'utf8');
  let changed = false;

  // Add import if not present
  if (!content.includes('ImageCarouselModal')) {
    content = content.replace(/(import .* from '.*';\n)/, "$1import ImageCarouselModal from '../../components/common/ImageCarouselModal';\n");
    changed = true;
  }

  // Add state if not present
  if (!content.includes('const [carouselModal')) {
    content = content.replace(/(const \[.*\] = useState\(.*\);\n)/, "$1  const [carouselModal, setCarouselModal] = useState({ isOpen: false, images: [], index: 0 });\n");
    changed = true;
  }

  // Add the ImageCarouselModal component to the very end of the file right before the last closing tag or </div></>
  if (!content.includes('<ImageCarouselModal')) {
    content = content.replace(/(<\/[a-zA-Z]+>\s*<\/>\s*)$/, 
      `  <ImageCarouselModal
        isOpen={carouselModal.isOpen}
        onClose={() => setCarouselModal({ isOpen: false, images: [], index: 0 })}
        images={carouselModal.images}
        initialIndex={carouselModal.index}
      />\n$1`
    );
    // for RequestDetail, UsedDetail which might just end with </>
    if (!content.includes('<ImageCarouselModal')) {
        content = content.replace(/(<\/>\s*)$/, 
          `  <ImageCarouselModal
            isOpen={carouselModal.isOpen}
            onClose={() => setCarouselModal({ isOpen: false, images: [], index: 0 })}
            images={carouselModal.images}
            initialIndex={carouselModal.index}
          />\n$1`
        );
    }
    // Try before the last div if neither worked
    if (!content.includes('<ImageCarouselModal')) {
        content = content.replace(/(<\/div>\s*<\/>\s*)$/, 
          `  <ImageCarouselModal
            isOpen={carouselModal.isOpen}
            onClose={() => setCarouselModal({ isOpen: false, images: [], index: 0 })}
            images={carouselModal.images}
            initialIndex={carouselModal.index}
          />\n$1`
        );
    }
    // If it STILL didn't work (e.g. they end in </div> only)
    if (!content.includes('<ImageCarouselModal')) {
        content = content.replace(/(<\/div>\s*)$/, 
          `  <ImageCarouselModal
            isOpen={carouselModal.isOpen}
            onClose={() => setCarouselModal({ isOpen: false, images: [], index: 0 })}
            images={carouselModal.images}
            initialIndex={carouselModal.index}
          />\n$1`
        );
    }
    changed = true;
  }

  // Rewrite image mappings for material images in Create pages
  const imgRegex = /<img src=\{([^}]+)\} alt="[^"]+" className="w-full h-full object-cover( rounded-md)?" \/>/g;
  
  // We need to inject onClick to open the modal. But wait, replacing with a simple string is tricky since the images array isn't always named the same.
  // Instead of a global replace for the onClick, let's just use replace_file_content or multi_replace.
  
  if (changed) {
    fs.writeFileSync(f, content);
    console.log('Updated imports and state for ' + f);
  }
});
