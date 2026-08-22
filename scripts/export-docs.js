import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const docsDir = path.join(rootDir, 'docs');
const distDir = path.join(rootDir, 'dist');
const publicDir = path.join(rootDir, 'public');

// Ensure docs directory exists
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

// 1. Copy built frontend files from dist/ (except server.cjs/maps)
if (fs.existsSync(distDir)) {
  const distEntries = fs.readdirSync(distDir);
  for (const entry of distEntries) {
    if (entry.startsWith('server.cjs')) continue;
    const srcPath = path.join(distDir, entry);
    const destPath = path.join(docsDir, entry);
    fs.cpSync(srcPath, destPath, { recursive: true, force: true });
  }
}

// 2. Copy public directory files
if (fs.existsSync(publicDir)) {
  const publicEntries = fs.readdirSync(publicDir);
  for (const entry of publicEntries) {
    const srcPath = path.join(publicDir, entry);
    const destPath = path.join(docsDir, entry);
    fs.cpSync(srcPath, destPath, { recursive: true, force: true });
  }
}

// 3. Copy PHP backend and configuration files
const phpFiles = [
  'api.php',
  'config.php',
  'db.php',
  'jwt.php',
  'mail.php',
  'telegram.php',
  'diag.php',
  'test.php',
  '.htaccess',
  'schema.sql'
];

for (const file of phpFiles) {
  const srcPath = path.join(rootDir, file);
  const destPath = path.join(docsDir, file);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
  }
}

console.log('✅ Successfully exported website and PHP backend to docs/');
