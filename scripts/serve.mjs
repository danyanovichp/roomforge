#!/usr/bin/env node

import http from 'node:http';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { access, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const distRoot = path.join(projectRoot, 'dist');
const defaultHost = '127.0.0.1';
const defaultPort = 4173;
const shouldOpenBrowser = process.env.ROOMFORGE_NO_OPEN !== '1';

const mimeTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.svg', 'image/svg+xml'],
  ['.ico', 'image/x-icon'],
  ['.webp', 'image/webp'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.map', 'application/json; charset=utf-8'],
]);

function log(message) {
  process.stdout.write(`[roomforge] ${message}\n`);
}

function fail(message) {
  process.stderr.write(`[roomforge] ${message}\n`);
  process.exit(1);
}

function printHelp() {
  process.stdout.write(`RoomForge demo launcher

Usage:
  roomforge [--port <number>] [--host <host>] [--no-open]

Options:
  --port <number>  Preferred local port (default: ${defaultPort})
  --host <host>    Host interface to bind (default: ${defaultHost})
  --no-open        Do not open the browser automatically
  --help           Show this help message

Environment:
  ROOMFORGE_NO_OPEN=1  Disable browser auto-open
`);
}

function parseArgs(argv) {
  const options = {
    host: defaultHost,
    port: defaultPort,
    shouldOpenBrowser,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }

    if (arg === '--no-open') {
      options.shouldOpenBrowser = false;
      continue;
    }

    if (arg === '--port') {
      const rawPort = argv[index + 1];
      if (!rawPort) {
        fail('Missing value for --port.');
      }
      const port = Number(rawPort);
      if (!Number.isInteger(port) || port < 0 || port > 65535) {
        fail(`Invalid port: ${rawPort}`);
      }
      options.port = port;
      options.portWasExplicit = true;
      index += 1;
      continue;
    }

    if (arg.startsWith('--port=')) {
      const rawPort = arg.slice('--port='.length);
      const port = Number(rawPort);
      if (!Number.isInteger(port) || port < 0 || port > 65535) {
        fail(`Invalid port: ${rawPort}`);
      }
      options.port = port;
      options.portWasExplicit = true;
      continue;
    }

    if (arg === '--host') {
      const host = argv[index + 1];
      if (!host) {
        fail('Missing value for --host.');
      }
      options.host = host;
      index += 1;
      continue;
    }

    if (arg.startsWith('--host=')) {
      options.host = arg.slice('--host='.length);
      continue;
    }

    fail(`Unknown argument: ${arg}`);
  }

  return options;
}

async function ensureDist() {
  try {
    await access(path.join(distRoot, 'index.html'));
  } catch {
    fail('Built app not found in dist/. Run `npm run build` before launching locally.');
  }
}

function getContentType(filePath) {
  return mimeTypes.get(path.extname(filePath).toLowerCase()) ?? 'application/octet-stream';
}

async function resolveFilePath(requestUrlPath) {
  let urlPath = '/';
  try {
    urlPath = decodeURIComponent(requestUrlPath.split('?')[0]);
  } catch {
    return null;
  }
  const normalizedPath = urlPath === '/' ? '/index.html' : urlPath;
  const requestedPath = path.resolve(distRoot, `.${normalizedPath}`);

  if (!requestedPath.startsWith(distRoot)) {
    return null;
  }

  try {
    const info = await stat(requestedPath);
    if (info.isDirectory()) {
      return path.join(requestedPath, 'index.html');
    }
    return requestedPath;
  } catch {
    return null;
  }
}

async function sendFile(response, filePath, method) {
  try {
    const info = await stat(filePath);
    response.writeHead(200, {
      'Content-Length': info.size,
      'Content-Type': getContentType(filePath),
      'Cache-Control': filePath.endsWith('index.html') ? 'no-cache' : 'public, max-age=31536000, immutable',
    });

    if (method === 'HEAD') {
      response.end();
      return;
    }

    const stream = createReadStream(filePath);
    stream.on('error', () => {
      if (!response.headersSent) {
        response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      }
      response.end('Internal Server Error');
    });
    stream.pipe(response);
  } catch {
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Internal Server Error');
  }
}

function createServer() {
  return http.createServer(async (request, response) => {
    const method = request.method ?? 'GET';
    if (method !== 'GET' && method !== 'HEAD') {
      response.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Method Not Allowed');
      return;
    }

    const requestedFile = await resolveFilePath(request.url ?? '/');
    if (requestedFile) {
      await sendFile(response, requestedFile, method);
      return;
    }

    await sendFile(response, path.join(distRoot, 'index.html'), method);
  });
}

function openBrowser(url) {
  let command = null;
  let args = [];

  if (process.platform === 'darwin') {
    command = 'open';
    args = [url];
  } else if (process.platform === 'win32') {
    command = 'cmd.exe';
    args = ['/c', 'start', '', url];
  } else {
    command = 'xdg-open';
    args = [url];
  }

  const child = spawn(command, args, { stdio: 'ignore', detached: true });

  child.on('error', () => {
    log(`Unable to auto-open a browser. Open manually: ${url}`);
  });
  child.unref();
}

function findAvailablePort(port, host, allowFallback) {
  return new Promise((resolve, reject) => {
    const attempt = (candidate, remainingFallbacks) => {
      const probe = net.createServer();

      probe.once('error', (error) => {
        probe.close();
        if (error.code === 'EADDRINUSE' && allowFallback && remainingFallbacks > 0) {
          attempt(candidate + 1, remainingFallbacks - 1);
          return;
        }
        reject(error);
      });

      probe.once('listening', () => {
        const address = probe.address();
        probe.close(() => {
          if (!address || typeof address === 'string') {
            reject(new Error('Unable to determine an available port.'));
            return;
          }
          resolve(address.port);
        });
      });

      probe.listen(candidate, host);
    };

    attempt(port, 20);
  });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  await ensureDist();

  const port = await findAvailablePort(options.port, options.host, !options.portWasExplicit);
  const server = createServer();

  server.on('error', (error) => {
    fail(error instanceof Error ? error.message : String(error));
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, options.host, () => resolve());
  });

  const url = `http://${options.host}:${port}/`;
  log(`RoomForge is ready at ${url}`);
  if (options.shouldOpenBrowser) {
    openBrowser(url);
  } else {
    log('Browser auto-open skipped.');
  }

  const shutdown = (signal) => {
    log(`Stopping RoomForge (${signal})...`);
    server.close(() => process.exit(0));
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});
