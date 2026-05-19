import fs from 'node:fs';
import path from 'node:path';

const slug = process.argv[2];
if (!slug) {
  console.error('Usage: node scripts/rewrite-proto-imports.mjs <slug>');
  process.exit(1);
}

const hubProtoDir = path.join('src', 'features', slug, 'proto');
const exts = new Set(['.ts', '.tsx']);

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      walk(full);
      continue;
    }
    if (!exts.has(path.extname(name))) continue;
    let text = fs.readFileSync(full, 'utf-8');
    const next = text
      .replaceAll('@/features/tracker/', `@/features/${slug}/`)
      .replaceAll("from '@/features/tracker'", `from '@/features/${slug}'`)
      .replaceAll('from "@/features/tracker"', `from "@/features/${slug}"`);
    if (next !== text) {
      fs.writeFileSync(full, next, 'utf-8');
      console.log('fixed', full);
    }
  }
}

if (!fs.existsSync(hubProtoDir)) {
  console.error('Not found:', hubProtoDir);
  process.exit(1);
}
walk(hubProtoDir);
console.log('done', slug);
