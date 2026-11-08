const fs = require('fs');
const path = require('path');

const key = process.env.RESEND_API_KEY;
if (key) {
  const filesToInject = [
    path.join(__dirname, 'worker.js'),
    path.join(__dirname, 'functions', 'api', 'contact.js')
  ];

  filesToInject.forEach(file => {
    if (fs.existsSync(file)) {
      let code = fs.readFileSync(file, 'utf8');
      code = code.replace(/__INJECTED_RESEND_KEY__/g, key);
      fs.writeFileSync(file, code, 'utf8');
      console.log(`[Build] Injected RESEND_API_KEY into ${path.basename(file)} successfully.`);
    }
  });
} else {
  console.log('[Build] Note: No RESEND_API_KEY detected in build environment.');
}
