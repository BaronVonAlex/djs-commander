import type { Client, ApplicationCommandManager, GuildApplicationCommandManager } from 'discord.js';

export async function getAppCommands(
  client: Client,
  guildId?: string
): Promise<ApplicationCommandManager | GuildApplicationCommandManager> {
  let applicationCommands: ApplicationCommandManager | GuildApplicationCommandManager;

  if (guildId) {
    const guild = await client.guilds.fetch(guildId);
    applicationCommands = guild.commands;
  } else {
    if (!client.application) {
      throw new Error('Client application is not available. Make sure the bot is logged in.');
    }
    applicationCommands = client.application.commands;
  }

  await applicationCommands.fetch({});
  return applicationCommands;
}