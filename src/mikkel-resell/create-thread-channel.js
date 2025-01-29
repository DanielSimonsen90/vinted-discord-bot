import * as Discord from 'discord.js';
import * as env from 'dotenv';

env.config();

const client = new Discord.Client({
  intents: ['Guilds']
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);

  beginInit();
});

client.login(process.env.DISCORD_TOKEN);

async function beginInit() {
  const textChannelCategoryId = `1332852633471549441`;
  const guildId = process.env.DISCORD_GUILD_ID;

  const guild = client.guilds.cache.get(guildId);
  if (!guild) return console.error('No guild found');

  const textChannelCategory = guild.channels.cache.get(textChannelCategoryId);
  if (!textChannelCategory) return console.error('No text channel category found');

  const textChannel = await guild.channels.create({
    name: 'vinted',
    type: Discord.ChannelType.GuildText,
    parent: textChannelCategory,
    topic: `Vintedkanal administreret af ${client.user.username}.`,
    reason: 'Initial setup'
  });
  const prodOwner = await guild.members.fetch('277361003950505984');
  const devOwner = await guild.members.fetch('245572699894710272');

  textChannel.send([
    `Vintedkanal oprettet!`,
    `Til ${prodOwner}: Denne kanal vil blive brugt til at sende Vinted-annoncer.`,
    `Til ${devOwner}: Kanal id: ${textChannel.id}`
  ].join('\n'))
}