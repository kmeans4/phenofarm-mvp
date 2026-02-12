// Temporary fix: create the missing .prisma/client/default.js file
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const clientDir = join(__dirname, 'node_modules', '@prisma', 'client');
const prismaDir = join(clientDir, '.prisma', 'client');
const defaultFilePath = join(prismaDir, 'default.js');

try {
  mkdirSync(prismaDir, { recursive: true });
  writeFileSync(defaultFilePath, "module.exports = require('../../index');\n");
  console.log('Created .prisma/client/default.js successfully');
} catch (err) {
  console.error('Failed to create file:', err);
}
