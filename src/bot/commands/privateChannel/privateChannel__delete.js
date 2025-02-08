import { SlashCommandSubcommandBuilder, StringSelectMenuBuilder, ActionRowBuilder, CommandInteraction } from 'discord.js';
import { sendErrorEmbed, sendWaitingEmbed } from "../../components/base_embeds.js";
import * as crud from '../../../crud.js';
import t from '../../../t.js';

export default {
  data: new SlashCommandSubcommandBuilder()
    .setName("delete")
    .setDescription("Delete a private monitoring channel."),

  /**
   * @param {CommandInteraction} interaction 
   */
  execute: async (interaction) => {
    try {
      const l = interaction.locale;
      const discordId = interaction.user.id;

      await sendWaitingEmbed(interaction, t(l, 'deleting-private-channel'));

      // Get the user and ensure they exist
      const user = await crud.getUserByDiscordId(discordId);
      if (!user) return sendErrorEmbed(interaction, t(l, 'user-not-found'));

      const channels = user.channels;
      if (channels.length === 0) return sendErrorEmbed(interaction, t(l, 'no-channels-found'));

      // Create a select menu for channel selection
      const channelMenu = new StringSelectMenuBuilder()
        .setCustomId('channel_delete_select' + discordId)
        .setPlaceholder(t(l, 'private-channel-delete-select'))
        .addOptions(channels.map(channel => ({
          label: channel.name,
          value: channel.channelId
        })));

      const row = new ActionRowBuilder().addComponents(channelMenu);
      await interaction.followUp({
        content: t(l, 'select-channel-to-delete'),
        components: [row],
        ephemeral: true,
      });

      // Create a collector for the channel selection
      const filter = i => i.customId === 'channel_delete_select' + discordId && i.user.id === discordId;
      const channelCollector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

      channelCollector.on('collect', async channelInteraction => {
        const channelId = channelInteraction.values[0];

        // Delete the VintedChannel
        await crud.deleteVintedChannelByChannelId(channelId);

        // Remove the channel from the user's channels list
        await crud.removeChannelFromUserByIds(interaction.user.id, channelId);

        await channelInteraction.update({
          content: t(l, 'private-channel-deleted'),
          components: []
        });

        try {
          const discordChannel = interaction.guild.channels.cache.get(channelId);
          await discordChannel.delete(`${interaction.user.username} deleted channel through /private_channel delete.`);
        } catch (error) {
          console.error('Error deleting private channel:', error);
          await sendErrorEmbed(interaction, t(l, 'private-channel-deleted-discord-error'));
        }
      });

    } catch (error) {
      console.error('Error deleting private channel:', error);
      await sendErrorEmbed(interaction, t(interaction.locale, 'private-channel-deleted-error'));
    }
  }
};