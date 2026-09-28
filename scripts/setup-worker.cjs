const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const indexJs = path.join(distDir, 'index.js');
const workerJs = path.join(distDir, '_worker.js');

if (fs.existsSync(indexJs)) {
  fs.copyFileSync(indexJs, workerJs);
  console.log('✓ Successfully created dist/_worker.js for Cloudflare Pages Advanced Mode');
} else if (fs.existsSync(workerJs)) {
  console.log('✓ dist/_worker.js already exists');
} else {
  console.warn('⚠️ Warning: neither dist/index.js nor dist/_worker.js was found');
}
