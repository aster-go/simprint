import fs from 'node:fs';

const ASSET_SUFFIX = {
  embedBootstrapper: '',
  'fixed-runtime': '-full',
};

const PLATFORM_ARCH = {
  'windows-x86_64': 'x64',
  'windows-aarch64': 'arm64',
  'windows-i686': 'x86',
};

const [manifestPath, mode, repository, tag, releaseNotesPath] = process.argv.slice(2);
const assetSuffix = ASSET_SUFFIX[mode];

if (!manifestPath || assetSuffix === undefined || !repository || !tag || !releaseNotesPath) {
  throw new Error(
    'Usage: node deploy/finalize-updater-manifest.mjs <manifest-path> <embedBootstrapper|fixed-runtime> <owner/repository> <tag> <release-notes-path>'
  );
}

if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) {
  throw new Error(`Invalid GitHub repository name: "${repository}"`);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8').replace(/^\uFEFF/, ''));
const releaseNotes = fs
  .readFileSync(releaseNotesPath, 'utf8')
  .replace(/^\uFEFF/, '')
  .trim();
const platforms = manifest.platforms ?? {};
const expectedTag = `v${manifest.version}`;

if (!releaseNotes) {
  throw new Error(`${releaseNotesPath} does not contain release notes`);
}

if (tag !== expectedTag) {
  throw new Error(
    `${manifestPath} version "${manifest.version}" does not match release tag "${tag}"`
  );
}

for (const platform of Object.keys(PLATFORM_ARCH)) {
  if (!platforms[platform]) {
    throw new Error(`${manifestPath} is missing required updater platform "${platform}"`);
  }
}

let finalizedWindowsEntries = 0;

manifest.notes = releaseNotes;

for (const [platform, entry] of Object.entries(platforms)) {
  if (!platform.startsWith('windows-')) {
    continue;
  }

  const basePlatform = platform.endsWith('-nsis') ? platform.slice(0, -'-nsis'.length) : platform;
  const arch = PLATFORM_ARCH[basePlatform];

  if (!arch) {
    throw new Error(`${manifestPath} contains unsupported Windows platform "${platform}"`);
  }
  if (!entry?.signature?.trim()) {
    throw new Error(`${manifestPath} platform "${platform}" is missing its signature`);
  }

  const assetName = `Simprint_${manifest.version}_${arch}${assetSuffix}-setup.exe`;
  entry.url = `https://github.com/${repository}/releases/download/${encodeURIComponent(tag)}/${encodeURIComponent(assetName)}`;
  finalizedWindowsEntries += 1;
}

fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(
  `[finalize-updater-manifest] ${manifestPath} now references ${finalizedWindowsEntries} stable ${mode} release URLs`
);
