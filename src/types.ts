import type { 
  Client, 
  ChatInputCommandInteraction,
  ApplicationCommandOptionData 
} from 'discord.js';
import type { CommandHandler } from './index.js';

export interface LocalCommand {
  name: string;
  description: string;
  options?: ApplicationCommandOptionData[];
  name_localizations?: Record<string, string>;
  description_localizations?: Record<string, string>;
  default_member_permissions?: string | null;
  dm_permission?: boolean;
  deleted?: boolean;
  run: (params: {
    interaction: ChatInputCommandInteraction;
    client: Client;
    handler: CommandHandler;
  }) => Promise<void> | void;
  [key: string]: any;
}

export interface CommandHandlerOptions {
  client: Client;
  commandsPath?: string;
  eventsPath?: string;
  validationsPath?: string;
  testServer?: string;
  logger?: any;
}

export type ValidationFunction = (
  interaction: ChatInputCommandInteraction,
  commandObj: LocalCommand,
  handler: CommandHandler,
  client: Client
) => Promise<boolean | void> | boolean | void;

export type EventFunction = (
  ...args: [...args: any[], client: Client, handler: CommandHandler]
) => Promise<boolean | void> | boolean | void;