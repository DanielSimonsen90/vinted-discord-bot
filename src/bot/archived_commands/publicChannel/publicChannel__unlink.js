import { SlashCommandSubcommandBuilder } from "discord.js";
import { createBaseEmbed, sendErrorEmbed, sendWaitingEmbed } from "../../components/base_embeds.js";
import * as crud from '../../../database/crud.js';
import LanguageService from "../../../services/language_service.js";

export default {
  data: new SlashCommandSubcommandBuilder()
    .setName("unlink")
    .setDescription("Unlink a public monitoring channel"),

  execute: async (interaction) => {
    const { t } = new LanguageService(interaction.guild.preferredLocale);

    try {
      await sendWaitingEmbed(interaction, t('deleting-public-channel'));

      const isUserAdmin = await crud.isUserAdmin(interaction);
      if (!isUserAdmin) return sendErrorEmbed(interaction, t('not-allowed-to-delete-public-channel'));

      const channelId = interaction.channel.id;

      // Find the VintedChannel by channelId
      const vintedChannel = await crud.getVintedChannelById(channelId);
      if (!vintedChannel || vintedChannel.type !== 'public') return sendErrorEmbed(interaction, t('public-channel-not-found'));

      // Delete the VintedChannel from the database
      await crud.deleteVintedChannel(vintedChannel.id);

      const embed = await createBaseEmbed(
        interaction,
        t('public-channel-deleted'),
        t('public-channel-deleted-success'),
        0xFF0000
      );

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error deleting public channel:', error);
      await sendErrorEmbed(interaction, t('public-channel-deleted-error', { error }));
    }
  }
};