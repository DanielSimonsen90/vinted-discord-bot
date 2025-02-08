import { ActionRowBuilder, CommandInteraction, ModalBuilder, SlashCommandBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { validateUrl, urlContainsSearchTextParameter, getDomainInUrl } from '../../services/url_service.js';
import t from "../../t.js";
import { createBaseEmbed, sendWaitingEmbed, sendErrorEmbed, sendWarningEmbed } from "../components/base_embeds.js";
import * as crud from '../../crud.js';
import { Preference, ShippableMap } from '../../database/index.js';

const URL_KEY = "url";
const BANNED_WORDS_KEY = "bannede_ord";

export default {
  data: new SlashCommandBuilder()
    .setName("start")
    .setDescription("Start udkiggelse efter produkter, der matcher vinteds søgrefiltre.")
    .addStringOption(builder => builder
      .setName(URL_KEY)
      .setDescription("Vinted URL med søgefiltre")
    )
    .addStringOption(builder => builder
      .setName(BANNED_WORDS_KEY)
      .setDescription("Ignorerde ord. Adskil med komma (,)")
    ),

  /**
   * @param {CommandInteraction} interaction
   */
  execute: async (interaction) => {
    const { channelId, user: { id: discordId }, locale: l } = interaction;
    const [url, bannedWordsString] = await ensureUrl(interaction);
    const bannedKeywords = bannedWordsString ? bannedWordsString.split(',').map(word => word.trim()) : [];

    await sendWaitingEmbed(interaction, t(l, 'starting-monitoring'));

    const validation = validateUrl(url);
    if (!validation) return sendErrorEmbed(interaction, t(l, validation));

    try {
      // Get the user
      const user = await crud.getUserByDiscordId(discordId);
      if (!user) return sendErrorEmbed(interaction, t(l, 'user-not-found'));

      // Find the VintedChannel by channelId and ensure it's owned by the user
      const vintedChannel = user.channels.find(channel => channel.channelId === channelId && channel.user === user.id);
      if (!vintedChannel) return sendErrorEmbed(interaction, t(l, 'channel-not-found-nor-owned'));

      // Check if the URL contains the search_text parameter
      if (urlContainsSearchTextParameter(url)) await sendWarningEmbed(interaction, t(l, 'url-contains-search-text'));

      const embed = await createBaseEmbed(
        interaction,
        t(l, 'monitoring-started'),
        t(l, 'monitoring-has-been-started', { url: url ?? vintedChannel.url }),
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
};

/**
 * @param {CommandInteraction} interaction
 * @returns {Promise<[url: string, bannedWords?: string]>}
 */
async function ensureUrl(interaction) {
  const urlOption = interaction.options.getString(URL_KEY);
  const bannedWordsOption = interaction.options.getString(BANNED_WORDS_KEY);
  if (urlOption) return [urlOption, bannedWordsOption];

  const modalId = 'vintedbot.start.modal';
  const urlInputId = 'vintedbot.start.url-input';
  const bannedWordsId = 'vintedbot.start.banned-words-input';

  interaction.showModal(new ModalBuilder()
    .setCustomId(modalId)
    .setTitle("Start udkiggelse på Vinted")
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId(urlInputId)
          .setLabel("Vinted URL med søgrefiltre")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setPlaceholder("Indsæt vinted url som: https://www.vinted.dk/catalog?...")),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId(bannedWordsId)
          .setLabel("Ignorerde ord. Adskil med komma (,)")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(false)
      ),
    ));

  const modalInteraction = await interaction.awaitModalSubmit({
    time: 60_000,
    filter: modalInteraction => (
      modalInteraction.user.id === interaction.user.id
      && modalInteraction.customId === modalId
    )
  });

  return [urlInputId, bannedWordsId].map(modalInteraction.fields.getTextInputValue);
}