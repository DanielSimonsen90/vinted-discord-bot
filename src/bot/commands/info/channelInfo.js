import { ContextMenuCommandBuilder, ApplicationCommandType, MessageContextMenuCommandInteraction } from "discord.js";
import { createBaseEmbed, sendErrorEmbed, sendWaitingEmbed } from "../../components/base_embeds.js";
import * as crud from '../../../crud.js';
import t from "../../../t.js";
import { Preference } from "../../../database/index.js";

export default {
  data: new ContextMenuCommandBuilder()
    .setName("Vintedbot Channel Info")
    .setType(ApplicationCommandType.Message),

  /**
   * @param {MessageContextMenuCommandInteraction} interaction 
   */
  execute: async (interaction) => {
    try {
      const l = interaction.locale;
      await sendWaitingEmbed(interaction, t(l, 'please-wait'));

      const { channelId } = interaction.targetMessage
      if (!channelId) return sendErrorEmbed(interaction, t(l, 'channel-id-required'));

      // Get the user
      const channel = await crud.getVintedChannelById(channelId);

      // Find the channel by id
      if (!channel) return sendErrorEmbed(interaction, t(l, 'channel-not-found'));

      const embed = await createBaseEmbed(
        interaction,
        t(l, 'channel-info'),
        t(l, 'channel-info-success'),
        0x00FF00
      );

      embed.setFields([
        { name: `${t(l, 'channel-id')}`, value: `${channel.id} ` },
        { name: `${t(l, 'name')}`, value: `${channel.name} `, inline: true },
        { name: `${t(l, 'url')}`, value: `${channel.url} ` },
        { name: `${t(l, 'monitoring')}`, value: `${channel.isMonitoring} `, inline: true },
        { name: `${t(l, 'type')}`, value: `${channel.type} `, inline: true },
        { name: `${t(l, 'country-whitelist')}`, value: `${channel.preferences[Preference.Countries]?.join(', ') || []} `, inline: true },
        { name: `${t(l, 'user-mentions')}`, value: `${channel.preferences[Preference.Mention] || false} `, inline: true }
      ]);
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error(`Error retrieving info:`, error);
      await sendErrorEmbed(interaction, 'There was an error retrieving the info.');
    }
  }
};