import { Client, APIApplicationCommand } from 'discord.js';
import { Logger } from 'winston';

declare class CommandHandler {
  constructor(options: CommandHandlerOptions);
  public get commands(): LocalCommand[];
}

declare interface CommandHandlerOptions {
  client: Client;
  commandsPath?: string;
  eventsPath?: string;
  validationsPath?: string;
  testServer?: string;
  logger?: Logger;
}

declare interface LocalCommand extends APIApplicationCommand {
  deleted?: boolean;
  [key: string]: any;
}

export { CommandHandler, LocalCommand };
