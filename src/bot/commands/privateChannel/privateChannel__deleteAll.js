import { SlashCommandSubcommandBuilder } from 'discord.js';
import { sendErrorEmbed, sendWaitingEmbed, createBaseEmbed } from "../../components/base_embeds.js";
import * as crud from '../../../crud.js';
import t from '../../../t.js';

export default {
  data: new SlashCommandSubcommandBuilder()
    .setName("delete_all")
    .setDescription("Delete all private monitoring channels. Only usable by admins."),

  execute: async (interaction) => {
    try {
      const l = interaction.locale;
      await sendWaitingEmbed(interaction, t(l, 'all-private-channels-deleted'));

      // Check if the user is an admin
      const isAdmin = await crud.isUserAdmin(interaction);
      if (!isAdmin) return sendErrorEmbed(interaction, t(l, 'admin-only-command'));

      // Fetch all private Vinted channels
      const channels = crud.getAllPrivateVintedChannels();
      if (channels.length === 0) return sendErrorEmbed(interaction, t(l, 'no-private-channels-found'));

      // Loop through each private channel and delete it with a delay
      for (const channel of channels) {
        const discordChannel = interaction.guild.channels.cache.get(channel.channelId);

        // Delete the VintedChannel from the database
        await crud.deleteVintedChannelByChannelId(channel.channelId);

        // Delete the Discord channel if it exists
        if (discordChannel) {
          await discordChannel.delete();
        }

        // Send a message for each channel deleted
        const embed = await createBaseEmbed(
          interaction,
          t(l, 'private-channel-deleted'),
          t(l, 'private-channel-deleted-success', { channelId: channel.channelId }),
          0xFF0000
        );

        await interaction.followUp({ embeds: [embed], ephemeral: true });
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      const finalEmbed = await createBaseEmbed(
        interaction,
        t(l, 'all-private-channels-deleted'),
        t(l, 'all-private-channels-deleted-success'),
        0xFF0000
      );

      await interaction.followUp({ embeds: [finalEmbed], ephemeral: true });

    } catch (error) {
      console.error('Error deleting all private channels:', error);
      await sendErrorEmbed(interaction, t(l, 'all-private-channels-deleted-error', { error }));
    }
  }
};