import { compile } from '@inlang/paraglide-js';

await compile({
  project: './project.inlang',
  outdir: './packages/ui/src/i18n/paraglide',
  strategy: ['globalVariable', 'baseLocale'],
  outputStructure: 'message-modules',
  emitTsDeclarations: true,
  disableAsyncLocalStorage: true,
  emitGitIgnore: false,
  emitPrettierIgnore: false,
  emitReadme: false,
});
