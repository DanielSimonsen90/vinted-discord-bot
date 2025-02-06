import { IntentsBitField, Client, GatewayIntentBits, ActivityType } from 'discord.js';
import { registerCommands, handleCommands } from './bot/commands_handler.js';
import ConfigurationManager from './utils/config_manager.js';
import Logger from './utils/logger.js';
import crud from './crud.js';

import subToPushes from './mikkel-resell/sub-to-pushes.js';

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
const devMode = ConfigurationManager.getDevMode;

client.once('ready', async () => {
  Logger.info('Client is ready!');
  await registerCommands(client, discordConfig);

  client.user.setPresence({
    status: 'online',
    activities: [{
      name: devMode ? 'in dev mode' : 'Vinted',
      type: ActivityType.Watching,
    }],
  });

  subToPushes(client);
  
  // Change presence to show number of channels being monitored
  setInterval(async () => {
    const channelCount = (crud.getAllVintedChannels()).length ?? 0;
    client.user.setPresence({
      activities: [{
        name: `${channelCount} channels`,
        type: ActivityType.Watching
      }],
      status: 'online'
    });
  }, 60000);
});


client.on('interactionCreate', handleCommands);

client.login(discordConfig.token).then((token) => {
  Logger.info(`Logged in as ${client.user.tag}`);
});

export default client;
