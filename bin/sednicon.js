#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { svgToReact } from '../src/utils/api.js';

const args = process.argv.slice(2);

function printHelp() {
  console.log(`
Sednicon CLI

Usage:
  npx sednicon get <icon-name> [options]
  npx sednicon help

Options:
  --size <px>             Icon size (1–2048, default: 24)
  --color <hex|name>      Icon color (default: 000000)
  --format <svg|react|url> Output format (default: svg)
  --out, --output <path>  Output file, or directory when no extension is given

Examples:
  npx sednicon get rocket
  npx sednicon get lucide:rocket --size 48 --color 2563eb
  npx sednicon get terminal --format react --out ./src/icons/TerminalIcon.jsx
`);
}

function toComponentName(iconName) {
  const words = iconName.split(':').pop().split(/[^a-zA-Z0-9]+/).filter(Boolean);
  const name = words.map((word) => word[0].toUpperCase() + word.slice(1)).join('');
  return /^[A-Z]/.test(name) ? name : `Icon${name}`;
}

function outputPathFor(iconName, format, requestedPath) {
  const safeName = path.basename(iconName.split(':').pop())
    .replace(/[^a-zA-Z0-9_-]/g, '_') || 'icon';
  const extension = format === 'react' ? '.jsx' : '.svg';
  if (!requestedPath) return path.resolve(`${safeName}${extension}`);

  const resolved = path.resolve(requestedPath);
  if (path.extname(resolved)) return resolved;
  return path.join(resolved, `${safeName}${extension}`);
}

async function main() {
  if (args.length === 0 || ['help', '--help', '-h'].includes(args[0])) {
    printHelp();
    return;
  }

  const [command, rawIconName] = args;
  if (command !== 'get') {
    console.error(`Unknown command: "${command}". Run "npx sednicon help" for usage.`);
    process.exitCode = 1;
    return;
  }
  if (!rawIconName || rawIconName.startsWith('--')) {
    console.error('Please specify an icon name. Example: npx sednicon get rocket');
    process.exitCode = 1;
    return;
  }

  let color = '000000';
  let size = 24;
  let format = 'svg';
  let requestedPath = null;

  for (let index = 2; index < args.length; index += 1) {
    const flag = args[index];
    const value = args[index + 1];
    if (['--color', '--size', '--format', '--out', '--output'].includes(flag) && (!value || value.startsWith('--'))) {
      console.error(`Option ${flag} requires a value.`);
      process.exitCode = 1;
      return;
    }

    if (flag === '--color') {
      color = value.replace(/^#/, '');
      index += 1;
    } else if (flag === '--size') {
      const parsedSize = Number(value);
      if (!Number.isInteger(parsedSize) || parsedSize < 1 || parsedSize > 2048) {
        console.error('Size must be a whole number between 1 and 2048.');
        process.exitCode = 1;
        return;
      }
      size = parsedSize;
      index += 1;
    } else if (flag === '--format') {
      format = value.toLowerCase();
      if (format === 'jsx') format = 'react';
      if (!['svg', 'react', 'url'].includes(format)) {
        console.error('Format must be one of: svg, react, url.');
        process.exitCode = 1;
        return;
      }
      index += 1;
    } else if (flag === '--out' || flag === '--output') {
      requestedPath = value;
      index += 1;
    } else {
      console.error(`Unknown option: "${flag}". Run "npx sednicon help" for usage.`);
      process.exitCode = 1;
      return;
    }
  }

  const endpoint = new URL('https://sednicon.sednium.com/api/render');
  endpoint.searchParams.set('q', rawIconName);
  endpoint.searchParams.set('color', color);
  endpoint.searchParams.set('size', String(size));

  if (format === 'url') {
    console.log(endpoint.toString());
    return;
  }

  try {
    const response = await fetch(endpoint, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`Icon request failed (${response.status} ${response.statusText})`);
    const svg = await response.text();
    const output = format === 'react' ? svgToReact(svg, toComponentName(rawIconName)) : svg;
    const destination = outputPathFor(rawIconName, format, requestedPath);

    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, output, 'utf8');
    console.log(`Saved ${rawIconName} to ${destination}`);
  } catch (error) {
    console.error(`Could not fetch ${rawIconName}: ${error.message}`);
    process.exitCode = 1;
  }
}

main();
