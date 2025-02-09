import { SlashCommandSubcommandBuilder } from "discord.js";
import { createBaseEmbed, sendErrorEmbed, sendWaitingEmbed } from "../../components/base_embeds.js";
import * as crud from '../../../database/crud.js';
import LanguageService from "../../../services/language_service.js";

export default {
  data: new SlashCommandSubcommandBuilder()
    .setName("link")
    .setDescription("Create a public monitoring channel")
    .addStringOption(option =>
      option.setName('url')
        .setDescription('The URL of the Vinted product page.')
        .setRequired(true)),
  
  execute: async (interaction) => {
    const { t } = new LanguageService(interaction.guild.preferredLocale);

    try {
      await sendWaitingEmbed(interaction, t(l, 'please-wait'), t('creating-public-channel'));

      const isUserAdmin = await crud.isUserAdmin(interaction);
      if (!isUserAdmin) return sendErrorEmbed(interaction, t('not-allowed-to-create-public-channel'));

      // Create the VintedChannel
      await crud.createVintedChannel({
        channelId: interaction.channel.id,
        url: interaction.options.getString('url'),
        isMonitoring: true,
        type: 'public',
        user: null
      });

      const embed = await createBaseEmbed(
        interaction,
        t('public-channel-created'),
        t('public-channel-link-success', { url }),
        0x00FF00
      );

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error creating public channel:', error);
      await sendErrorEmbed(interaction, t('creating-public-channel-error', { error }));
    }
  }
}