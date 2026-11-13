import { existsSync, readFileSync } from 'node:fs';

const tag = process.env.RELEASE_TAG || process.argv[2] || '';
const repository = process.env.GITHUB_REPOSITORY || '';
const errors = [];
const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
if (!/^v\d+\.\d+\.\d+$/.test(tag)) {
  errors.push('Release tag must have the form vX.Y.Z.');
}

if (!/^[^/]+\/everdash$/.test(repository)) {
  errors.push('GitHub repository must be the actual owner and repository ending in /everdash.');
}

const version = tag.replace(/^v/, '');

if (version !== packageJson.version) {
  errors.push(`Tag version does not match package version ${packageJson.version}.`);
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
