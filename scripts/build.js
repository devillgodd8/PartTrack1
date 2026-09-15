const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const isRoot = fs.existsSync('frontend');
const frontendDir = isRoot ? path.resolve(__dirname, '../frontend') : process.cwd();

console.log(`Building frontend in: ${frontendDir}`);

// Set NODE_ENV to development during install so devDependencies (vite, tailwind) are always installed
const buildEnv = { ...process.env, NODE_ENV: 'development' };

try {
  console.log('Installing frontend dependencies...');
  execSync('npm install --include=dev --include=optional --legacy-peer-deps', {
    cwd: frontendDir,
    stdio: 'inherit',
    env: buildEnv,
  });
} catch (err) {
  console.warn('Standard install failed, retrying with force...', err.message);
  execSync('npm install --force', {
    cwd: frontendDir,
    stdio: 'inherit',
    env: buildEnv,
  });
}

console.log('Building frontend assets...');
execSync('npm run build', {
  cwd: frontendDir,
  stdio: 'inherit',
  env: buildEnv,
});

console.log('Frontend build completed successfully.');
