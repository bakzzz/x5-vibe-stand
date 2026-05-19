import 'dotenv/config';
import { syncProtoFromGitlab } from '../server/lib/protoGitSync.js';

const slug = process.argv[2];
const url = process.argv[3];

if (!slug || !url) {
  console.error('Usage: npm run proto:sync -- <slug> <gitlab-url>');
  process.exit(1);
}

const result = syncProtoFromGitlab(slug, url);
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
