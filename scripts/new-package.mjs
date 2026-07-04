#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const name = process.argv[2];

if (!name) {
  console.error('Usage: pnpm new <package-name>');
  console.error('Example: pnpm new retirement');
  process.exit(1);
}

if (!/^[a-z][a-z0-9-]*$/.test(name)) {
  console.error(
    `Invalid name "${name}". Use kebab-case lowercase (e.g., "retirement", "tax-brackets")`,
  );
  process.exit(1);
}

const scoped = `@ously/${name}`;
const dir = path.join(ROOT, 'packages', name);

if (existsSync(dir)) {
  console.error(`Package already exists: ${dir}`);
  process.exit(1);
}

const titleCase = name
  .split('-')
  .map((w) => w[0].toUpperCase() + w.slice(1))
  .join(' ');

await mkdir(path.join(dir, 'src'), { recursive: true });

const packageJson = {
  name: scoped,
  version: '0.1.0',
  description: `${titleCase} module for financial planning, built on @ously/core.`,
  type: 'module',
  license: 'MIT',
  sideEffects: false,
  engines: { node: '>=18' },
  files: ['dist', 'README.md'],
  main: './dist/index.js',
  module: './dist/index.js',
  types: './dist/index.d.ts',
  exports: {
    '.': {
      types: './dist/index.d.ts',
      import: './dist/index.js',
    },
  },
  scripts: {
    build: 'tsup',
    dev: 'tsup --watch',
    test: 'vitest run --passWithNoTests',
    'test:watch': 'vitest --passWithNoTests',
    typecheck: 'tsc --noEmit',
    prepublishOnly: 'npm run build && npm test && npm run typecheck',
  },
  dependencies: {
    '@ously/core': 'workspace:*',
  },
  publishConfig: { access: 'public' },
};

const tsconfigJson = `{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
`;

const tsupConfig = `import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'node18',
  treeshake: true,
})
`;

const vitestConfig = `import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
`;

const indexTs = `export {}
`;

await writeFile(path.join(dir, 'package.json'), JSON.stringify(packageJson, null, 2) + '\n');
await writeFile(path.join(dir, 'tsconfig.json'), tsconfigJson);
await writeFile(path.join(dir, 'tsup.config.ts'), tsupConfig);
await writeFile(path.join(dir, 'vitest.config.ts'), vitestConfig);
await writeFile(path.join(dir, 'src', 'index.ts'), indexTs);

console.log(`✓ Created packages/${name}/`);

const rootPkgPath = path.join(ROOT, 'package.json');
const rootPkg = JSON.parse(await readFile(rootPkgPath, 'utf8'));

const newScripts = {
  [`build:${name}`]: `pnpm --filter ${scoped} build`,
  [`test:${name}`]: `pnpm --filter ${scoped} test`,
  [`typecheck:${name}`]: `pnpm --filter ${scoped} typecheck`,
  [`dev:${name}`]: `pnpm --filter ${scoped} dev`,
  [`clean:${name}`]: `rm -rf packages/${name}/dist`,
};

Object.assign(rootPkg.scripts, newScripts);

await writeFile(rootPkgPath, JSON.stringify(rootPkg, null, 2) + '\n');

console.log(
  `✓ Added scripts: build:${name}, test:${name}, typecheck:${name}, dev:${name}, clean:${name}`,
);
console.log('');
console.log('Next steps:');
console.log(`  pnpm install`);
console.log(`  Edit packages/${name}/src/index.ts and add your exports`);
console.log(`  pnpm test:${name}`);
console.log(`  pnpm check  # lint + format (biome)`);
