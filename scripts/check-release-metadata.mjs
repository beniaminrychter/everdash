import { existsSync, readFileSync } from 'node:fs';

const tag = process.env.RELEASE_TAG || process.argv[2] || '';
const repository = process.env.GITHUB_REPOSITORY || '';
const errors = [];
const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const appManifest = readFileSync(new URL('../everdash/config.yaml', import.meta.url), 'utf8');
const repositoryManifest = readFileSync(new URL('../repository.yaml', import.meta.url), 'utf8');
const manifestValue = (source, key) => {
  const match = source.match(new RegExp(`^${key}:\\s*["']?([^"'\\s]+)`, 'm'));
  return match?.[1] || '';
};

if (!/^v\d+\.\d+\.\d+$/.test(tag)) {
  errors.push('Release tag must have the form vX.Y.Z.');
}

if (!/^[^/]+\/everdash$/.test(repository)) {
  errors.push('GitHub repository must be the actual owner and repository ending in /everdash.');
}

const version = tag.replace(/^v/, '');
const expectedImage = repository ? `ghcr.io/${repository.toLowerCase()}` : '';
const expectedUrl = repository ? `https://github.com/${repository}` : '';

if (version !== packageJson.version) {
  errors.push(`Tag version does not match package version ${packageJson.version}.`);
}

if (manifestValue(appManifest, 'version') !== version) {
  errors.push('Tag version does not match everdash/config.yaml version.');
}

if (manifestValue(appManifest, 'image') !== expectedImage) {
  errors.push('App image must match this repository owner without a version tag.');
}

if (manifestValue(appManifest, 'url') !== expectedUrl) {
  errors.push('App URL must match the actual public GitHub repository.');
}

if (manifestValue(repositoryManifest, 'url') !== expectedUrl) {
  errors.push('Repository URL must match the actual public GitHub repository.');
}

if (/replace-with-owner/i.test(appManifest + repositoryManifest)) {
  errors.push('Replace all repository-owner placeholders before releasing.');
}

if (!existsSync(new URL('../LICENSE', import.meta.url))) {
  errors.push('Choose and add the approved LICENSE before releasing.');
}

if (errors.length > 0) {
  process.stderr.write(`Release metadata check failed:\n- ${errors.join('\n- ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Release metadata is consistent for ${tag} and ${repository}.\n`);
}
