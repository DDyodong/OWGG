const path = require('path');
const { spawn } = require('child_process');

const root = path.join(__dirname, '..');
const viteBin = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');
const children = [
  spawn(process.execPath, ['--watch', 'server/server.js'], { cwd: root, stdio: 'inherit' }),
  spawn(process.execPath, [viteBin, '--configLoader', 'runner'], { cwd: root, stdio: 'inherit' }),
];

function stop(signal = 'SIGTERM') {
  children.forEach((child) => {
    if (!child.killed) child.kill(signal);
  });
}

children.forEach((child) => {
  child.on('exit', (code) => {
    if (code && code !== 0) {
      stop();
      process.exitCode = code;
    }
  });
});

process.on('SIGINT', () => stop('SIGINT'));
process.on('SIGTERM', () => stop('SIGTERM'));
