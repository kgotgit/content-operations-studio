#!/usr/bin/env node
/**
 * Builds a self-contained ESM bundle of the `remote-components` HTML host
 * (remote-components/dist/host/html.js + React + payload hook) for non-Next.js
 * consumers such as Drupal, so they never install or import the library themselves.
 *
 * Output (apps/content-presentation/public/remote-host/):
 *   remote-components-host.<sha8>.js       immutable, content-hashed bundle
 *   remote-components-host.<sha8>.js.map   source map
 *   remote-components-host.development.<sha8>.js  React dev build, for `next dev` remotes only
 *   remote-components-host.js              stable alias of the production bundle (short cache TTL)
 *   manifest.json                          version, sha256, SRI integrity, file names
 *
 * Usage:  node scripts/build-remote-host.mjs   (runs automatically via prebuild/predev)
 */
import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, '..');
const outDir = path.join(appRoot, 'public', 'remote-host');
// Build into a private staging dir, then swap it in, so a running server never sees a
// half-written folder and concurrent runs (e.g. two `pnpm dev`) can't clobber each other.
const workDir = path.join(appRoot, 'public', `.remote-host-build-${process.pid}`);

const BASENAME = 'remote-components-host';

async function readPkgVersion(name) {
  // Read package.json from disk directly; `exports` maps may not expose it.
  try {
    const pkg = JSON.parse(await readFile(path.join(appRoot, 'node_modules', name, 'package.json'), 'utf8'));
    return pkg.version;
  } catch {
    return 'unknown';
  }
}

function gitSha() {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: appRoot, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return null;
  }
}

async function main() {
  const libraryVersion = await readPkgVersion('remote-components');
  const reactVersion = await readPkgVersion('react');
  const appPkg = JSON.parse(await readFile(path.join(appRoot, 'package.json'), 'utf8'));
  const hostVersion = `${libraryVersion}+${appPkg.version}`;

  await rm(workDir, { recursive: true, force: true });
  await mkdir(workDir, { recursive: true });

  // Two variants: React's production build cannot parse the RSC payload a `next dev`
  // remote emits (debug rows -> React error #504), so local development needs the dev build.
  const production = await buildVariant({ mode: 'production', hostVersion, libraryVersion });
  const development = await buildVariant({ mode: 'development', hostVersion, libraryVersion });

  // Stable alias -> production bundle (identical bytes, so the same SRI hash applies)
  await writeFile(path.join(workDir, `${BASENAME}.js`), production.code);

  const strip = ({ code, ...rest }) => rest;
  const manifest = {
    name: BASENAME,
    version: hostVersion,
    library: { name: 'remote-components', version: libraryVersion, entry: 'remote-components/host/html' },
    react: reactVersion,
    // Top-level fields describe the production bundle (what consumers should ship).
    ...strip(production),
    alias: `${BASENAME}.js`,
    format: 'esm',
    variants: { production: strip(production), development: strip(development) },
    gitSha: gitSha(),
    builtAt: new Date().toISOString(),
    usage: {
      script: `<script type="module" src="/remote-host/${production.file}" integrity="${production.integrity}" crossorigin="anonymous"></script>`,
      element: '<remote-component src="https://<remote-origin>/remote/navigation/web/general/en-US" payload="<template-id>"></remote-component>',
      note: 'Use variants.development only against a `next dev` remote (payload buildId "development").',
    },
  };
  await writeFile(path.join(workDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

  await swapIntoPlace();

  for (const v of [production, development]) {
    console.log(`[remote-host] ${v.mode.padEnd(11)} ${v.file} (${(v.bytes / 1024).toFixed(1)} KiB)`);
  }
  console.log(`[remote-host] remote-components@${libraryVersion} · react@${reactVersion}`);
}

async function swapIntoPlace() {
  const oldDir = path.join(appRoot, 'public', `.remote-host-old-${process.pid}`);
  // Retry: a concurrent build may land its own folder between our two renames.
  // Outputs are content-hashed and deterministic, so whichever build wins is equivalent.
  for (let attempt = 1; ; attempt++) {
    try {
      await rename(outDir, oldDir);
    } catch (err) {
      if (err.code !== 'ENOENT') throw err; // first build: nothing to move aside
    }
    try {
      await rename(workDir, outDir);
      break;
    } catch (err) {
      if (!['ENOTEMPTY', 'EEXIST'].includes(err.code) || attempt >= 5) throw err;
      await rm(oldDir, { recursive: true, force: true });
      await new Promise((r) => setTimeout(r, 50 * attempt));
    }
  }
  await rm(oldDir, { recursive: true, force: true });
}

async function buildVariant({ mode, hostVersion, libraryVersion }) {
  const isProd = mode === 'production';
  const name = isProd ? BASENAME : `${BASENAME}.development`;
  const result = await build({
    entryPoints: [path.join(__dirname, 'remote-host', 'entry.js')],
    absWorkingDir: appRoot,
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: ['es2020'],
    minify: isProd,
    sourcemap: 'external',
    legalComments: isProd ? 'linked' : 'none',
    write: false,
    outfile: path.join(workDir, `${name}.js`),
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
      __HOST_VERSION__: JSON.stringify(hostVersion),
      __LIBRARY_VERSION__: JSON.stringify(libraryVersion),
    },
    logLevel: 'warning',
  });

  const jsFile = result.outputFiles.find((f) => f.path.endsWith('.js'));
  const mapFile = result.outputFiles.find((f) => f.path.endsWith('.js.map'));
  const legalFile = result.outputFiles.find((f) => f.path.endsWith('.LEGAL.txt'));
  if (!jsFile) throw new Error(`esbuild produced no JS output (${mode})`);

  // Strip esbuild's trailing sourceMappingURL comment (anchored to end of file, since
  // the bundled runtime itself contains "//# sourceMappingURL=" string literals).
  const baseCode = Buffer.from(jsFile.contents)
    .toString('utf8')
    .replace(/\n?\/\/# sourceMappingURL=[^\n]*\s*$/, '');

  // Content hash over the code without the map comment, so the name is stable.
  const sha8 = createHash('sha256').update(baseCode).digest('hex').slice(0, 8);
  const file = `${name}.${sha8}.js`;
  const code = `${baseCode}\n//# sourceMappingURL=${file}.map\n`;

  await writeFile(path.join(workDir, file), code);
  if (mapFile) await writeFile(path.join(workDir, `${file}.map`), mapFile.contents);
  if (legalFile) await writeFile(path.join(workDir, path.basename(legalFile.path)), legalFile.contents);

  return {
    mode,
    file,
    sourcemap: mapFile ? `${file}.map` : null,
    sha256: createHash('sha256').update(code).digest('hex'),
    integrity: `sha384-${createHash('sha384').update(code).digest('base64')}`,
    bytes: Buffer.byteLength(code),
    code,
  };
}

main().catch(async (err) => {
  await rm(workDir, { recursive: true, force: true }).catch(() => {});
  console.error('[remote-host] build failed:', err);
  process.exit(1);
});
