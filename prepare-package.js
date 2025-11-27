/**
 * Prepare package.json for distribution
 * This script copies package.json to dist/ and adjusts the "main" field
 * to be relative to the dist directory (for Logseq plugin installation)
 */

const fs = require('fs');
const path = require('path');

// Read the root package.json
const packagePath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

// Adjust the "main" field for the dist directory
// Change "dist/index.html" to "index.html"
packageJson.main = 'index.html';

// Remove dev dependencies and scripts that are not needed in the plugin
delete packageJson.devDependencies;
delete packageJson.scripts;

// Write to dist/package.json
const distPath = path.join(__dirname, 'dist', 'package.json');
fs.writeFileSync(distPath, JSON.stringify(packageJson, null, 2), 'utf-8');

console.log('✓ Prepared package.json for distribution');
console.log(`  main: "${packageJson.main}"`);

