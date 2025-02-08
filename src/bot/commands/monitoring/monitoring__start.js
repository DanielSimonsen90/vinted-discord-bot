import { SlashCommandSubcommandBuilder } from "discord.js";
import { createBaseEmbed, sendErrorEmbed, sendWaitingEmbed, sendWarningEmbed } from '../../components/base_embeds.js';
import * as crud from '../../../crud.js';
import t from '../../../t.js';
import { Preference, ShippableMap } from '../../../database/index.js';
import { validateUrl, urlContainsSearchTextParameter, getDomainInUrl } from "../../../services/url_service.js";

export default {
  data: new SlashCommandSubcommandBuilder()
    .setName("start")
    .setDescription("Start monitoring this Vinted channel.")
    .addStringOption(option =>
      option.setName('url')
        .setDescription('The URL of the Vinted product page.')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('banned_keywords')
        .setDescription('Keywords to ban from the search results. (separate with commas -> "keyword1, keyword2")')
        .setRequired(false)),

  execute: async (interaction) => {
    const l = interaction.locale;
    await sendWaitingEmbed(interaction, t(l, 'starting-monitoring'));

    const discordId = interaction.user.id;
    const channelId = interaction.channel.id;
    const url = interaction.options.getString('url');
    const bannedKeywords = interaction.options.getString('banned_keywords')
      ? interaction.options.getString('banned_keywords').split(',').map(keyword => keyword.trim())
      : [];

    // validate the URL
    const validation = validateUrl(url);
    if (!validation) return sendErrorEmbed(interaction, t(l, validation));

    try {
      // Get the user
      const user = await crud.getUserByDiscordId(discordId);
      if (!user) return sendErrorEmbed(interaction, t(l, 'user-not-found'));

      // Find the VintedChannel by channelId and ensure it's owned by the user
      const vintedChannel = user.channels.find(channel => channel.channelId === channelId && channel.user === user.id);
      if (!vintedChannel) return sendErrorEmbed(interaction, t(l, 'channel-not-found-nor-owned'));

      // Check if URL is provided or present in the VintedChannel
      if (!url && !vintedChannel.url) return sendErrorEmbed(interaction, t(l, 'provide-vaild-url') + " " + t(l, url));

      // Check if the URL contains the search_text parameter
      if (urlContainsSearchTextParameter(url)) await sendWarningEmbed(interaction, t(l, 'url-contains-search-text'));

      const embed = await createBaseEmbed(
        interaction,
        t(l, 'monitoring-started'),
        t(l, 'monitoring-has-been-started', { url: url || vintedChannel.url }),
        0x00FF00
      );

      await interaction.followUp({ embeds: [embed] });

      const domain = getDomainInUrl(url);

      await crud.setVintedChannelPreference(channelId, Preference.Countries, [...ShippableMap[domain], domain]);
      await crud.setVintedChannelUpdatedAtNow(channelId);
      await crud.setVintedChannelBannedKeywords(channelId, bannedKeywords);

      // Update the VintedChannel with the provided URL (if any) and set isMonitoring to true
      await crud.startVintedChannelMonitoring(vintedChannel.id, url);
    } catch (error) {
      console.error('Error starting monitoring session:', error);
      await sendErrorEmbed(interaction, 'There was an error starting the monitoring session.');
    }
  }
}