// Start `wrangler pages dev` on a directory and wait until it answers.
//
// This is Cloudflare's own Pages emulator (workerd), so _headers and
// _redirects are applied by the same rules the edge uses. It does NOT
// reproduce edge-only behaviour: zone settings, compression, Network Error
// Logging headers, or anything Cloudflare injects after deploy.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const wranglerBin = path.join(repo, 'node_modules', 'wrangler', 'bin', 'wrangler.js');

export async function startPagesServer(root, port) {
  const child = spawn(process.execPath, [wranglerBin, 'pages', 'dev', root,
    '--port', String(port), '--ip', '127.0.0.1', '--log-level', 'warn'], {
    cwd: repo,
    env: { ...process.env, WRANGLER_SEND_METRICS: 'false', NO_COLOR: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let log = '';
  child.stdout.on('data', (d) => { log += d; });
  child.stderr.on('data', (d) => { log += d; });
  const url = `http://127.0.0.1:${port}/`;
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`wrangler exited early:\n${log}`);
    try {
      const r = await fetch(url);
      if (r.ok) return { url, stop: () => stop(child), log: () => log };
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 400));
  }
  stop(child);
  throw new Error(`wrangler did not answer on ${url} within 60 s:\n${log}`);
}

function stop(child) {
  if (child.exitCode !== null) return;
  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  } else {
    child.kill('SIGTERM');
  }
}
