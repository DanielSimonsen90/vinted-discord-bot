import { SlashCommandSubcommandBuilder } from "discord.js";
import { createBaseEmbed, sendErrorEmbed, sendWaitingEmbed } from '../../components/base_embeds.js';
import * as crud from '../../../database/crud.js';
import LanguageService from "../../../services/language_service.js";

export default {
  data: new SlashCommandSubcommandBuilder()
    .setName("stop")
    .setDescription("Stop monitoring this Vinted channel."),

  execute: async (interaction) => {
    const { t } = new LanguageService(interaction.locale);
    await sendWaitingEmbed(interaction, t('stopping-monitoring'));

    const discordId = interaction.user.id;
    const channelId = interaction.channel.id;

    try {
      // Get the user
      const user = await crud.getUserByDiscordId(discordId);
      if (!user) return sendErrorEmbed(interaction, t('user-not-found'));

      // Find the VintedChannel by channelId and ensure it's owned by the user
      const vintedChannel = user.channels.find(channel => channel.channelId === channelId);
      if (!vintedChannel) return sendErrorEmbed(interaction, t('channel-not-found-nor-owned'));

      const embed = await createBaseEmbed(
        interaction,
        t('monitoring-stopped'),
        t('monitoring-has-been-stopped'),
        0xFF0000
      );

      // Update the VintedChannel and set isMonitoring to false
      await crud.stopVintedChannelMonitoring(vintedChannel.id);
      await crud.setVintedChannelUpdatedAtNow(channelId);
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error stopping monitoring session:', error);
      await sendErrorEmbed(interaction, t('monitoring-stopped-error', { error }));
    }
  }
};