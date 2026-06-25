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

  // Change <a key={idx} href={img} target="_blank" rel="noreferrer" className="w-16 h-16 rounded border border-transparent overflow-hidden hover:scale-105 transition-transform block"> to <div ...>
  // Wait, the previous patch changed the className string anyway.
  // Let's just find `<a key={idx} href={img} target="_blank" rel="noreferrer"` and change to `<div key={idx}`
  content = content.replace(/<a key=\{idx\} href=\{img\} target="_blank" rel="noreferrer"/g, '<div key={idx}');

  // Replace </a> with </div>
  // Specifically, find `/>\n                        </a>` and `/>\n                  </a>`
  content = content.replace(/(\/>\s*)<\/a>/g, '$1</div>');

  fs.writeFileSync(f, content);
  console.log('Fixed anchor tags in ' + f);
});
