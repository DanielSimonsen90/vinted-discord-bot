import { IntentsBitField, Client, GatewayIntentBits, ActivityType } from 'discord.js';
import ConfigurationManager from '../managers/config_manager.js';
import Logger from '../utils/logger.js';
import { getAllVintedChannels } from '../database/crud.js';

import { registerCommands, handleCommands } from './commands_handler.js';

import subToPushes from '../mikkel-resell/sub-to-pushes.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    IntentsBitField.Flags.GuildVoiceStates,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.Guilds,
  ]
});

const discordConfig = ConfigurationManager.getDiscordConfig;

client.once('ready', async () => {
  Logger.info('Client is ready!');
  await registerCommands(client, discordConfig);

  if (!ConfigurationManager.getDevMode) subToPushes(client);

  const setPresence = () => {
    const channelCount = getAllVintedChannels().length ?? 0;
    client.user.setPresence({
      activities: [{
        name: `${channelCount} channels`,
        type: ActivityType.Watching
      }],
      status: 'online'
    });
  }

  // Change presence to show number of channels being monitored
  setPresence();
  setInterval(setPresence, 60000);
});


client.on('interactionCreate', handleCommands);

client.login(discordConfig.token).then(() => Logger.info(`Logged in as ${client.user.username}`));

export default client;
