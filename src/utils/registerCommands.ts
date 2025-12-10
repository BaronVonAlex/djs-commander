import type { Client } from 'discord.js';
import type { Logger } from 'winston';
import type { LocalCommand } from '../types.js';
import { getAppCommands } from './getAppCommands.js';
import { areCommandsDifferent } from './areCommandsDifferent.js';

interface RegisterCommandsOptions {
  client: Client;
  commands: LocalCommand[];
  testServer?: string;
  logger?: Logger;
}

export async function registerCommands({
  client,
  commands: localCommands,
  testServer,
  logger,
}: RegisterCommandsOptions): Promise<void> {
  try {
    const applicationCommands = await getAppCommands(client, testServer);

    for (const localCommand of localCommands) {
      const {
        name,
        name_localizations,
        description,
        description_localizations,
        default_member_permissions,
        dm_permission,
        options,
      } = localCommand;

      const existingCommand = applicationCommands.cache.find(
        (cmd: any) => cmd.name === name
      );

      if (existingCommand) {
        if (localCommand.deleted) {
          await applicationCommands.delete(existingCommand.id);
          log(logger, 'info', `🗑 Deleted command "${name}".`);
          continue;
        }

        if (areCommandsDifferent(existingCommand, localCommand)) {
          await applicationCommands.edit(existingCommand.id, {
            name,
            description,
            options: options || [],
            name_localizations,
            description_localizations,
            default_member_permissions,
            dm_permission,
          });
          log(logger, 'info', `🔁 Edited command "${name}".`);
        }
      } else {
        if (localCommand.deleted) {
          log(logger, 'info', `⏩ Skipping registering command "${name}" as it's set to delete.`);
          continue;
        }

        await applicationCommands.create({
          name,
          name_localizations,
          description,
          description_localizations,
          default_member_permissions,
          dm_permission,
          options: options || [],
        });
        log(logger, 'info', `✅ Registered command "${name}".`);
      }
    }
  } catch (error) {
    log(logger, 'error', 'Error registering commands:', error);
    throw error;
  }
}

function log(logger: Logger | undefined, level: 'info' | 'error', message: string, ...args: any[]): void {
  if (logger) {
    logger[level](message, ...args);
  } else {
    console[level === 'info' ? 'log' : 'error'](message, ...args);
  }
}