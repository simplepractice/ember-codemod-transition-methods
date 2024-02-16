import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { AST } from '@codemod-utils/ast-javascript';
import { createFiles, findFiles } from '@codemod-utils/files';

import type { Options } from '../types/index.js';
import { analyzeJsClassFile } from '../utils/analyze-js-class-file.js';

export function replaceMethod(options: Options): void {
  const { projectRoot, directory, method, replaceWith } = options;

  const filePaths = findFiles(`app/${directory}/**/*.js`, {
    projectRoot,
  });

  const fileMap = new Map(
    filePaths.map((filePath) => {
      const contents = readFileSync(join(projectRoot, filePath), 'utf8');
      let newContents = replaceInstances(contents, method, replaceWith);

      if (contents !== newContents) {
        const { explicitServices, serviceDecoratorImported } =
          analyzeJsClassFile(contents);

        if (!explicitServices.has('router')) {
          newContents = addInjections(
            newContents,
            ['router'],
            serviceDecoratorImported,
          );
        }
      }

      return [filePath, newContents];
    }),
  );

  createFiles(fileMap, { projectRoot });
}

function replaceInstances(
  contents: string,
  method: string,
  replaceWith: string,
): string {
  // const traverse = AST.traverse(false);
  // const ast = traverse(contents, {
  //   visitCallExpression(path) {
  //     const { node } = path;
  //     const { callee } = node;
  //     if (
  //       // @ts-expect-error lol
  //       // callee.object?.type === 'ThisExpression' &&
  //       // @ts-expect-error lol
  //       callee.property?.name === method
  //     ) {
  //       console.log(callee);

  //       callee.property.name = replaceWith;
  //     }

  //     return false;
  //   },
  // });

  // return AST.print(ast);

  const replaceRegExp = new RegExp(`this.${method}\\(`, 'g');
  return contents.replace(replaceRegExp, `this.router.${replaceWith}(`);
}

function addInjections(
  contents: string,
  remainingServices: string[],
  serviceDecoratorImported: boolean,
) {
  if (!remainingServices.length) {
    return contents;
  }

  const traverse = AST.traverse(false);
  const b = AST.builders;
  const ast = traverse(contents, {
    visitClassDeclaration(path) {
      const classBody = path.node.body.body;
      const decorators = [b.decorator(b.identifier('service'))];
      const comments = [b.commentLine('NL', false, true)];

      if (!classBody.length) {
        classBody.unshift(
          b.classProperty.from({
            key: b.identifier(''),
            value: null,
            comments,
          }),
        );
      }

      [...remainingServices].forEach((name) => {
        const newClassProperty = b.classProperty.from({
          key: b.identifier(name),
          value: null,
          comments,
        });

        // @ts-expect-error
        newClassProperty.decorators = decorators;
        classBody.unshift(newClassProperty);
      });

      return false;
    },
  });

  if (!serviceDecoratorImported) {
    const importStatement = b.importDeclaration(
      [b.importSpecifier(b.identifier('inject'), b.identifier('service'))],
      b.stringLiteral('@ember/service'),
    );

    // @ts-expect-error
    ast.program.body.unshift(importStatement);
  }

  return AST.print(ast)
    .replaceAll(/@service(\s+)(.+);\/\/NL\n/gm, '@service $2;')
    .replace(/(\s+);\/\/NL/, '\n');
}
