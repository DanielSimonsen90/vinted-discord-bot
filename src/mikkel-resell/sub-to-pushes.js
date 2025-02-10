import * as Discord from 'discord.js';
import shell from 'shelljs';

const { GIT_REPO_NAME, GIT_REPO_MAIN_BRANCH_NAME } = process.env;

/**
 * @param {Discord.Client} client 
 */
export default async function handleGit(client) {
  const guildId = process.env.DISCORD_GUILD_ID;
  const guild = client.guilds.cache.get(guildId);
  if (!guild) return console.error('No guild found');

  const gitChannel = guild.channels.cache.find(channel => channel.name.startsWith('git'));
  if (!gitChannel) {
    const danho = client.users.cache.find(u => u.username === 'danhosaur');
    if (!danho) console.error("Git channel & Danho not found.");
    else danho.send('Git channel not found');
    return;
  }

  const messages = await gitChannel.messages.fetch({ limit: 5 });
  if (!messages) return console.warn(`Could not fetch messages from git channel`);

  const reactedMessage = messages.find(m => m.reactions.cache.find(reaction => reaction.users.cache.has(client.user.id)));
  if (!reactedMessage) return console.warn(`Could not find message that ${client.user.name} reacted to`);

  await reactedMessage.reactions.cache.get(`⬇️`)?.remove();
  await reactedMessage.react(`✅`);

  client.on('messageCreate', async message => {
    // Channel checks
    const isGitChannelId = message.channel.id === gitChannel.id;
    const containsEmbed = message.embeds.length > 0;
    const [
      embedTitleContainsRepoName,
      embedTitleContainsMainBranchName
    ] = [GIT_REPO_NAME, GIT_REPO_MAIN_BRANCH_NAME].map(value => message.embeds[0]?.title?.includes(value));

    if (!isGitChannelId || !containsEmbed || !embedTitleContainsRepoName || !embedTitleContainsMainBranchName) return;

    // Visualize update
    client.user.setPresence({ status: 'idle' });
    await message.react('⬇️');

    // Pull main branch
    const pullMainCommands = [
      `git fetch origin ${GIT_REPO_MAIN_BRANCH_NAME}`,
      `git reset --hard origin/${GIT_REPO_MAIN_BRANCH_NAME}`,
      `git pull origin ${GIT_REPO_MAIN_BRANCH_NAME}`,

      'npm i',
      'pm2 restart vinted'
    ];

    await new Promise(resolve => {
      shell.exec(pullMainCommands.join(' && '), { silent: true }, (code, stdout, stderr) => {
        if (code !== 0) return this.log('error', `Error pulling vinted-discord-bot:\n${stderr}`);
        resolve(null);
      });
    });
  });
}