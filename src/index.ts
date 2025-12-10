import { 
  Client, 
  ChatInputCommandInteraction, 
  ClientEvents
} from 'discord.js';
import type { Logger } from 'winston';
import { getFolderPaths, getFilePaths } from './utils/getPaths.js';
import { buildCommandTree } from './utils/buildCommandTree.js';
import { registerCommands } from './utils/registerCommands.js';
import type { 
  LocalCommand, 
  CommandHandlerOptions, 
  ValidationFunction, 
  EventFunction 
} from './types.js';

export type { LocalCommand, CommandHandlerOptions, ValidationFunction, EventFunction };
export type { Logger };
export type { Client, ChatInputCommandInteraction } from 'discord.js';

export class CommandHandler {
  private readonly _client: Client;
  private readonly _commandsPath: string | undefined;
  private readonly _eventsPath: string | undefined;
  private readonly _validationsPath: string | undefined;
  private readonly _testServer: string | undefined;
  private readonly _validationFuncs: ValidationFunction[];
  private readonly _logger: Logger | undefined;
  private _commands: LocalCommand[];

  constructor(options: CommandHandlerOptions) {
    const {
      client,
      commandsPath,
      eventsPath,
      validationsPath,
      testServer,
      logger,
    } = options;

    if (!client) {
      throw new Error(
        'Property "client" is required when instantiating CommandHandler.'
      );
    }

    this._client = client;
    this._commandsPath = commandsPath;
    this._eventsPath = eventsPath;
    this._validationsPath = validationsPath;
    this._testServer = testServer;
    this._commands = [];
    this._validationFuncs = [];
    this._logger = logger;

    if (this._validationsPath && !commandsPath) {
      throw new Error(
        'Command validations are only available in the presence of a commands path. Either add "commandsPath" or remove "validationsPath"'
      );
    }

    if (this._commandsPath) {
      this._commandsInit();
      this._client.once('clientReady', () => {
        this._registerSlashCommands();
        if (this._validationsPath) this._validationsInit();
        this._handleCommands();
      });
    }

    if (this._eventsPath) {
      this._eventsInit();
    }
  }

  private _commandsInit(): void {
    const commands = buildCommandTree(this._commandsPath);
    this._commands = commands;
  }

  private _registerSlashCommands(): void {
    registerCommands({
      client: this._client,
      commands: this._commands,
      testServer: this._testServer,
      logger: this._logger,
    });
  }

  private _eventsInit(): void {
    const eventPaths = getFolderPaths(this._eventsPath);

    for (const eventPath of eventPaths) {
      const eventName = eventPath.replace(/\\/g, '/').split('/').pop();
      const eventFuncPaths = getFilePaths(eventPath, true);
      eventFuncPaths.sort();

      if (!eventName || !(eventName in this._client)) continue;

      this._client.on(eventName as keyof ClientEvents, async (...args: any[]) => {
        for (const eventFuncPath of eventFuncPaths) {
          try {
            const eventModule = await import(eventFuncPath);
            const eventFunc: EventFunction = eventModule.default || eventModule;
            const cantRunEvent = await eventFunc(...args, this._client, this);
            if (cantRunEvent) break;
          } catch (error) {
            this._log('error', `Error loading event from ${eventFuncPath}:`, error);
          }
        }
      });
    }
  }

  private _validationsInit(): void {
    const validationFilePaths = getFilePaths(this._validationsPath);
    validationFilePaths.sort();

    for (const validationFilePath of validationFilePaths) {
      try {
        const validationModule = require(validationFilePath);
        const validationFunc: ValidationFunction = validationModule.default || validationModule;
        
        if (typeof validationFunc !== 'function') {
          throw new Error(
            `Validation file ${validationFilePath} must export a function by default.`
          );
        }

        this._validationFuncs.push(validationFunc);
      } catch (error) {
        this._log('error', `Error loading validation from ${validationFilePath}:`, error);
      }
    }
  }

  private _handleCommands(): void {
    this._client.on('interactionCreate', async (interaction) => {
      if (!interaction.isChatInputCommand()) return;

      const command = this._commands.find((cmd) => cmd.name === interaction.commandName);
      if (!command) return;

      try {
        // Run validation functions
        if (this._validationFuncs.length) {
          let canRun = true;

          for (const validationFunc of this._validationFuncs) {
            const cantRunCommand = await validationFunc(
              interaction,
              command,
              this,
              this._client
            );
            if (cantRunCommand) {
              canRun = false;
              break;
            }
          }

          if (!canRun) return;
        }

        await command.run({
          interaction,
          client: this._client,
          handler: this,
        });
      } catch (error) {
        this._log('error', `Error executing command ${command.name}:`, error);
        
        try {
          const errorMessage = { 
            content: 'There was an error executing this command!', 
            ephemeral: true 
          };
          
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp(errorMessage);
          } else {
            await interaction.reply(errorMessage);
          }
        } catch (replyError) {
          this._log('error', 'Failed to send error message:', replyError);
        }
      }
    });
  }

  private _log(level: 'info' | 'error', message: string, ...args: any[]): void {
    if (this._logger) {
      this._logger[level](message, ...args);
    } else {
      console[level === 'info' ? 'log' : 'error'](message, ...args);
    }
  }

  get commands(): LocalCommand[] {
    return this._commands;
  }

  get client(): Client {
    return this._client;
  }
}