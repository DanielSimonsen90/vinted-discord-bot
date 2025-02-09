import { SlashCommandSubcommandBuilder } from "discord.js";
import { createBaseEmbed, sendErrorEmbed, sendWaitingEmbed } from '../../components/base_embeds.js';
import * as crud from '../../../database/crud.js';
import LanguageService from "../../../services/language_service.js";

export default {
  data: new SlashCommandSubcommandBuilder()
    .setName("set_max_channels")
    .setDescription('Set the maximum number of channels for a user.')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to set the maximum number of channels for.')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('max_channels')
        .setDescription('The maximum number of channels.')
        .setRequired(true)),

  execute: async (interaction) => {
    const { t } = new LanguageService(interaction.locale);

    try {
      await sendWaitingEmbed(interaction, t('please-wait'));

      const discordId = interaction.options.getUser('user').id || interaction.user.id;
      const maxChannels = interaction.options.getInteger('max_channels');
      const isUserAdmin = await crud.isUserAdmin(interaction);

      if (!isUserAdmin) return sendErrorEmbed(interaction, t('not-authorized'));

      // Set the maximum number of channels for the user
      const user = await crud.setUserMaxChannels(discordId, maxChannels);
      if (!user) return sendErrorEmbed(interaction, t('user-not-found'));

      const embed = await createBaseEmbed(
        interaction,
        t('max-channels-set'),
        t('max-channels-set-success', { maxChannels }),
        0x00FF00
      );

      embed.setFields([
        { name: `${t('user-id')}`, value: `${user.id} ` },
        { name: `${t('discord-id')}`, value: `${user.discordId} ` },
        { name: `${t('max-channels')}`, value: `${user.maxChannels} `, inline: true },
      ]);

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error(`Error setting max channels:`, error);
      await sendErrorEmbed(interaction, 'There was an error setting the max channels.');
    }
  }
}