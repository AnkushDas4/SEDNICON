#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

const args = process.argv.slice(2);

if (args.length === 0 || args[0] === 'help') {
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
  `);
  process.exit(0);
}

const command = args[0];

if (command === 'get') {
  const iconName = args[1];
  if (!iconName || iconName.startsWith('--')) {
    console.error('❌ Please specify an icon name. Example: npx sednicon get rocket');
    process.exit(1);
  }

  let color = '000000';
  let size = 24;
  let outDir = process.cwd();

  // Parse basic arguments
  for (let i = 2; i < args.length; i++) {
    if (args[i] === '--color' && args[i+1]) color = args[++i].replace('#', '');
    if (args[i] === '--size' && args[i+1]) size = parseInt(args[++i], 10);
    if (args[i] === '--out' && args[i+1]) outDir = args[++i];
  }

  const url = `https://sednicon.sednium.com/api/render?q=${encodeURIComponent(iconName)}&color=${color}&size=${size}`;
  const destPath = path.join(outDir, `${iconName}.svg`);

  console.log(`✨ Fetching ${iconName}...`);

  https.get(url, (res) => {
    if (res.statusCode !== 200) {
      console.error(`❌ Failed to fetch icon (Status: ${res.statusCode})`);
      process.exit(1);
    }
    
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(destPath, data);
      console.log(`✅ Saved successfully to ${destPath}`);
    });
  }).on('error', (err) => {
    console.error(`❌ Network error: ${err.message}`);
    process.exit(1);
  });
}
