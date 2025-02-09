import { ContextMenuCommandBuilder, ApplicationCommandType, MessageContextMenuCommandInteraction } from "discord.js";
import { createBaseEmbed, sendErrorEmbed, sendWaitingEmbed } from "../../components/base_embeds.js";
import * as crud from '../../../database/crud.js';
import { Preference } from "../../../database/index.js";
import LanguageService from "../../../services/language_service.js";

export default {
  data: new ContextMenuCommandBuilder()
    .setName("Vintedbot Channel Info")
    .setType(ApplicationCommandType.Message),

  /**
   * @param {MessageContextMenuCommandInteraction} interaction 
   */
  execute: async (interaction) => {
    const { t } = new LanguageService(interaction.locale);

    try {
      await sendWaitingEmbed(interaction, t('please-wait'));

      const { channelId } = interaction.targetMessage
      if (!channelId) return sendErrorEmbed(interaction, t('channel-id-required'));

      // Get the user
      const channel = await crud.getVintedChannelById(channelId);

      // Find the channel by id
      if (!channel) return sendErrorEmbed(interaction, t('channel-not-found'));

      const embed = await createBaseEmbed(
        interaction,
        t('channel-info'),
        t('channel-info-success'),
        0x00FF00
      );

      embed.setFields([
        { name: `${t('channel-id')}`, value: `${channel.id} ` },
        { name: `${t('name')}`, value: `${channel.name} `, inline: true },
        { name: `${t('url')}`, value: `${channel.url} ` },
        { name: `${t('monitoring')}`, value: `${channel.isMonitoring} `, inline: true },
        { name: `${t('type')}`, value: `${channel.type} `, inline: true },
        { name: `${t('country-whitelist')}`, value: `${channel.preferences[Preference.Countries]?.join(', ') || []} `, inline: true },
        { name: `${t('user-mentions')}`, value: `${channel.preferences[Preference.Mention] || false} `, inline: true }
      ]);
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error(`Error retrieving info:`, error);
      await sendErrorEmbed(interaction, 'There was an error retrieving the info.');
    }
  }
};