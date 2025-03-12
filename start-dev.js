// Custom script to start Next.js development server
const { spawn } = require('child_process');

// Set environment variables
process.env.NODE_OPTIONS = '--no-deprecation';
process.env.NEXT_IGNORE_NODE_VERSION = 'true';

// Start Next.js development server
const nextDev = spawn('npx', ['next', 'dev'], {
  stdio: 'inherit',
  env: process.env
});

nextDev.on('error', (err) => {
  console.error('Failed to start Next.js development server:', err);
  process.exit(1);
});

nextDev.on('close', (code) => {
  if (code !== 0) {
    console.error(`Next.js development server exited with code ${code}`);
    process.exit(code);
  }
}); 