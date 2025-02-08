import { SlashCommandBuilder, StringSelectMenuBuilder, ActionRowBuilder } from 'discord.js';
import { sendErrorEmbed, sendWaitingEmbed } from '../components/base_embeds.js';
import * as crud from '../../crud.js';
import { Preference } from '../../database/index.js';
import t from '../../t.js';

export default {
  data: new SlashCommandBuilder()
    .setName('set_mentions')
    .setDescription('Enable or disable mentions for a channel.')
    .addStringOption(option =>
      option.setName('state')
        .setDescription('The state to set mentions to: "enable" or "disable".')
        .setRequired(true)
        .addChoices(
          { name: 'Enable', value: 'enable' },
          { name: 'Disable', value: 'disable' }
        )),

  execute: async (interaction) => {
    try {
      const l = interaction.locale;
      await sendWaitingEmbed(interaction, t(l, 'updating-mentions'));

      const state = interaction.options.getString('state');
      const discordId = interaction.user.id;
      const mention = state === 'enable';

      // Fetch all channels associated with the user
      const user = await crud.getUserByDiscordId(discordId);
      const channels = user.channels;

      if (channels.length === 0) return sendErrorEmbed(interaction, t(l, 'no-channels-found'));

      // Create a select menu for channel selection
      const channelMenu = new StringSelectMenuBuilder()
        .setCustomId('channel_select' + discordId)
        .setPlaceholder(t(l, 'mentions-select-channel'))
        .addOptions(channels.map(channel => ({
          label: channel.name,
          value: channel.channelId
        })));

      const row = new ActionRowBuilder().addComponents(channelMenu);
      await interaction.followUp({
        content: t(l, 'select-channel-for-mentions'),
        components: [row],
        ephemeral: true,
      });

      // Create a collector for the channel selection
      const filter = i => i.customId === 'channel_select' + discordId && i.user.id === discordId;
      const channelCollector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

      channelCollector.on('collect', async channelInteraction => {
        const channelId = channelInteraction.values[0];

        // Set the mention preference for the channel
        await crud.setVintedChannelPreference(channelId, Preference.Mention, mention);

        const status = mention ? 'enabled' : 'disabled';

        // remove the select menu
        await channelInteraction.update({
          content: t(l, `mentions-update-${status}`),
          components: [],
        });

        await crud.setVintedChannelUpdatedAtNow(channelId);
      });

    } catch (error) {
      console.error(`Error updating mentions:`, error);
      await sendErrorEmbed(interaction, t(l, 'mentions-update-error', { error }));
    }
  }
}