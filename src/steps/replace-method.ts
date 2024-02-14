import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { createFiles, findFiles } from '@codemod-utils/files';

import type { Options } from '../types/index.js';

export function replaceMethod(options: Options): void {
  const { projectRoot, directory, method, replaceWith } = options;

  const filePaths = findFiles(`app/${directory}/**/*.js`, {
    projectRoot,
  });

  const fileMap = new Map(
    filePaths.map((filePath) => {
      const file = readFileSync(join(projectRoot, filePath), 'utf8');
      const newFile = file.endsWith('\n') ? file : `${file}\n`;
      console.log(file);

      return [filePath, newFile];
    }),
  );

  createFiles(fileMap, { projectRoot });
}
