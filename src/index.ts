import { replaceMethod } from './steps/index.js';
import type { CodemodOptions } from './types/index.js';

export function runCodemod(codemodOptions: CodemodOptions): void {
  const { projectRoot } = codemodOptions;
  const options = { projectRoot };

  replaceMethod({
    ...options,
    directory: 'controllers',
    method: 'transitionToRoute',
    replaceWith: 'transitionTo',
  });
  replaceMethod({
    ...options,
    directory: 'controllers',
    method: 'replaceRoute',
    replaceWith: 'replaceWith',
  });
  replaceMethod({
    ...options,
    directory: 'routes',
    method: 'transitionTo',
    replaceWith: 'transitionTo',
  });
  replaceMethod({
    ...options,
    directory: 'routes',
    method: 'replaceWith',
    replaceWith: 'replaceWith',
  });
}
