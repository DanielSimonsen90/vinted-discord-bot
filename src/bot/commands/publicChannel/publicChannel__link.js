import { SlashCommandSubcommandBuilder } from "discord.js";
import { createBaseEmbed, sendErrorEmbed, sendWaitingEmbed } from "../../components/base_embeds.js";
import * as crud from '../../../crud.js';
import t from "../../../t.js";

export default {
  data: new SlashCommandSubcommandBuilder()
    .setName("link")
    .setDescription("Create a public monitoring channel")
    .addStringOption(option =>
      option.setName('url')
        .setDescription('The URL of the Vinted product page.')
        .setRequired(true)),
  
  execute: async (interaction) => {
    const { locale: l } = interaction;
    try {
      await sendWaitingEmbed(interaction, t(l, 'please-wait'), t(l, 'creating-public-channel'));

      const isUserAdmin = await crud.isUserAdmin(interaction);
      if (!isUserAdmin) return sendErrorEmbed(interaction, t(l, 'not-allowed-to-create-public-channel'));

      const url = interaction.options.getString('url');

      // Create the VintedChannel
      const channelId = interaction.channel.id;
      await crud.createVintedChannel({
        channelId,
        url: url,
        isMonitoring: true,
        type: 'public',
        user: null
      });

      const embed = await createBaseEmbed(
        interaction,
        t(l, 'public-channel-created'),
        t(l, 'public-channel-link-success', { url }),
        0x00FF00
      );

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error creating public channel:', error);
      await sendErrorEmbed(interaction, t(l, 'creating-public-channel-error', { error }));
    }
  }
}