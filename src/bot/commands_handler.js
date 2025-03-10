import { REST } from '@discordjs/rest';
import { CommandInteraction, ContextMenuCommandBuilder, Routes, SlashCommandBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Logger from '../utils/logger.js';
import ConfigurationManager from '../utils/config_manager.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { commandChannelId, token, clientId, guildId } = ConfigurationManager.getDiscordConfig;

const commands = [];

// Using dynamic imports to load command modules
async function loadCommands() {
  await loadDirectory('./commands');

  async function loadDirectory(dir) {
    const commandFiles = fs.readdirSync(path.join(__dirname, dir));
    
    for (const file of commandFiles) {
      const filePath = path.join(dir, file);
  
      if (file.endsWith('.js')) {
        const relativeFilePath = `./${filePath.replaceAll('\\', '/')}`;
        const module = (await import(relativeFilePath)).default;
        if (file.includes('__')) module.subcommand = true;
        commands.push(module);
      } else if (fs.lstatSync(path.join(__dirname, filePath)).isDirectory()) {
        await loadDirectory(filePath);
      } else {
        console.warn(`Unknown file: ${path.join(dir, file)}`);
      }
    }
  }

}

export async function registerCommands() {
  await loadCommands();  // Ensure all commands are loaded before registering

  const rest = new REST({ version: '10' }).setToken(token);
  try {
    Logger.info('Started refreshing application (/) commands.');
    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId), { 
        body: commands
          .filter(cmd => !cmd.subcommand)
          .map(cmd => cmd.data.toJSON()) 
      }
    );
    Logger.info('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error('Error reloading commands:', error);
  }
}

/**
 * 
 * @param {CommandInteraction} interaction 
 * @returns 
 */
export async function handleCommands(interaction) {
  if (!interaction.isCommand()) return;

  Logger.info(`Received command: ${interaction.commandName}`);

  const channel = interaction.channel;
  const isThread = channel.isThread();

  // Check if the command is allowed to be executed in the command channel or in thread channels
  if (interaction.channelId !== commandChannelId && !isThread) {
    return interaction.reply({ 
      content: t(interaction.locale, 'command-not-allowed-outside-commands-channel', { commandChannelId }),
      flags: 'Ephemeral'
    });
  }

  try {
    const command = commands.find(cmd => cmd.data.name === interaction.commandName && !cmd.subcommand);
    if ('execute' in command) return command.execute(interaction);
    
    const subcommandName = interaction.options.getSubcommand();
    if (subcommandName) {
      const subcommand = commands.find(cmd => cmd.data.name === subcommandName);
      if ('execute' in subcommand) return subcommand.execute(interaction);
    }
    
    return interaction.reply({
      content: t(interaction.locale, 'unknown-command'),
      flags: 'Ephemeral'
    });
  } catch (error) {
    Logger.error('Error handling command:', error);

    // prevent crash if interaction is not found
    try {
      await interaction.reply({ 
        content: t(interaction.locale, 'command-execution-error', { error }),
        flags: 'Ephemeral'
      });
    }
    catch (error) {
      Logger.error('Error replying to interaction:', error);
    }
  }
}
