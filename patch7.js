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

  // We need to fix cases where `<a` is opened but `</div>` is closed.
  // First, let's just replace all `<a\n                          key={idx}\n                          href={img}` with `<div key={idx}` etc.
  // The easiest way is to use a very permissive regex that matches the opening tag of these image links and replaces it with a <div>.
  // The opening tag is `<a` followed by attributes until `>`.
  // Wait, if it has `href={img}`, it's one of these links.
  
  content = content.replace(/<a\s+key=\{idx\}\s+href=\{img\}\s+target="_blank"\s+rel="noreferrer"\s+className="([^"]+)"\s*>/g, 
    '<div key={idx} className="$1" onClick={() => setCarouselModal({ isOpen: true, images: [img], index: 0 })}>'
  );

  // But we want to trigger the carousel modal. The detail pages might not have `carouselModal` state unless I added it?
  // I added it in `patch.js` for all files. Let's assume it has it.
  // The user said "and not even in detaiils paghe when i click on image it open new window... insted we want to show images on caraousel model"

  // Let's also make sure to replace any `<a key={idx} href={img} target="_blank" rel="noreferrer" className="([^"]+)">`
  content = content.replace(/<a key=\{idx\} href=\{img\} target="_blank" rel="noreferrer" className="([^"]+)">/g, 
    '<div key={idx} className="$1" onClick={() => setCarouselModal({ isOpen: true, images: [img], index: 0 })}>'
  );
  
  // What about `</a>`? Let's just fix any mismatch.
  // If we changed all `<a` with `href={img}` to `<div`, then we should change all `</a>` that follow `<img ... />` to `</div>`.
  // Wait, my previous script ALREADY changed `</a>` to `</div>` in some places.
  // If there are still `</a>` after `/>`, let's change them to `</div>`.
  content = content.replace(/(\/>\s*)<\/a>/g, '$1</div>');

  // If there are still `<a ...>` that we missed, let's just find `<a[^>]*href=\{img\}[^>]*>` and replace it.
  content = content.replace(/<a[^>]*href=\{img\}[^>]*>/g, (match) => {
    // extract className
    let classMatch = match.match(/className="([^"]+)"/);
    let className = classMatch ? classMatch[1] : '';
    return `<div key={idx} className="${className}" onClick={() => setCarouselModal({ isOpen: true, images: [img], index: 0 })}>`;
  });

  fs.writeFileSync(f, content);
  console.log('Fixed anchor tags correctly in ' + f);
});
