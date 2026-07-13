const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const rootDirectory = path.join(__dirname, '..');
const outputDirectory = path.join(rootDirectory, 'dist');
const openNextDirectory = path.join(rootDirectory, '.open-next');
const bundleDirectory = path.join(openNextDirectory, '.sites-bundle');

for (const relativePath of [
  ['server-functions', 'default', 'backend', '.env'],
  ['server-functions', 'default', 'backend', 'uploads'],
  ['server-functions', 'default', '.sites-migration']
]) {
  fs.rmSync(path.join(openNextDirectory, ...relativePath), {
    force: true,
    recursive: true
  });
}

fs.rmSync(bundleDirectory, { force: true, recursive: true });
execFileSync(process.execPath, [
  path.join(rootDirectory, 'node_modules', 'wrangler', 'bin', 'wrangler.js'),
  'deploy',
  '--dry-run',
  '--config',
  path.join(rootDirectory, 'wrangler.jsonc'),
  '--outdir',
  bundleDirectory
], {
  cwd: rootDirectory,
  stdio: 'inherit'
});

fs.rmSync(outputDirectory, { force: true, recursive: true });
fs.mkdirSync(path.join(outputDirectory, 'server'), { recursive: true });
fs.copyFileSync(
  path.join(bundleDirectory, 'worker.js'),
  path.join(outputDirectory, 'server', 'index.js')
);
fs.cpSync(
  path.join(openNextDirectory, 'assets'),
  path.join(outputDirectory, 'client'),
  { recursive: true }
);
fs.cpSync(
  path.join(rootDirectory, '.openai'),
  path.join(outputDirectory, '.openai'),
  { recursive: true }
);

console.log('Artefacto de Sites preparado en dist/server y dist/client.');
