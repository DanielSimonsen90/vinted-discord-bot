import { ContextMenuCommandBuilder, ApplicationCommandType, UserContextMenuCommandInteraction } from "discord.js";
import { createBaseEmbed, sendErrorEmbed, sendWaitingEmbed } from "../../components/base_embeds.js";
import * as crud from '../../../database/crud.js';
import { Preference } from "../../../database/index.js";
import LanguageService from "../../../services/language_service.js";

export default {
  data: new ContextMenuCommandBuilder()
    .setName("Vintedbot User Info")
    .setType(ApplicationCommandType.User),

  /**
   * @param {UserContextMenuCommandInteraction} interaction 
   */
  execute: async (interaction) => {
    const { t } = new LanguageService(interaction.locale);
    
    try {
      await sendWaitingEmbed(interaction, t('please-wait'));
  
      const user = await crud.getUserByDiscordId(interaction.targetUser.id);
      if (!user) return sendErrorEmbed(interaction, t('user-not-found'));
  
      const embed = await createBaseEmbed(
        interaction,
        t('user-info'),
        t('user-info-success'),
        0x00FF00
      );
  
      const userNumberOfChannels = user.channels.length;
  
      embed.setImage('avatarURL' in interaction.targetMember 
        ? interaction.targetMember.avatarURL() 
        : interaction.targetUser.displayAvatarURL()
      ).setFields([
        { name: `${t('user-id')}`, value: `${user.id} ` },
        { name: `${t('max-channels')}`, value: `${userNumberOfChannels} / ${user.maxChannels} `, inline: true },
        { name: `${t('country-whitelist')}`, value: `${user.preferences[Preference.Countries] || []} `, inline: true },
        { name: `${t('user-mentions')}`, value: `${user.preferences[Preference.Mention] || false} `, inline: true }
      ]);
  
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error(`Error retrieving info:`, error);
      await sendErrorEmbed(interaction, 'There was an error retrieving the info.');
    }
  }
};