import * as esbuild from 'esbuild';
import { execSync } from 'child_process';
import { existsSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();
const DIST = join(ROOT, 'dist');

const handlers = ['sessions', 'questions', 'reports'] as const;

async function main() {
  if (existsSync(DIST)) rmSync(DIST, { recursive: true });
  mkdirSync(join(DIST, 'handlers'), { recursive: true });

  for (const name of handlers) {
    await esbuild.build({
      entryPoints: [join(ROOT, `src/handlers/${name}.ts`)],
      bundle: true,
      platform: 'node',
      target: 'node20',
      outfile: join(DIST, `handlers/${name}.js`),
      external: ['@aws-sdk/*'],
      sourcemap: true,
      minify: false,
    });
    console.log(`bundled: handlers/${name}.js`);
  }

  const zipPath = join(ROOT, 'lambda.zip');
  if (existsSync(zipPath)) rmSync(zipPath);
  execSync('zip -r lambda.zip dist/', { cwd: ROOT, stdio: 'inherit' });
  console.log('Done: lambda.zip');
}

main().catch((e) => { console.error(e); process.exit(1); });
