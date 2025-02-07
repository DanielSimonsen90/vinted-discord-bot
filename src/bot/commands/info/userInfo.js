import { ContextMenuCommandBuilder, ApplicationCommandType, UserContextMenuCommandInteraction } from "discord.js";
import { createBaseEmbed, sendErrorEmbed, sendWaitingEmbed } from "../../components/base_embeds.js";
import * as crud from '../../../crud.js';
import t from "../../../t.js";
import { Preference } from "../../../database/index.js";

export default {
  data: new ContextMenuCommandBuilder()
    .setName("Vintedbot User Info")
    .setType(ApplicationCommandType.User),

  /**
   * @param {UserContextMenuCommandInteraction} interaction 
   */
  execute: async (interaction) => {
    try {
      const l = interaction.locale;
      await sendWaitingEmbed(interaction, t(l, 'please-wait'));
  
      const user = await crud.getUserByDiscordId(interaction.targetUser.id);
      if (!user) return sendErrorEmbed(interaction, t(l, 'user-not-found'));
  
      const embed = await createBaseEmbed(
        interaction,
        t(l, 'user-info'),
        t(l, 'user-info-success'),
        0x00FF00
      );
  
      const userNumberOfChannels = user.channels.length;
  
      embed.setImage('avatarURL' in interaction.targetMember 
        ? interaction.targetMember.avatarURL() 
        : interaction.targetUser.displayAvatarURL()
      ).setFields([
        { name: `${t(l, 'user-id')}`, value: `${user.id} ` },
        { name: `${t(l, 'max-channels')}`, value: `${userNumberOfChannels} / ${user.maxChannels} `, inline: true },
        { name: `${t(l, 'country-whitelist')}`, value: `${user.preferences[Preference.Countries] || []} `, inline: true },
        { name: `${t(l, 'user-mentions')}`, value: `${user.preferences[Preference.Mention] || false} `, inline: true }
      ]);
  
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error(`Error retrieving info:`, error);
      await sendErrorEmbed(interaction, 'There was an error retrieving the info.');
    }
  }
};