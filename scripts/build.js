const { execSync } = require('child_process');
const fs = require('fs');

if (fs.existsSync('frontend')) {
  console.log('Building from repository root...');
  execSync('npm --prefix frontend install --include=dev && npm --prefix frontend run build', { stdio: 'inherit' });
} else {
  console.log('Building from inside frontend directory...');
  execSync('npm install --include=dev && npm run build', { stdio: 'inherit' });
}
