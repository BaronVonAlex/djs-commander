import { getFilePaths } from './getPaths.js';
import type { LocalCommand } from '../types.js';

export function buildCommandTree(commandsDir?: string): LocalCommand[] {
  const commandTree: LocalCommand[] = [];

  if (!commandsDir) return [];

  const commandFilePaths = getFilePaths(commandsDir, true);

  for (const commandFilePath of commandFilePaths) {
    try {
      let commandModule = require(commandFilePath);
      
      if (commandModule.default) {
        commandModule = commandModule.default;
      }

      let { data, run, deleted, ...rest } = commandModule;

      if (!data) {
        throw new Error(`File ${commandFilePath} must export "data".`);
      }
      if (!run) {
        throw new Error(`File ${commandFilePath} must export a "run" function.`);
      }

      if (typeof data.toJSON === 'function') {
        data = data.toJSON();
      }

      if (!data.name) {
        throw new Error(`File ${commandFilePath} must have a command name.`);
      }
      if (!data.description) {
        throw new Error(`File ${commandFilePath} must have a command description.`);
      }

      const command: LocalCommand = {
        name: data.name,
        description: data.description,
        options: data.options || [],
        name_localizations: data.name_localizations,
        description_localizations: data.description_localizations,
        default_member_permissions: data.default_member_permissions,
        dm_permission: data.dm_permission,
        deleted,
        run,
        ...rest,
      };

      commandTree.push(command);
    } catch (error) {
      console.error(`Error loading command from ${commandFilePath}:`, error);
    }
  }

  return commandTree;
}