import { copyFileSync } from 'fs';
import { basename } from 'path';

const files = ['./LICENSE', './README.md', './src/package.json'];

for(const file of files) {
  copyFileSync(file, `./dist/${basename(file)}`);
}
