import { AST } from '@codemod-utils/ast-javascript';

export type AnalyzeResult = {
  explicitServices: Set<string>;
  serviceDecoratorImported: boolean;
};

export function analyzeJsClassFile(contents: string): AnalyzeResult {
  const traverse = AST.traverse(false);
  const explicitServices = new Set<string>();
  let serviceDecoratorImported = false;

  traverse(contents, {
    visitClassProperty: (path) => {
      // @ts-expect-error
      const decorators = path.node.decorators;
      if (!decorators?.length) {
        return false;
      }

      if (
        decorators.find(
          // @ts-expect-error
          ({ expression }) =>
            'name' in expression && expression.name === 'service',
        )
      ) {
        // @ts-expect-error
        explicitServices.add(path.node.key.name as string);
        return false;
      }

      return false;
    },
    visitImportDeclaration(path) {
      const importSpecifiers = path.node.specifiers || [];

      if (!importSpecifiers) {
        return false;
      }

      const includesServiceInjection = importSpecifiers.some((specifier) => {
        if (!('imported' in specifier)) {
          return false;
        }

        const { imported, local } = specifier;

        return imported?.name === 'inject' && local?.name === 'service';
      });

      if (includesServiceInjection) {
        serviceDecoratorImported = true;
      }

      return false;
    },
  });

  return {
    explicitServices,
    serviceDecoratorImported,
  };
}
