import { execSync } from 'child_process';
import { mkdirSync } from 'fs';

// Ensure public directory exists
mkdirSync('/vercel/share/v0-project/public', { recursive: true });

// List of all project files to include in the ZIP
const includePatterns = [
  'app/**',
  'components/**',
  'hooks/**',
  'lib/**',
  'styles/**',
  'package.json',
  'tsconfig.json',
  'tailwind.config.ts',
  'next.config.mjs',
  'postcss.config.mjs',
  'components.json',
];

// Build the zip command
const includeArgs = includePatterns.map(p => `"${p}"`).join(' ');

try {
  execSync(
    `cd /vercel/share/v0-project && zip -r public/arche-salud-cotizador.zip ${includeArgs} -x "node_modules/*" -x ".next/*" -x "scripts/*" -x "public/*"`,
    { stdio: 'inherit' }
  );
  console.log('ZIP created successfully at public/arche-salud-cotizador.zip');
} catch (error) {
  console.error('Error creating ZIP:', error.message);
  process.exit(1);
}
