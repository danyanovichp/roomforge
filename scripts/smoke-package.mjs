#!/usr/bin/env node

import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawn } from 'node:child_process';

const projectRoot = process.cwd();
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const packageName = 'roomforge';

function log(message) {
  process.stdout.write(`[roomforge:verify] ${message}\n`);
}

function spawnCommand(command, args, options = {}) {
  return spawn(command, args, {
    cwd: options.cwd ?? projectRoot,
    env: {
      ...process.env,
      ...options.env,
    },
    stdio: options.stdio ?? ['ignore', 'pipe', 'pipe'],
    shell: false,
  });
}

function waitForExit(child, label) {
  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr?.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      reject(new Error(`${label} failed with code ${code ?? 'null'}${signal ? ` (${signal})` : ''}\n${stderr || stdout}`.trim()));
    });
  });
}

async function runNpm(args, options = {}) {
  const child = spawnCommand(npmCommand, args, options);
  return waitForExit(child, `npm ${args.join(' ')}`);
}

async function fetchText(url, timeoutMs = 5000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
    });
    const body = await response.text();
    return {
      status: response.status,
      body,
      headers: response.headers,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function waitForServer(url, timeoutMs = 10000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetchText(url, 1200);
      if (response.status === 200) {
        return;
      }
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 200));
      continue;
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  throw new Error(`Timed out waiting for ${url}`);
}

async function main() {
  log('Packing npm tarball...');
  const packResult = await runNpm(['pack', '--json']);
  const jsonStart = packResult.stdout.lastIndexOf('\n[');
  const jsonPayload = jsonStart >= 0
    ? packResult.stdout.slice(jsonStart + 1)
    : packResult.stdout.trim();
  const packPayload = JSON.parse(jsonPayload);
  const tarballName = packPayload[0]?.filename;

  if (!tarballName) {
    throw new Error('npm pack did not return a tarball filename.');
  }

  const tarballPath = path.join(projectRoot, tarballName);
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'roomforge-pack-'));
  let serverProcess = null;

  try {
    log('Installing tarball into a clean temp directory...');
    await runNpm(['init', '-y'], { cwd: tempDir });
    await runNpm(['install', tarballPath], { cwd: tempDir });

    const installedPackageJsonPath = path.join(tempDir, 'node_modules', packageName, 'package.json');
    const installedPackage = JSON.parse(await readFile(installedPackageJsonPath, 'utf8'));
    const binEntry = typeof installedPackage.bin === 'string'
      ? installedPackage.bin
      : installedPackage.bin?.[packageName];

    if (!binEntry) {
      throw new Error('Installed package is missing the roomforge bin entry.');
    }

    const port = 4310;
    const launchCommand = process.execPath;
    const launchArgs = [path.join(tempDir, 'node_modules', packageName, binEntry), '--no-open', '--port', String(port)];

    log('Starting packaged CLI...');
    serverProcess = spawnCommand(launchCommand, launchArgs, {
      cwd: tempDir,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let serverOutput = '';
    serverProcess.stdout?.on('data', (chunk) => {
      serverOutput += chunk.toString();
    });
    serverProcess.stderr?.on('data', (chunk) => {
      serverOutput += chunk.toString();
    });

    await waitForServer(`http://127.0.0.1:${port}/`);

    const rootResponse = await fetchText(`http://127.0.0.1:${port}/`);
    if (rootResponse.status !== 200 || !rootResponse.body.includes('<div id="root"></div>')) {
      throw new Error('Packaged CLI did not serve the app shell at /.');
    }

    const assetMatch = rootResponse.body.match(/src="(\/assets\/[^"]+\.js)"/);
    if (!assetMatch) {
      throw new Error('Unable to find the packaged JS asset in the app shell.');
    }

    const fallbackResponse = await fetchText(`http://127.0.0.1:${port}/does-not-exist`);
    if (fallbackResponse.status !== 200 || !fallbackResponse.body.includes('<div id="root"></div>')) {
      throw new Error('Packaged CLI did not return the SPA shell for an unknown route.');
    }

    const assetResponse = await fetchText(`http://127.0.0.1:${port}${assetMatch[1]}`);
    if (assetResponse.status !== 200 || !assetResponse.headers.get('content-type')?.includes('text/javascript')) {
      throw new Error('Packaged CLI did not serve bundled assets correctly.');
    }

    log('Packaged CLI smoke test passed.');

    serverProcess.kill('SIGINT');
    await waitForExit(serverProcess, 'roomforge packaged CLI');
  } finally {
    if (serverProcess && !serverProcess.killed) {
      serverProcess.kill('SIGTERM');
    }
    await rm(tempDir, { recursive: true, force: true });
    await rm(tarballPath, { force: true });
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`[roomforge:verify] ${message}\n`);
  process.exit(1);
});
