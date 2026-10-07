#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';

const args = process.argv.slice(2);

function printHelp() {
  console.log(`
🚀 Sednicon CLI

Usage:
  npx sednicon get <icon_name> [options]

Options:
  --color <hex>    Color of the icon (default: 000000)
  --size <px>      Size of the icon in pixels (default: 24)
  --out <dir>      Output directory (default: current directory)

Example:
  npx sednicon get rocket --color ff6600 --size 32
  npx sednicon get lucide:rocket --color 2563eb
  `);
}

if (args.length === 0 || args[0] === 'help' || args[0] === '--help' || args[0] === '-h') {
  printHelp();
  process.exit(0);
}

const command = args[0];

if (command === 'get') {
  const rawIconName = args[1];
  if (!rawIconName || rawIconName.startsWith('--')) {
    console.error('❌ Please specify an icon name. Example: npx sednicon get rocket');
    process.exit(1);
  }

  let color = '000000';
  let size = 24;
  let outDir = process.cwd();

  // Parse arguments
  for (let i = 2; i < args.length; i++) {
    if (args[i] === '--color' && args[i + 1]) {
      color = args[++i].replace('#', '');
    }
    if (args[i] === '--size' && args[i + 1]) {
      const parsedSize = parseInt(args[++i], 10);
      if (!isNaN(parsedSize) && parsedSize > 0) size = parsedSize;
    }
    if (args[i] === '--out' && args[i + 1]) {
      outDir = args[++i];
    }
  }

  // Sanitize file name for cross-platform OS compatibility (replace colons and path traversal)
  const safeBaseName = path.basename(rawIconName).replace(/:/g, '-').replace(/[^a-zA-Z0-9_-]/g, '_');
  const destPath = path.join(outDir, `${safeBaseName}.svg`);
  const url = `https://sednicon.sednium.com/api/render?q=${encodeURIComponent(rawIconName)}&color=${encodeURIComponent(color)}&size=${size}`;

  console.log(`✨ Fetching ${rawIconName}...`);

  https.get(url, (res) => {
    if (res.statusCode !== 200) {
      console.error(`❌ Failed to fetch icon (Status: ${res.statusCode})`);
      process.exit(1);
    }
    
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
        fs.writeFileSync(destPath, data);
        console.log(`✅ Saved successfully to ${destPath}`);
      } catch (err) {
        console.error(`❌ Failed to write file: ${err.message}`);
        process.exit(1);
      }
    });
  }).on('error', (err) => {
    console.error(`❌ Network error: ${err.message}`);
    process.exit(1);
  });
} else {
  console.error(`❌ Unknown command: "${command}". Run "npx sednicon help" to see usage.`);
  process.exit(1);
}
